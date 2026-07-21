'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyCompanyPermission } from '@/lib/permissions'
import { connectorRegistry } from '@/lib/connectors/registry'
import { decryptToken } from '@/lib/connectors/token-vault'
import { SocialPlatform, SelectableSocialAccount } from '@/lib/connectors/types'
import { logAuditAction } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

/**
 * Disconnects an active platform connection, revoking provider token and purging credentials from db.
 */
export async function disconnectConnectionAction(connectionId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return { error: 'Unauthenticated session.' }
    }

    // 1. Fetch connection details
    const { data: conn, error: fetchErr } = await supabase
      .from('platform_connections')
      .select('company_id, provider')
      .eq('id', connectionId)
      .single()

    if (fetchErr || !conn) {
      return { error: 'Platform connection not found.' }
    }

    // 2. Enforce roles (Owner, Admin, Marketing Manager can disconnect)
    const permission = await verifyCompanyPermission(conn.company_id, ['owner', 'admin', 'marketing_manager'])
    if (!permission.authorized) {
      return { error: permission.error || 'Access denied.' }
    }

    // 3. Attempt token revocation on provider side
    try {
      const { data: creds } = await supabase.rpc('get_encrypted_credentials', {
        p_connection_id: connectionId
      })
      if (creds && creds.length > 0 && creds[0].access_token_encrypted) {
        const decryptedAccess = decryptToken(creds[0].access_token_encrypted)
        const connector = connectorRegistry.get(conn.provider as SocialPlatform)
        await connector.revokeAccess(decryptedAccess)
      }
    } catch (revokeErr) {
      console.warn(`Best-effort token revocation failed for connection ${connectionId}:`, revokeErr)
    }

    // 4. Update platform_connections status
    const { error: updateErr } = await supabase
      .from('platform_connections')
      .update({
        connection_status: 'disconnected',
        disconnected_at: new Date().toISOString(),
        revoked_at: new Date().toISOString()
      })
      .eq('id', connectionId)

    if (updateErr) {
      return { error: `Failed to disconnect: ${updateErr.message}` }
    }

    // 5. Completely delete credentials from the server-only platform_credentials table
    const { error: deleteCredsErr } = await supabase.rpc('delete_encrypted_credentials', {
      p_connection_id: connectionId
    })

    if (deleteCredsErr) {
      console.warn(`Failed to delete credentials for ${connectionId}:`, deleteCredsErr)
    }

    // 6. Inactive social account
    const { error: updateAccErr } = await supabase
      .from('social_accounts')
      .update({
        is_active: false,
        archived_at: new Date().toISOString()
      })
      .eq('platform_connection_id', connectionId)

    if (updateAccErr) {
      console.warn(`Failed to archive social accounts for connection ${connectionId}`)
    }

    // 7. Log audit
    await logAuditAction({
      companyId: conn.company_id,
      action: 'platform_disconnected',
      entityType: 'platform_connection',
      entityId: connectionId,
      summary: `Social connection disconnected and tokens purged for: ${conn.provider}`,
    })

    revalidatePath('/connections')
    return { success: true }
  } catch (err: unknown) {
    console.error('disconnectConnectionAction failed:', err)
    return { error: err instanceof Error ? err.message : 'Internal connection error.' }
  }
}

/**
 * Validates connection health checking if tokens are valid, expired, or invalid.
 */
export async function validateConnectionAction(connectionId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return { error: 'Unauthenticated session.' }
    }

    // 1. Fetch connection details
    const { data: conn, error: fetchErr } = await supabase
      .from('platform_connections')
      .select('company_id, provider')
      .eq('id', connectionId)
      .single()

    if (fetchErr || !conn) {
      return { error: 'Platform connection not found.' }
    }

    // 2. Validate permissions
    const permission = await verifyCompanyPermission(conn.company_id, ['owner', 'admin', 'marketing_manager'])
    if (!permission.authorized) {
      return { error: permission.error || 'Access denied.' }
    }

    // 3. Fetch credentials
    const { data: creds, error: credsErr } = await supabase.rpc('get_encrypted_credentials', {
      p_connection_id: connectionId
    })

    if (credsErr || !creds || creds.length === 0) {
      return { status: 'invalid', message: 'No connection credentials found.' }
    }

    // 4. Decrypt access token and query provider
    const decryptedAccess = decryptToken(creds[0].access_token_encrypted)
    const connector = connectorRegistry.get(conn.provider as SocialPlatform)
    const health = await connector.validateConnection(decryptedAccess)

    // 5. Update last_validated_at and connection health status
    const statusMap = {
      valid: 'connected',
      expired: 'expired',
      expiring_soon: 'connected',
      missing_scope: 'permission_required',
      revoked: 'revoked',
      provider_error: 'failed',
      unknown: 'failed'
    } as const

    const mappedStatus = statusMap[health.status] || 'failed'

    await supabase
      .from('platform_connections')
      .update({
        connection_status: mappedStatus,
        last_validated_at: new Date().toISOString(),
        last_error_code: health.status !== 'valid' && health.status !== 'expiring_soon' ? health.status : null,
        last_error_message_safe: health.message || null
      })
      .eq('id', connectionId)

    // 6. Log audit
    await logAuditAction({
      companyId: conn.company_id,
      action: 'connection_validated',
      entityType: 'platform_connection',
      entityId: connectionId,
      summary: `Connection health checked: ${health.status} (${conn.provider})`,
    })

    revalidatePath('/connections')
    return { success: true, status: health.status, message: health.message }
  } catch (err: unknown) {
    console.error('validateConnectionAction failed:', err)
    return { error: err instanceof Error ? err.message : 'Internal health validation error.' }
  }
}

/**
 * Fetches available pages or channels from third-party APIs for account selection.
 */
export async function getAvailableAccountsAction(connectionId: string) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return { error: 'Unauthenticated session.' }
    }

    const { data: conn, error: fetchErr } = await supabase
      .from('platform_connections')
      .select('company_id, provider')
      .eq('id', connectionId)
      .single()

    if (fetchErr || !conn) {
      return { error: 'Platform connection not found.' }
    }

    // Verify membership
    const permission = await verifyCompanyPermission(conn.company_id, ['owner', 'admin', 'marketing_manager', 'viewer'])
    if (!permission.authorized) {
      return { error: permission.error || 'Access denied.' }
    }

    const { data: creds, error: credsErr } = await supabase.rpc('get_encrypted_credentials', {
      p_connection_id: connectionId
    })

    if (credsErr || !creds || creds.length === 0) {
      return { error: 'No connection credentials found.' }
    }

    const decryptedAccess = decryptToken(creds[0].access_token_encrypted)
    const connector = connectorRegistry.get(conn.provider as SocialPlatform)
    const accounts = await connector.getAvailableAccounts(decryptedAccess)

    return { accounts }
  } catch (err: unknown) {
    console.error('getAvailableAccountsAction failed:', err)
    return { error: err instanceof Error ? err.message : 'Failed to fetch available accounts.' }
  }
}

/**
 * Links a selected account/channel, revalidating that the account belongs to the connector.
 */
export async function selectSocialAccountAction(
  connectionId: string,
  account: SelectableSocialAccount
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return { error: 'Unauthenticated session.' }
    }

    const { data: conn, error: fetchErr } = await supabase
      .from('platform_connections')
      .select('company_id, provider')
      .eq('id', connectionId)
      .single()

    if (fetchErr || !conn) {
      return { error: 'Platform connection not found.' }
    }

    // Enforce roles
    const permission = await verifyCompanyPermission(conn.company_id, ['owner', 'admin', 'marketing_manager'])
    if (!permission.authorized) {
      return { error: permission.error || 'Access denied.' }
    }

    // Server-side revalidation: Discover available accounts to check that the selected account is valid
    const { data: creds } = await supabase.rpc('get_encrypted_credentials', {
      p_connection_id: connectionId
    })

    if (!creds || creds.length === 0) {
      return { error: 'Connection credentials are missing.' }
    }

    const decryptedAccess = decryptToken(creds[0].access_token_encrypted)
    const connector = connectorRegistry.get(conn.provider as SocialPlatform)
    const accounts = await connector.getAvailableAccounts(decryptedAccess)

    const matches = accounts.find((a) => a.id === account.id)
    if (!matches) {
      return { error: 'Security Exception: Selected account does not belong to authorized platform session.' }
    }

    // Clear is_selected for other social accounts of this provider under this company
    await supabase
      .from('social_accounts')
      .update({ is_selected: false })
      .eq('company_id', conn.company_id)
      .eq('provider', conn.provider)

    // Upsert the new selected account
    const { error: upsertErr } = await supabase
      .from('social_accounts')
      .upsert({
        company_id: conn.company_id,
        platform_connection_id: connectionId,
        provider: conn.provider,
        provider_account_id: account.id,
        name: account.name,
        username: account.username || '',
        profile_image_url: account.profileImageUrl || '',
        account_url: account.accountUrl || '',
        is_selected: true,
        is_active: true,
        capabilities: account.capabilities,
        provider_metadata: account.providerMetadata || {}
      }, { onConflict: 'company_id,platform_connection_id,provider_account_id' })

    if (upsertErr) {
      return { error: `Failed to link account: ${upsertErr.message}` }
    }

    // Update connection status
    await supabase
      .from('platform_connections')
      .update({
        provider_account_id: account.id,
        provider_account_name: account.name,
        connection_status: 'connected'
      })
      .eq('id', connectionId)

    // Log audit
    await logAuditAction({
      companyId: conn.company_id,
      action: 'account_selected',
      entityType: 'platform_connection',
      entityId: connectionId,
      summary: `Linked selected account: ${account.name} (${conn.provider})`,
    })

    revalidatePath('/connections')
    return { success: true }
  } catch (err: unknown) {
    console.error('selectSocialAccountAction failed:', err)
    return { error: err instanceof Error ? err.message : 'Internal account link error.' }
  }
}
