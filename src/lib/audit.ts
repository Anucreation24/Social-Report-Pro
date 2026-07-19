import { createClient } from './supabase/server'

interface AuditLogParams {
  workspaceId?: string
  companyId?: string
  action: string
  entityType: string
  entityId?: string
  summary: string
  metadata?: Record<string, unknown>
}

/**
 * Logs an administrative action to the database audit_logs table.
 * Assures sensitive values (tokens, credentials) are omitted.
 */
export async function logAuditAction(params: AuditLogParams): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Scrub metadata just in case
    const safeMetadata = params.metadata ? { ...params.metadata } : {}
    const sensitiveKeys = ['token', 'password', 'key', 'secret', 'auth', 'access_token', 'refresh_token']
    
    Object.keys(safeMetadata).forEach(key => {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        safeMetadata[key] = '[REDACTED]'
      }
    })

    const { error } = await supabase.from('audit_logs').insert({
      workspace_id: params.workspaceId || null,
      company_id: params.companyId || null,
      user_id: user?.id || null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      summary: params.summary,
      metadata: safeMetadata,
    })

    if (error) {
      console.error('Audit log write error:', error.message)
      return false
    }

    return true
  } catch (err: unknown) {
    console.error('Failed to write audit log:', err)
    return false
  }
}
