'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyCompanyPermission } from '@/lib/permissions'
import { buildReportSnapshot, BuildSnapshotParams } from '@/lib/reports/snapshot-engine'
import { generateReportPDFBuffer } from '@/lib/reports/pdf-generator'
import { generateReportExcelBuffer } from '@/lib/reports/excel-generator'
import { uploadReportExportFile, getReportExportSignedUrl } from '@/lib/reports/storage'
import { PlatformType, ReportType } from '@/lib/reports/types'

export interface GenerateReportInput {
  companyId: string
  reportType: ReportType
  reportTitle?: string
  periodStart?: string
  periodEnd?: string
  comparisonStart?: string
  comparisonEnd?: string
  includedPlatforms?: PlatformType[]
  includedSections?: string[]
  preparedBy?: string
  executiveSummaryNotes?: string
  marketingNotes?: string
  recommendationsNotes?: string
}

export async function generateReportAction(input: GenerateReportInput) {
  const supabase = await createClient()

  // 1. Verify User Authentication & Permission
  const perm = await verifyCompanyPermission(input.companyId, ['owner', 'admin', 'marketing_manager'])
  if (!perm.authorized) {
    throw new Error('Unauthorized: Only Marketing Managers, Admins, or Owners can generate reports.')
  }
  const user = (await supabase.auth.getUser()).data.user!

  // 2. Build Immutable Report Snapshot
  const snapshotParams: BuildSnapshotParams = {
    companyId: input.companyId,
    reportType: input.reportType,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    comparisonStart: input.comparisonStart,
    comparisonEnd: input.comparisonEnd,
    includedPlatforms: input.includedPlatforms,
    preparedBy: input.preparedBy,
    reportTitle: input.reportTitle,
    notes: {
      executiveSummaryNotes: input.executiveSummaryNotes,
      marketingNotes: input.marketingNotes,
      recommendationsNotes: input.recommendationsNotes
    }
  }

  const snapshot = await buildReportSnapshot(supabase, snapshotParams)

  // 3. Save Record in `generated_reports` Table
  const { data: reportRow, error: insertErr } = await supabase
    .from('generated_reports')
    .insert({
      company_id: input.companyId,
      report_title: snapshot.report.title,
      report_type: snapshot.report.type,
      period_start: snapshot.report.periodStart,
      period_end: snapshot.report.periodEnd,
      comparison_start: snapshot.report.comparisonStart,
      comparison_end: snapshot.report.comparisonEnd,
      timezone: snapshot.company.timezone,
      week_starts_on: snapshot.company.weekStartsOn,
      prepared_by: snapshot.report.preparedBy,
      generated_by: user.id,
      status: 'generating',
      included_platforms: input.includedPlatforms || ['facebook', 'youtube', 'instagram', 'tiktok'],
      included_sections: input.includedSections || [],
      executive_summary: input.executiveSummaryNotes,
      marketing_notes: input.marketingNotes,
      recommendations: input.recommendationsNotes,
      report_data: snapshot as unknown as Record<string, unknown>,
      data_availability: snapshot.dataAvailability as unknown as Record<string, unknown>[],
      version_number: 1
    })
    .select('id')
    .single()

  if (insertErr || !reportRow) {
    console.error('Failed to insert generated_reports row:', insertErr)
    throw new Error(`Failed to create report record: ${insertErr?.message || 'Database error'}`)
  }

  const reportId = reportRow.id
  snapshot.report.id = reportId

  // Update report_data with actual ID
  await supabase
    .from('generated_reports')
    .update({ report_data: snapshot as unknown as Record<string, unknown> })
    .eq('id', reportId)

  // 4. Generate & Store PDF Export
  let pdfSignedUrl = '#'
  try {
    const pdfBuffer = await generateReportPDFBuffer(snapshot)
    const pdfUpload = await uploadReportExportFile(supabase, input.companyId, reportId, 'pdf', pdfBuffer)
    pdfSignedUrl = pdfUpload.signedUrl

    await supabase.from('report_exports').insert({
      generated_report_id: reportId,
      company_id: input.companyId,
      export_type: 'pdf',
      file_name: `${snapshot.report.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      storage_path: pdfUpload.storagePath,
      file_size_bytes: pdfUpload.fileSizeBuffer,
      generated_by: user.id,
      status: 'completed'
    })
  } catch (pdfErr: unknown) {
    console.error('PDF export failed:', pdfErr)
    await supabase.from('report_exports').insert({
      generated_report_id: reportId,
      company_id: input.companyId,
      export_type: 'pdf',
      file_name: 'report.pdf',
      storage_path: '',
      file_size_bytes: 0,
      generated_by: user.id,
      status: 'failed',
      safe_error_message: (pdfErr as Error).message || 'PDF Generation failed'
    })
  }

  // 5. Generate & Store Excel Export
  let excelSignedUrl = '#'
  try {
    const excelBuffer = await generateReportExcelBuffer(snapshot)
    const excelUpload = await uploadReportExportFile(supabase, input.companyId, reportId, 'xlsx', excelBuffer)
    excelSignedUrl = excelUpload.signedUrl

    await supabase.from('report_exports').insert({
      generated_report_id: reportId,
      company_id: input.companyId,
      export_type: 'xlsx',
      file_name: `${snapshot.report.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`,
      storage_path: excelUpload.storagePath,
      file_size_bytes: excelUpload.fileSizeBuffer,
      generated_by: user.id,
      status: 'completed'
    })
  } catch (excelErr: unknown) {
    console.error('Excel export failed:', excelErr)
    await supabase.from('report_exports').insert({
      generated_report_id: reportId,
      company_id: input.companyId,
      export_type: 'xlsx',
      file_name: 'report.xlsx',
      storage_path: '',
      file_size_bytes: 0,
      generated_by: user.id,
      status: 'failed',
    })
  }

  // 6. Update status to 'generated' & Audit Log
  await supabase
    .from('generated_reports')
    .update({ status: 'generated' })
    .eq('id', reportId)

  await supabase.from('audit_logs').insert({
    company_id: input.companyId,
    user_id: user.id,
    action: 'report_generated',
    entity_type: 'generated_reports',
    entity_id: reportId,
    summary: `Generated ${snapshot.report.type} report "${snapshot.report.title}"`,
    metadata: { reportId, periodStart: snapshot.report.periodStart, periodEnd: snapshot.report.periodEnd }
  })

  return {
    success: true,
    reportId,
    pdfSignedUrl,
    excelSignedUrl,
    snapshot
  }
}

export async function createReportRevisionAction(reportId: string) {
  const supabase = await createClient()

  // Fetch original report
  const { data: origReport } = await supabase
    .from('generated_reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (!origReport) throw new Error('Original report not found')

  const perm = await verifyCompanyPermission(origReport.company_id, ['owner', 'admin', 'marketing_manager'])
  if (!perm.authorized) throw new Error('Unauthorized')

  const newVersion = (origReport.version_number || 1) + 1

  // Re-run snapshot with fresh data
  const snapshotParams: BuildSnapshotParams = {
    companyId: origReport.company_id,
    reportType: origReport.report_type as ReportType,
    periodStart: origReport.period_start,
    periodEnd: origReport.period_end,
    comparisonStart: origReport.comparison_start,
    comparisonEnd: origReport.comparison_end,
    includedPlatforms: origReport.included_platforms as PlatformType[],
    preparedBy: origReport.prepared_by,
    reportTitle: `${origReport.report_title} (v${newVersion})`,
    notes: {
      executiveSummaryNotes: origReport.executive_summary,
      marketingNotes: origReport.marketing_notes,
      recommendationsNotes: origReport.recommendations
    }
  }

  const snapshot = await buildReportSnapshot(supabase, snapshotParams)
  snapshot.report.versionNumber = newVersion
  snapshot.report.revisionOf = reportId

  const result = await generateReportAction({
    companyId: origReport.company_id,
    reportType: origReport.report_type as ReportType,
    reportTitle: `${origReport.report_title} (v${newVersion})`,
    periodStart: origReport.period_start,
    periodEnd: origReport.period_end,
    comparisonStart: origReport.comparison_start,
    comparisonEnd: origReport.comparison_end,
    includedPlatforms: origReport.included_platforms as PlatformType[],
    includedSections: origReport.included_sections,
    preparedBy: origReport.prepared_by,
    executiveSummaryNotes: origReport.executive_summary,
    marketingNotes: origReport.marketing_notes,
    recommendationsNotes: origReport.recommendations
  })

  // Set revision_of and version_number on newly created report
  await supabase
    .from('generated_reports')
    .update({ revision_of: reportId, version_number: newVersion })
    .eq('id', result.reportId)

  return result
}

export async function archiveReportAction(reportId: string) {
  const supabase = await createClient()

  const { data: report } = await supabase
    .from('generated_reports')
    .select('company_id')
    .eq('id', reportId)
    .single()

  if (!report) throw new Error('Report not found')

  const perm = await verifyCompanyPermission(report.company_id, ['owner', 'admin', 'marketing_manager'])
  if (!perm.authorized) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('generated_reports')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('id', reportId)

  if (error) throw new Error(`Archive failed: ${error.message}`)

  return { success: true }
}

export async function getExportDownloadUrlAction(exportId: string) {
  const supabase = await createClient()

  const { data: exportRow } = await supabase
    .from('report_exports')
    .select('storage_path, company_id')
    .eq('id', exportId)
    .single()

  if (!exportRow || !exportRow.storage_path) {
    throw new Error('Export file not found')
  }

  const perm = await verifyCompanyPermission(exportRow.company_id, ['owner', 'admin', 'marketing_manager', 'viewer'])
  if (!perm.authorized) throw new Error('Unauthorized')

  const signedUrl = await getReportExportSignedUrl(supabase, exportRow.storage_path)
  return { signedUrl }
}
