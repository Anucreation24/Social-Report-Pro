'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyCompanyPermission } from '@/lib/permissions'
import { validateFileMetadata, parseCSVContent, parseXLSXBuffer, normalizeAndValidateRow, ParsedFileResult } from '@/lib/imports/import-parser'
import { autoDetectColumnMappings, FieldMapping } from '@/lib/imports/column-mapping'
import { calculateFileChecksum, checkFileDuplicate } from '@/lib/imports/deduplication'
import { DATA_SOURCE_PRIORITIES } from '@/lib/analytics/source-priority'
import { detectPlatformFromSignals } from '@/lib/imports/platform-detector'
import { detectReportTypeFromHeaders } from '@/lib/imports/report-type-detector'
import { computeFileSignature, matchImportProfile, saveImportProfile } from '@/lib/imports/import-profile-engine'

export interface UploadParseInput {
  companyId: string
  platform: 'facebook' | 'instagram' | 'youtube' | 'tiktok'
  importType: 'account_summary' | 'daily_overview' | 'content_performance' | 'video_performance' | 'audience_growth' | 'generic_metrics'
  periodStart?: string
  periodEnd?: string
}

export async function uploadAndParseImportFileAction(formData: FormData) {
  try {
    const supabase = await createClient()

    const file = formData.get('file') as File | null
    const companyId = formData.get('companyId') as string
    let platform = formData.get('platform') as 'facebook' | 'instagram' | 'youtube' | 'tiktok' | null
    let importType = formData.get('importType') as ConfirmImportInput['importType'] | null
    const periodStart = formData.get('periodStart') as string || undefined
    const periodEnd = formData.get('periodEnd') as string || undefined

    if (!file || !companyId) {
      throw new Error('Missing required upload parameters.')
    }

    // 1. Verify Company Permission (Marketing Manager, Admin, Owner)
    const perm = await verifyCompanyPermission(companyId, ['owner', 'admin', 'marketing_manager'])
    if (!perm.authorized) {
      throw new Error(perm.error || 'Unauthorized: Insufficient permissions.')
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      throw new Error('Unauthenticated user session.')
    }

    // 2. Validate File Metadata
    const fileVal = validateFileMetadata(file)
    if (!fileVal.valid) {
      throw new Error(fileVal.error || 'Invalid file.')
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const checksum = calculateFileChecksum(fileBuffer)

    // 3. Parse Content (CSV vs XLSX)
    const ext = file.name.split('.').pop()?.toLowerCase()
    let parsedResult: ParsedFileResult

    if (ext === 'xlsx') {
      parsedResult = await parseXLSXBuffer(fileBuffer, file.name)
    } else {
      const text = fileBuffer.toString('utf8')
      parsedResult = parseCSVContent(text, file.name)
    }

    if (!parsedResult.rows || parsedResult.rows.length === 0) {
      throw new Error('The uploaded file contains 0 data rows.')
    }

    // 4. Platform & Report Type Auto-Detection
    const platformDetection = detectPlatformFromSignals(parsedResult.headers || [], file.name, parsedResult.selectedSheet || '')
    if (!platform || (platform as string) === 'generic') {
      platform = (platformDetection.detectedPlatform !== 'generic' ? platformDetection.detectedPlatform : 'facebook') as 'facebook' | 'instagram' | 'youtube' | 'tiktok'
    }

    const reportTypeDetection = detectReportTypeFromHeaders(parsedResult.headers || [])
    if (!importType) {
      importType = reportTypeDetection.detectedReportType
    }

    // 5. File Signature & Reusable Import Profile Match (safely caught)
    const effectivePlatform = platform || 'facebook'
    const fileSig = computeFileSignature(parsedResult.headers || [], parsedResult.selectedSheet || '')
    let matchedProfile = null
    try {
      matchedProfile = await matchImportProfile(supabase, companyId, effectivePlatform, fileSig)
    } catch (profErr) {
      console.error('matchImportProfile caught error:', profErr)
    }

    // 6. Check for File Duplicate (safely caught)
    let dupCheck = { isDuplicate: false }
    try {
      dupCheck = await checkFileDuplicate(supabase, companyId, effectivePlatform, checksum)
    } catch (dupErr) {
      console.error('checkFileDuplicate caught error:', dupErr)
    }

    // 7. Upload original file to private storage bucket 'data-imports' (safely caught)
    let storagePath: string | null = null
    try {
      const dateObj = new Date()
      const year = dateObj.getFullYear()
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      storagePath = `${companyId}/imports/${year}/${month}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

      await supabase.storage
        .from('data-imports')
        .upload(storagePath, fileBuffer, {
          contentType: file.type || (ext === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv'),
          upsert: true
        })
    } catch (stgErr) {
      console.error('Storage upload caught error:', stgErr)
    }

    // 8. Auto-detect Column Mappings (or use saved import profile mapping)
    const detectedMappings = matchedProfile ? matchedProfile.mapping_config : autoDetectColumnMappings(parsedResult.headers || [])

    // 9. Draft Batch ID
    let batchId = crypto.randomUUID()
    try {
      const { data: batchData, error: batchErr } = await supabase
        .from('data_import_batches')
        .insert({
          company_id: companyId,
          platform: effectivePlatform,
          import_type: importType || 'daily_overview',
          source_type: ext === 'xlsx' ? 'excel_import' : 'csv_import',
          reporting_period_start: periodStart || null,
          reporting_period_end: periodEnd || null,
          original_file_name: file.name,
          file_size_bytes: file.size,
          file_checksum: checksum,
          storage_path: storagePath,
          status: 'pending',
          total_rows: parsedResult.totalRows,
          imported_by: user.id
        })
        .select('id')
        .single()

      if (!batchErr && batchData?.id) {
        batchId = batchData.id
      }
    } catch (dbErr) {
      console.error('Insert data_import_batches draft caught error:', dbErr)
    }

    return {
      batchId,
      fileName: file.name,
      fileSignature: fileSig,
      checksum,
      platform: effectivePlatform,
      importType: importType || 'daily_overview',
      detectedPlatformInfo: platformDetection,
      detectedReportTypeInfo: reportTypeDetection,
      matchedProfile,
      isDuplicate: dupCheck.isDuplicate,
      headers: parsedResult.headers || [],
      totalRows: parsedResult.totalRows || 0,
      sampleRows: (parsedResult.rows || []).slice(0, 10),
      detectedMappings
    }
  } catch (err: unknown) {
    console.error('uploadAndParseImportFileAction exception caught:', err)
    throw err
  }
}

export interface ConfirmImportInput {
  batchId: string
  companyId: string
  platform: 'facebook' | 'instagram' | 'youtube' | 'tiktok'
  importType: 'account_summary' | 'daily_overview' | 'content_performance' | 'video_performance' | 'audience_growth' | 'generic_metrics'
  mappings: FieldMapping[]
  rawRows: Record<string, unknown>[]
  dateFormatPreference?: 'auto' | 'DMY' | 'MDY'
  selectedYear?: number
}

export async function confirmImportBatchAction(input: ConfirmImportInput) {
  try {
    const supabase = await createClient()

    // 1. Verify Permission
    const perm = await verifyCompanyPermission(input.companyId, ['owner', 'admin', 'marketing_manager'])
    if (!perm.authorized) {
      throw new Error(perm.error || 'Unauthorized: Insufficient permissions.')
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      throw new Error('Unauthenticated user session.')
    }

    const sourceType = 'csv_import'
    const sourcePriority = DATA_SOURCE_PRIORITIES[sourceType]

    let validCount = 0
    let invalidCount = 0
    let warningCount = 0
    const duplicateCount = 0
    let importedCount = 0

    const snapshotInserts: Record<string, unknown>[] = []
    const contentItemInserts: Record<string, unknown>[] = []
    const contentMetricInserts: Record<string, unknown>[] = []
    const importRowLogs: Record<string, unknown>[] = []

    const rowsToProcess = input.rawRows || []

    // 2. Normalize and validate every row
    for (let idx = 0; idx < rowsToProcess.length; idx++) {
      const rowNum = idx + 1
      const rawRow = rowsToProcess[idx] || {}

      const normalized = normalizeAndValidateRow(
        rawRow,
        rowNum,
        input.mappings || [],
        input.companyId,
        input.platform,
        input.importType,
        input.dateFormatPreference || 'auto',
        input.selectedYear
      )

      if (normalized.status === 'invalid') {
        invalidCount++
      } else {
        if (normalized.status === 'warning') warningCount++
        validCount++

        if (input.importType === 'account_summary' || input.importType === 'daily_overview' || input.importType === 'audience_growth' || input.importType === 'generic_metrics') {
          const snapDate = normalized.normalizedData.date as string
          if (snapDate) {
            const metricKeys = [
              'audience_total', 'audience_gained', 'audience_lost', 'reach',
              'impressions', 'views', 'engagements', 'likes', 'comments',
              'shares', 'saves', 'clicks', 'profile_views', 'watch_time_seconds'
            ]

            metricKeys.forEach(mKey => {
              const val = normalized.normalizedData[mKey]
              if (val !== undefined && val !== null) {
                snapshotInserts.push({
                  company_id: input.companyId,
                  platform_connection_id: null,
                  provider: input.platform,
                  snapshot_date: snapDate,
                  aggregation_level: 'daily',
                  metric_name: mKey,
                  metric_value: val,
                  raw_data: rawRow,
                  data_source: sourceType,
                  import_batch_id: input.batchId,
                  imported_by: user.id,
                  imported_at: new Date().toISOString(),
                  source_reference: `Batch #${input.batchId}`,
                  source_priority: sourcePriority
                })
              }
            })
            importedCount++
          }
        } else {
          // Content performance row
          const pubAt = (normalized.normalizedData.published_at as string) || new Date().toISOString()
          const title = (normalized.normalizedData.title as string) || 'Untitled Import Post'
          const provContentId = (normalized.normalizedData.content_id as string) || `imp_${input.batchId}_${rowNum}`

          const contentItemId = crypto.randomUUID()

          contentItemInserts.push({
            id: contentItemId,
            company_id: input.companyId,
            social_account_id: null,
            provider: input.platform,
            provider_content_id: provContentId,
            content_type: (normalized.normalizedData.content_type as string) || 'post',
            title,
            caption: (normalized.normalizedData.caption as string) || null,
            published_at: pubAt,
            permalink: (normalized.normalizedData.permalink as string) || null,
            data_source: sourceType,
            import_batch_id: input.batchId,
            imported_by: user.id,
            imported_at: new Date().toISOString(),
            source_reference: `Batch #${input.batchId}`,
            source_priority: sourcePriority
          })

          const contentMetricKeys = ['views', 'reach', 'impressions', 'likes', 'comments', 'shares', 'saves', 'engagements', 'watch_time_seconds']
          contentMetricKeys.forEach(mKey => {
            const val = normalized.normalizedData[mKey]
            if (val !== undefined && val !== null) {
              contentMetricInserts.push({
                company_id: input.companyId,
                content_item_id: contentItemId,
                metric_name: mKey,
                metric_value: val,
                data_source: sourceType,
                import_batch_id: input.batchId,
                imported_by: user.id,
                imported_at: new Date().toISOString(),
                source_reference: `Batch #${input.batchId}`,
                source_priority: sourcePriority
              })
            }
          })
          importedCount++
        }
      }

      // Row audit log
      importRowLogs.push({
        import_batch_id: input.batchId,
        company_id: input.companyId,
        platform: input.platform,
        row_number: rowNum,
        row_type: input.importType,
        source_data: rawRow,
        normalized_data: normalized.normalizedData,
        validation_status: normalized.status,
        validation_errors: { errors: normalized.errors, warnings: normalized.warnings },
        duplicate_key: normalized.duplicateKey
      })
    }

    // 3. Insert snapshots & content items into database
    if (snapshotInserts.length > 0) {
      const { error: snapErr } = await supabase.from('analytics_snapshots').insert(snapshotInserts)
      if (snapErr) {
        console.error('Failed to insert analytics_snapshots from import:', snapErr)
      }
    }

    if (contentItemInserts.length > 0) {
      const { error: itemErr } = await supabase.from('content_items').insert(contentItemInserts)
      if (itemErr) {
        console.error('Failed to insert content_items from import:', itemErr)
      }
    }

    if (contentMetricInserts.length > 0) {
      const { error: metricErr } = await supabase.from('content_metrics').insert(contentMetricInserts)
      if (metricErr) {
        console.error('Failed to insert content_metrics from import:', metricErr)
      }
    }

    // 4. Write row logs into data_import_rows
    if (importRowLogs.length > 0) {
      const { error: rowErr } = await supabase.from('data_import_rows').insert(importRowLogs)
      if (rowErr) {
        console.error('Failed to insert data_import_rows:', rowErr)
      }
    }

    // 5. Update data_import_batches status
    const finalStatus = invalidCount === 0 ? 'completed' : importedCount > 0 ? 'partially_completed' : 'failed'

    try {
      await supabase
        .from('data_import_batches')
        .update({
          status: finalStatus,
          valid_rows: validCount,
          invalid_rows: invalidCount,
          duplicate_rows: duplicateCount,
          imported_rows: importedCount,
          imported_at: new Date().toISOString(),
          mapping_config: input.mappings as unknown as Record<string, unknown>,
          validation_summary: { validCount, invalidCount, warningCount, duplicateCount, importedCount }
        })
        .eq('id', input.batchId)
    } catch (updateErr) {
      console.error('Update data_import_batches status caught error:', updateErr)
    }

    return {
      batchId: input.batchId,
      status: finalStatus,
      totalRows: rowsToProcess.length,
      importedRows: importedCount,
      validRows: validCount,
      invalidRows: invalidCount,
      warningRows: warningCount
    }
  } catch (err: unknown) {
    console.error('confirmImportBatchAction exception caught:', err)
    throw err
  }
}

export async function getImportHistoryAction(companyId: string, platformFilter = 'all') {
  try {
    if (!companyId) return []
    const supabase = await createClient()

    const perm = await verifyCompanyPermission(companyId, ['owner', 'admin', 'marketing_manager', 'viewer', 'client_viewer'])
    if (!perm.authorized) {
      console.warn('getImportHistoryAction unauthorized:', perm.error)
      return []
    }

    let query = supabase
      .from('data_import_batches')
      .select(`
        id, company_id, platform, import_type, source_type, reporting_period_start, reporting_period_end,
        original_file_name, file_size_bytes, status, total_rows, valid_rows, invalid_rows, imported_rows,
        imported_by, imported_at, created_at
      `)
      .eq('company_id', companyId)
      .is('archived_at', null)
      .order('created_at', { ascending: false })

    if (platformFilter && platformFilter !== 'all') {
      query = query.eq('platform', platformFilter)
    }

    const { data, error } = await query
    if (error) {
      console.error('Failed to fetch import history query error:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('getImportHistoryAction exception caught:', err)
    return []
  }
}

export async function getImportDetailAction(batchId: string) {
  try {
    if (!batchId) return { batch: null, rows: [], signedUrl: '#' }
    const supabase = await createClient()

    const { data: batch, error: batchErr } = await supabase
      .from('data_import_batches')
      .select('*')
      .eq('id', batchId)
      .maybeSingle()

    if (batchErr || !batch) {
      console.error('Import batch not found or DB error:', batchErr)
      return { batch: null, rows: [], signedUrl: '#' }
    }

    const perm = await verifyCompanyPermission(batch.company_id, ['owner', 'admin', 'marketing_manager', 'viewer', 'client_viewer'])
    if (!perm.authorized) {
      console.warn('getImportDetailAction unauthorized:', perm.error)
      return { batch: null, rows: [], signedUrl: '#' }
    }

    const { data: rows, error: rowsErr } = await supabase
      .from('data_import_rows')
      .select('*')
      .eq('import_batch_id', batchId)
      .order('row_number', { ascending: true })

    if (rowsErr) {
      console.error('Failed to fetch import rows query error:', rowsErr)
    }

    let signedUrl = '#'
    if (batch.storage_path) {
      try {
        const { data: signRes } = await supabase.storage
          .from('data-imports')
          .createSignedUrl(batch.storage_path, 3600)
        if (signRes?.signedUrl) signedUrl = signRes.signedUrl
      } catch (stgErr) {
        console.error('Failed to create signed URL caught error:', stgErr)
      }
    }

    return {
      batch,
      rows: rows || [],
      signedUrl
    }
  } catch (err) {
    console.error('getImportDetailAction exception caught:', err)
    return { batch: null, rows: [], signedUrl: '#' }
  }
}

export async function archiveImportBatchAction(batchId: string) {
  try {
    if (!batchId) return { success: false, error: 'Missing batch ID' }
    const supabase = await createClient()

    const { data: batch, error: fetchErr } = await supabase
      .from('data_import_batches')
      .select('company_id')
      .eq('id', batchId)
      .maybeSingle()

    if (fetchErr || !batch) {
      console.error('Archive import batch fetch error:', fetchErr)
      return { success: false, error: 'Batch not found' }
    }

    const perm = await verifyCompanyPermission(batch.company_id, ['owner', 'admin', 'marketing_manager'])
    if (!perm.authorized) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('data_import_batches')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', batchId)

    if (error) {
      console.error('Archive import batch update error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('archiveImportBatchAction exception caught:', err)
    return { success: false, error: (err as Error).message || 'Failed to archive batch' }
  }
}

export async function createImportProfileFromBatchAction(
  companyId: string,
  platform: string,
  profileName: string,
  reportType: string,
  fileSignature: string,
  headers: string[],
  mappings: FieldMapping[],
  dateFormat = 'auto'
) {
  try {
    if (!companyId) return { success: false, error: 'Missing company ID' }
    const supabase = await createClient()

    const perm = await verifyCompanyPermission(companyId, ['owner', 'admin', 'marketing_manager'])
    if (!perm.authorized) {
      return { success: false, error: 'Unauthorized' }
    }

    const profile = await saveImportProfile(
      supabase,
      companyId,
      platform,
      profileName,
      reportType,
      fileSignature,
      headers || [],
      mappings || [],
      dateFormat
    )

    return { success: true, profile }
  } catch (err) {
    console.error('createImportProfileFromBatchAction exception caught:', err)
    return { success: false, error: (err as Error).message || 'Failed to save import profile' }
  }
}
