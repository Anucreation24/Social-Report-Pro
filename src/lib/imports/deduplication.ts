import crypto from 'crypto'
import { SupabaseClient } from '@supabase/supabase-js'

export interface DuplicateFileCheckResult {
  isDuplicate: boolean
  existingBatch?: {
    id: string
    originalFileName: string
    importedAt: string
    importedBy: string
    status: string
  }
}

/**
 * Calculates SHA-256 checksum of a Buffer or string.
 */
export function calculateFileChecksum(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Checks if a file with the same checksum has already been imported for this company & platform.
 */
export async function checkFileDuplicate(
  supabase: SupabaseClient,
  companyId: string,
  platform: string,
  checksum: string
): Promise<DuplicateFileCheckResult> {
  const { data, error } = await supabase
    .from('data_import_batches')
    .select('id, original_file_name, imported_at, imported_by, status')
    .eq('company_id', companyId)
    .eq('platform', platform)
    .eq('file_checksum', checksum)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) {
    return { isDuplicate: false }
  }

  const match = data[0]
  return {
    isDuplicate: true,
    existingBatch: {
      id: match.id,
      originalFileName: match.original_file_name || 'Imported File',
      importedAt: match.imported_at || new Date().toISOString(),
      importedBy: match.imported_by || 'Unknown',
      status: match.status
    }
  }
}
