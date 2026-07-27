import crypto from 'crypto'
import { SupabaseClient } from '@supabase/supabase-js'
import { FieldMapping } from './column-mapping'

export interface ImportProfile {
  id: string
  company_id: string
  platform: string
  profile_name: string
  report_type: string
  file_signature: string
  sheet_name_pattern?: string | null
  header_signature: string[]
  mapping_config: FieldMapping[]
  date_format: string
  created_at: string
}

/**
 * Computes non-sensitive structural file signature from normalized header titles & column count.
 * Never includes raw row data or sensitive values.
 */
export function computeFileSignature(headers: string[], sheetName = ''): string {
  const normHeaders = [...headers].map(h => h.toLowerCase().trim()).sort()
  const rawSig = `${sheetName.toLowerCase()}:${normHeaders.join('|')}:${headers.length}`
  return crypto.createHash('sha256').update(rawSig).digest('hex').slice(0, 16)
}

/**
 * Searches for an existing saved import profile for this company & platform with matching file signature.
 */
export async function matchImportProfile(
  supabase: SupabaseClient,
  companyId: string,
  platform: string,
  fileSignature: string
): Promise<ImportProfile | null> {
  const { data, error } = await supabase
    .from('import_profiles')
    .select('*')
    .eq('company_id', companyId)
    .eq('platform', platform)
    .eq('file_signature', fileSignature)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) return null
  return data[0] as ImportProfile
}

/**
 * Saves a confirmed import profile for future automated matching.
 */
export async function saveImportProfile(
  supabase: SupabaseClient,
  companyId: string,
  platform: string,
  profileName: string,
  reportType: string,
  fileSignature: string,
  headers: string[],
  mappings: FieldMapping[],
  dateFormat = 'auto'
): Promise<ImportProfile> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('import_profiles')
    .insert({
      company_id: companyId,
      platform,
      profile_name: profileName,
      report_type: reportType,
      file_signature: fileSignature,
      header_signature: headers,
      mapping_config: mappings as unknown as Record<string, unknown>,
      date_format: dateFormat,
      created_by: user?.id || null
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`Failed to save import profile: ${error?.message || 'Database error'}`)
  }

  return data as ImportProfile
}
