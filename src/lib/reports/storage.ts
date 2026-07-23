import { SupabaseClient } from '@supabase/supabase-js'

export interface UploadExportResult {
  storagePath: string
  fileSizeBuffer: number
  signedUrl: string
}

/**
 * Uploads a generated PDF or Excel report file to private Supabase Storage bucket 'report-exports'.
 */
export async function uploadReportExportFile(
  supabase: SupabaseClient,
  companyId: string,
  reportId: string,
  exportType: 'pdf' | 'xlsx',
  fileBuffer: Buffer
): Promise<UploadExportResult> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const ext = exportType === 'pdf' ? 'pdf' : 'xlsx'
  const contentType = exportType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

  // Path format: companyId/reports/year/month/reportId/report.pdf
  const storagePath = `${companyId}/reports/${year}/${month}/${reportId}/report.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('report-exports')
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true
    })

  if (uploadErr) {
    console.error(`Failed to upload ${exportType} export to storage:`, uploadErr)
    throw new Error(`Storage upload failed: ${uploadErr.message}`)
  }

  // Create signed download URL valid for 3600 seconds (1 hour)
  const { data: signedData, error: signedErr } = await supabase.storage
    .from('report-exports')
    .createSignedUrl(storagePath, 3600)

  if (signedErr || !signedData?.signedUrl) {
    console.warn(`Failed to generate signed download URL for ${storagePath}:`, signedErr)
  }

  return {
    storagePath,
    fileSizeBuffer: fileBuffer.length,
    signedUrl: signedData?.signedUrl || '#'
  }
}

/**
 * Generates a fresh signed download URL for an existing report export file path.
 */
export async function getReportExportSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('report-exports')
    .createSignedUrl(storagePath, expiresInSeconds)

  if (error || !data?.signedUrl) {
    console.error(`Failed to create signed URL for path ${storagePath}:`, error)
    return '#'
  }

  return data.signedUrl
}
