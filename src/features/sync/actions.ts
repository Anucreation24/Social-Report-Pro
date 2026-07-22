'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyCompanyPermission } from '@/lib/permissions'
import { executePlatformSync } from '@/lib/analytics/sync-engine'

export async function triggerManualSyncAction(connectionId: string, daysToFetch: number = 30) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return { error: 'Unauthenticated session.' }
    }

    // Fetch connection details to verify company permission
    const { data: conn, error: connErr } = await supabase
      .from('platform_connections')
      .select('id, company_id, provider, connection_status')
      .eq('id', connectionId)
      .single()

    if (connErr || !conn) {
      return { error: 'Platform connection not found.' }
    }

    // Role check: Only Owner, Admin, and Marketing Manager can trigger sync. Viewer is rejected.
    const permission = await verifyCompanyPermission(conn.company_id, ['owner', 'admin', 'marketing_manager'])
    if (!permission.authorized) {
      return { error: permission.error || 'You do not have permission to trigger a sync for this company.' }
    }

    const result = await executePlatformSync(supabase, {
      companyId: conn.company_id,
      connectionId,
      requestedUserId: user.id,
      jobType: 'manual',
      daysToFetch
    })

    if (!result.success && result.status === 'failed') {
      return { error: result.safeErrorMessage || 'Manual sync failed.' }
    }

    return {
      success: true,
      status: result.status,
      warningMessage: result.safeErrorMessage,
      recordsCreated: result.recordsCreated,
      contentItemsImported: result.contentItemsImported
    }
  } catch (err: unknown) {
    console.error('triggerManualSyncAction error:', err)
    return { error: err instanceof Error ? err.message : 'Unexpected sync error.' }
  }
}
