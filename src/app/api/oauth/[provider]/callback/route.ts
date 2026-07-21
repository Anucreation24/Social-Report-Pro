import { NextRequest, NextResponse } from 'next/server'
import { connectorRegistry } from '@/lib/connectors/registry'
import { SocialPlatform } from '@/lib/connectors/types'
import { verifyOAuthState } from '@/lib/connectors/oauth-state'
import { encryptToken } from '@/lib/connectors/token-vault'
import { createClient } from '@/lib/supabase/server'
import { verifyCompanyPermission } from '@/lib/permissions'
import { logAuditAction } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ provider: string }> }
) {
  const { provider } = await props.params
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  // 1. Check third-party OAuth error redirection
  if (error || errorDesc) {
    console.error(`OAuth callback reported error for ${provider}:`, error, errorDesc)
    return NextResponse.redirect(`${request.nextUrl.origin}/connections?error=${encodeURIComponent(errorDesc || error || 'OAuth denied')}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${request.nextUrl.origin}/connections?error=Missing+oauth+parameters`)
  }

  // Validate provider enum
  const validProviders: SocialPlatform[] = ['facebook', 'instagram', 'youtube', 'tiktok']
  if (!validProviders.includes(provider as SocialPlatform)) {
    return NextResponse.redirect(`${request.nextUrl.origin}/connections?error=Unsupported+oauth+provider`)
  }

  try {
    // 2. Authenticate the active user session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.redirect(`${request.nextUrl.origin}/login?error=Session+expired`)
    }

    // 3. Verify OAuth state binding signature and expiry
    let payload
    try {
      payload = verifyOAuthState(state, provider, user.id)
    } catch (stateErr: unknown) {
      const msg = stateErr instanceof Error ? stateErr.message : 'OAuth state mismatch'
      return NextResponse.redirect(`${request.nextUrl.origin}/connections?error=${encodeURIComponent(msg)}`)
    }

    const { companyId } = payload

    // 4. Verify user permissions to modify company connections
    const permission = await verifyCompanyPermission(companyId, ['owner', 'admin', 'marketing_manager'])
    if (!permission.authorized) {
      return NextResponse.redirect(`${request.nextUrl.origin}/connections?error=Unauthorized+company+action`)
    }

    await logAuditAction({
      companyId,
      action: 'oauth_callback_completed',
      entityType: 'platform_connection',
      entityId: provider,
      summary: `OAuth callback verification succeeded for: ${provider}`,
    })

    // 5. Exchange code for access/refresh tokens
    const connector = connectorRegistry.get(provider as SocialPlatform)
    const tokenResult = await connector.exchangeAuthorizationCode({
      code,
      state,
      userId: user.id
    })

    // 6. Discover available accounts from third-party API using fresh token
    const accounts = await connector.getAvailableAccounts(tokenResult.accessToken)
    if (accounts.length === 0) {
      return NextResponse.redirect(`${request.nextUrl.origin}/connections?error=No+eligible+pages+or+channels+found`)
    }

    // 7. Store connection record in pending status
    // Check if a connection already exists for this company & provider to avoid duplicates
    let existingConnection = null
    const { data: currentConns } = await supabase
      .from('platform_connections')
      .select('id')
      .eq('company_id', companyId)
      .eq('provider', provider)
      .limit(1)

    if (currentConns && currentConns.length > 0) {
      existingConnection = currentConns[0]
    }

    let connectionId: string
    let isNewConnection = false

    if (existingConnection) {
      // Update existing connection to pending status
      connectionId = existingConnection.id
      const { error: updateErr } = await supabase
        .from('platform_connections')
        .update({
          connection_status: 'pending',
          granted_scopes: tokenResult.scopes,
          token_expires_at: tokenResult.expiresIn ? new Date(Date.now() + tokenResult.expiresIn * 1000).toISOString() : null,
          refresh_token_expires_at: tokenResult.refreshTokenExpiresIn ? new Date(Date.now() + tokenResult.refreshTokenExpiresIn * 1000).toISOString() : null,
          last_validated_at: new Date().toISOString(),
          connected_by: user.id,
          disconnected_at: null,
          revoked_at: null
        })
        .eq('id', connectionId)

      if (updateErr) throw new Error(`Database error updating connection metadata: ${updateErr.message}`)
    } else {
      // Insert new connection record in pending status
      isNewConnection = true
      const { data: newConn, error: insertErr } = await supabase
        .from('platform_connections')
        .insert({
          company_id: companyId,
          provider,
          provider_account_id: 'pending',
          provider_account_name: 'Awaiting Selection',
          connection_status: 'pending',
          granted_scopes: tokenResult.scopes,
          token_expires_at: tokenResult.expiresIn ? new Date(Date.now() + tokenResult.expiresIn * 1000).toISOString() : null,
          refresh_token_expires_at: tokenResult.refreshTokenExpiresIn ? new Date(Date.now() + tokenResult.refreshTokenExpiresIn * 1000).toISOString() : null,
          last_validated_at: new Date().toISOString(),
          connected_by: user.id
        })
        .select('id')
        .single()

      if (insertErr || !newConn) throw new Error(`Database error creating connection: ${insertErr?.message || 'Insert failed'}`)
      connectionId = newConn.id
    }

    try {
      // 8. Securely encrypt credentials and upsert into the server-only platform_credentials table
      const encryptedAccess = encryptToken(tokenResult.accessToken)
      const encryptedRefresh = tokenResult.refreshToken ? encryptToken(tokenResult.refreshToken) : null

      const { error: credErr } = await supabase
        .from('platform_credentials')
        .upsert({
          connection_id: connectionId,
          access_token_encrypted: encryptedAccess,
          refresh_token_encrypted: encryptedRefreshTokenBody(encryptedRefresh, provider, tokenResult.accessToken), // Save encrypted token safely
          token_expires_at: tokenResult.expiresIn ? new Date(Date.now() + tokenResult.expiresIn * 1000).toISOString() : null,
          refresh_token_expires_at: tokenResult.refreshTokenExpiresIn ? new Date(Date.now() + tokenResult.refreshTokenExpiresIn * 1000).toISOString() : null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'connection_id' })

      if (credErr) throw new Error(`Database error storing credentials: ${credErr.message}`)

      // 9. Discover available accounts from third-party API using fresh token
      const accounts = await connector.getAvailableAccounts(tokenResult.accessToken)
      if (accounts.length === 0) {
        throw new Error('No eligible pages or channels found')
      }

      const autoSelect = accounts.length === 1
      const selectedAccount = autoSelect ? accounts[0] : null

      // 10. Update connection status and account mapping details
      const { error: statusErr } = await supabase
        .from('platform_connections')
        .update({
          provider_account_id: selectedAccount ? selectedAccount.id : 'pending',
          provider_account_name: selectedAccount ? selectedAccount.name : 'Awaiting Selection',
          connection_status: autoSelect ? 'connected' : 'awaiting_account_selection'
        })
        .eq('id', connectionId)

      if (statusErr) throw new Error(`Database error updating connection status: ${statusErr.message}`)

      // 11. If auto-selected, update the selected social_account record directly
      if (autoSelect && selectedAccount) {
        await supabase
          .from('social_accounts')
          .upsert({
            company_id: companyId,
            platform_connection_id: connectionId,
            provider,
            provider_account_id: selectedAccount.id,
            name: selectedAccount.name,
            username: selectedAccount.username || '',
            profile_image_url: selectedAccount.profileImageUrl || '',
            account_url: selectedAccount.accountUrl || '',
            is_selected: true,
            is_active: true,
            capabilities: selectedAccount.capabilities,
            provider_metadata: selectedAccount.providerMetadata || {}
          }, { onConflict: 'company_id,platform_connection_id,provider_account_id' })

        await logAuditAction({
          companyId,
          action: 'platform_connected',
          entityType: 'platform_connection',
          entityId: connectionId,
          summary: `Platform connected and account auto-linked: ${selectedAccount.name} (${provider})`,
        })

        return NextResponse.redirect(`${request.nextUrl.origin}/connections?success=true`)
      }

      // 12. If multiple accounts exist, redirect to the account-selection flow page
      return NextResponse.redirect(`${request.nextUrl.origin}/connections/${provider}/select-account?connectionId=${connectionId}`)

    } catch (postInsertErr: unknown) {
      // Rollback: if credential storage or account discovery fails, delete connection (if new) or mark failed
      console.error(`Post-insert callback steps failed, rolling back/marking failed:`, postInsertErr)
      const errMsg = postInsertErr instanceof Error ? postInsertErr.message : 'Credentials storage or account discovery failed'
      
      // Clean up credentials if they were inserted
      await supabase
        .from('platform_credentials')
        .delete()
        .eq('connection_id', connectionId)

      if (isNewConnection) {
        await supabase
          .from('platform_connections')
          .delete()
          .eq('id', connectionId)
      } else {
        await supabase
          .from('platform_connections')
          .update({
            connection_status: 'failed',
            connection_error: errMsg
          })
          .eq('id', connectionId)
      }
      throw postInsertErr
    }
  } catch (err: unknown) {
    console.error(`OAuth callback flow failed for ${provider}:`, err)
    const msg = err instanceof Error ? err.message : 'Internal callback error'
    return NextResponse.redirect(`${request.nextUrl.origin}/connections?error=${encodeURIComponent(msg)}`)
  }
}

// Helper to return refresh token safely
function encryptedRefreshTokenBody(refresh: string | null, provider: string, accessToken: string): string | null {
  // Instagram/Facebook do not support refresh tokens. If missing but Page access token has non-expiring behavior, we copy the long-lived page token to refresh slot or leave null.
  if (provider === 'facebook' || provider === 'instagram') {
    return encryptToken(accessToken) // Page token acts as permanent credentials
  }
  return refresh
}
