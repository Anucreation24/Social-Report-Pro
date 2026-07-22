import { SupabaseClient } from '@supabase/supabase-js'
import { connectorRegistry } from '@/lib/connectors/registry'
import { decryptToken, encryptToken } from '@/lib/connectors/token-vault'
import { getDateRange } from './date-ranges'
import {
  saveAccountSnapshotsIdempotent,
  saveContentItemsIdempotent,
  saveContentMetricsIdempotent
} from './idempotency'
import { SocialPlatform } from '@/lib/connectors/types'
import { logAuditAction } from '@/lib/audit'

export interface SyncExecutionInput {
  companyId: string
  connectionId: string
  requestedUserId?: string
  jobType?: 'manual' | 'scheduled' | 'backfill'
  daysToFetch?: number
}

export interface SyncExecutionResult {
  success: boolean
  jobId: string
  status?: 'completed' | 'partially_completed' | 'failed'
  recordsCreated: number
  contentItemsImported: number
  errorCategory?: string
  safeErrorMessage?: string
}

export async function executePlatformSync(
  supabase: SupabaseClient,
  input: SyncExecutionInput
): Promise<SyncExecutionResult> {
  const { companyId, connectionId, requestedUserId, jobType = 'manual', daysToFetch = 30 } = input

  // 1. Fetch connection details
  const { data: conn, error: connErr } = await supabase
    .from('platform_connections')
    .select('id, company_id, provider, provider_account_id, provider_account_name, connection_status, token_expires_at')
    .eq('id', connectionId)
    .single()

  if (connErr || !conn) {
    return {
      success: false,
      jobId: '',
      status: 'failed',
      recordsCreated: 0,
      contentItemsImported: 0,
      errorCategory: 'connection_not_found',
      safeErrorMessage: 'Platform connection not found.'
    }
  }

  const provider = conn.provider as SocialPlatform

  // 2. Fetch or auto-resolve associated social account
  let socialAccount = null
  const { data: socialAccounts } = await supabase
    .from('social_accounts')
    .select('id, provider_account_id, provider_metadata')
    .eq('platform_connection_id', connectionId)
    .eq('is_selected', true)
    .limit(1)

  if (socialAccounts && socialAccounts.length > 0) {
    socialAccount = socialAccounts[0]
  } else if (conn.provider_account_id && conn.provider_account_id !== 'pending') {
    // Try finding any social account for this connection
    const { data: fallbackAccounts } = await supabase
      .from('social_accounts')
      .select('id, provider_account_id, provider_metadata')
      .eq('platform_connection_id', connectionId)
      .limit(1)

    if (fallbackAccounts && fallbackAccounts.length > 0) {
      socialAccount = fallbackAccounts[0]
      await supabase
        .from('social_accounts')
        .update({ is_selected: true })
        .eq('id', socialAccount.id)
    } else {
      // Auto-upsert social_account row for this connection
      const { data: newAcc, error: accErr } = await supabase
        .from('social_accounts')
        .upsert({
          company_id: companyId,
          platform_connection_id: connectionId,
          provider,
          provider_account_id: conn.provider_account_id,
          name: conn.provider_account_name || provider,
          is_selected: true,
          is_active: true
        }, { onConflict: 'company_id,platform_connection_id,provider_account_id' })
        .select('id, provider_account_id, provider_metadata')
        .single()

      if (!accErr && newAcc) {
        socialAccount = newAcc
      }
    }
  }

  const socialAccountId = socialAccount?.id || null
  const providerAccountId = socialAccount?.provider_account_id || conn.provider_account_id
  const providerMetadata = (socialAccount?.provider_metadata || {}) as Record<string, unknown>

  // 3. Create sync_jobs record in 'running' status
  const { data: job, error: jobErr } = await supabase
    .from('sync_jobs')
    .insert({
      company_id: companyId,
      platform_connection_id: connectionId,
      provider,
      job_type: jobType,
      requested_by: requestedUserId || null,
      status: 'running',
      started_at: new Date().toISOString(),
      metadata: { daysToFetch }
    })
    .select('id')
    .single()

  const jobId = job?.id || ''

  if (jobErr || !jobId) {
    console.error('Failed to create sync_job:', jobErr)
    return {
      success: false,
      jobId: '',
      status: 'failed',
      recordsCreated: 0,
      contentItemsImported: 0,
      errorCategory: 'database_write_error',
      safeErrorMessage: `Database error creating sync_job: ${jobErr?.message || 'Insert failed'}`
    }
  }

  // Write initial log
  const { error: logErr } = await supabase.from('sync_logs').insert({
    sync_job_id: jobId,
    company_id: companyId,
    platform: provider,
    provider,
    status: 'info',
    level: 'info',
    step: 'initiation',
    log_message: `Sync job started for ${provider}`,
    safe_message: `Sync job started for ${provider}`
  })

  if (logErr) {
    console.warn('Sync log insert warning:', logErr)
  }

  try {
    // 4. Retrieve encrypted credentials
    const { data: creds, error: credsErr } = await supabase.rpc('get_encrypted_credentials', {
      p_connection_id: connectionId
    })

    if (credsErr || !creds || creds.length === 0 || !creds[0].access_token_encrypted) {
      throw new Error(`No valid connection credentials found: ${credsErr?.message || 'Empty credentials'}`)
    }

    let decryptedAccess = decryptToken(creds[0].access_token_encrypted)
    const connector = connectorRegistry.get(provider)

    // Token Validation / Auto-Refresh if supported
    if (connector.getCapabilities().supportsTokenRefresh && creds[0].refresh_token_encrypted) {
      try {
        const decryptedRefresh = decryptToken(creds[0].refresh_token_encrypted)
        const refreshedToken = await connector.refreshAccessToken(decryptedRefresh)
        decryptedAccess = refreshedToken.accessToken

        const encryptedAccess = encryptToken(refreshedToken.accessToken)
        const encryptedRefresh = refreshedToken.refreshToken ? encryptToken(refreshedToken.refreshToken) : creds[0].refresh_token_encrypted

        await supabase.rpc('store_encrypted_credentials', {
          p_connection_id: connectionId,
          p_access_token_encrypted: encryptedAccess,
          p_refresh_token_encrypted: encryptedRefresh,
          p_token_expires_at: refreshedToken.expiresIn ? new Date(Date.now() + refreshedToken.expiresIn * 1000).toISOString() : null,
          p_refresh_token_expires_at: null
        })

        await supabase.from('sync_logs').insert({
          sync_job_id: jobId,
          company_id: companyId,
          platform: provider,
          provider,
          status: 'info',
          level: 'info',
          step: 'token_refresh',
          log_message: `Access token refreshed successfully for ${provider}`,
          safe_message: `Access token refreshed successfully for ${provider}`
        })
      } catch (refreshErr) {
        console.warn(`Token auto-refresh notice for ${provider}:`, refreshErr)
      }
    }

    // 5. Determine date range for historical backfill
    const range = getDateRange('last_30_days')
    if (daysToFetch !== 30) {
      const end = new Date()
      const start = new Date(end)
      start.setUTCDate(start.getUTCDate() - (daysToFetch - 1))
      range.startDate = start.toISOString().split('T')[0]
      range.endDate = end.toISOString().split('T')[0]
    }

    let recordsCreated = 0
    let contentItemsImported = 0
    let isPartial = false
    let partialWarningMessage = ''

    if (!socialAccountId) {
      throw new Error(`Cannot execute sync: No social account found for connection ${connectionId}`)
    }

    // 6. Fetch and save account metrics
    try {
      const accountMetricResults = await connector.fetchAccountMetrics(
        connectionId,
        decryptedAccess,
        providerAccountId,
        range,
        providerMetadata
      )

      const saveSnapshotsRes = await saveAccountSnapshotsIdempotent(supabase, {
        companyId,
        socialAccountId,
        providerAccountId,
        platformConnectionId: connectionId,
        provider,
        results: accountMetricResults
      })

      if (saveSnapshotsRes.error) {
        throw new Error(`Database error saving analytics_snapshots: ${saveSnapshotsRes.error}`)
      }

      recordsCreated += saveSnapshotsRes.count
    } catch (metricsErr: unknown) {
      const msg = metricsErr instanceof Error ? metricsErr.message : 'Account metrics fetch failed'
      if (msg.includes('Database error')) {
        throw metricsErr
      }
      isPartial = true
      partialWarningMessage = msg
      await supabase.from('sync_logs').insert({
        sync_job_id: jobId,
        company_id: companyId,
        platform: provider,
        provider,
        status: 'warning',
        level: 'warning',
        step: 'account_metrics',
        log_message: msg,
        safe_message: msg
      })
    }

    // 7. Fetch and save content items
    try {
      const contentItems = await connector.fetchContent(
        connectionId,
        decryptedAccess,
        providerAccountId,
        range,
        providerMetadata
      )

      const saveContentRes = await saveContentItemsIdempotent(supabase, {
        companyId,
        socialAccountId,
        providerAccountId,
        platformConnectionId: connectionId,
        provider,
        items: contentItems
      })

      if (saveContentRes.error) {
        throw new Error(`Database error saving content_items: ${saveContentRes.error}`)
      }

      contentItemsImported = contentItems.length

      // 8. Fetch and save content metrics
      const contentIds = contentItems.map(item => item.providerContentId)
      if (contentIds.length > 0) {
        const contentMetrics = await connector.fetchContentMetrics(
          connectionId,
          decryptedAccess,
          providerAccountId,
          contentIds,
          range,
          providerMetadata
        )

        const saveContentMetricsRes = await saveContentMetricsIdempotent(
          supabase,
          { companyId, contentMetrics },
          saveContentRes.itemMap
        )

        if (saveContentMetricsRes.error) {
          throw new Error(`Database error saving content_metrics: ${saveContentMetricsRes.error}`)
        }

        recordsCreated += saveContentMetricsRes.count
      }
    } catch (contentErr: unknown) {
      const msg = contentErr instanceof Error ? contentErr.message : 'Content items fetch failed'
      if (msg.includes('Database error')) {
        throw contentErr
      }
      isPartial = true
      if (!partialWarningMessage) partialWarningMessage = msg
      await supabase.from('sync_logs').insert({
        sync_job_id: jobId,
        company_id: companyId,
        platform: provider,
        provider,
        status: 'warning',
        level: 'warning',
        step: 'content_ingestion',
        log_message: msg,
        safe_message: msg
      })
    }

    // Determine final status
    let finalJobStatus: 'completed' | 'partially_completed' | 'failed' = 'completed'
    if (isPartial) {
      finalJobStatus = 'partially_completed'
    } else if (recordsCreated === 0 && contentItemsImported === 0) {
      finalJobStatus = 'failed'
      partialWarningMessage = 'No metric points or content items were returned by the provider.'
    }

    // 9. Update platform_connections status
    await supabase
      .from('platform_connections')
      .update({
        last_successful_sync_at: finalJobStatus !== 'failed' ? new Date().toISOString() : undefined,
        last_sync_attempt_at: new Date().toISOString(),
        connection_status: 'connected',
        last_error_code: isPartial ? 'partial_permissions' : null,
        last_error_message_safe: isPartial ? partialWarningMessage : null
      })
      .eq('id', connectionId)

    // 10. Finalize sync_job
    await supabase
      .from('sync_jobs')
      .update({
        status: finalJobStatus,
        completed_at: new Date().toISOString(),
        safe_error_message: finalJobStatus !== 'completed' ? partialWarningMessage : null,
        metadata: { recordsCreated, contentItemsImported, isPartial, partialWarningMessage }
      })
      .eq('id', jobId)

    await supabase.from('sync_logs').insert({
      sync_job_id: jobId,
      company_id: companyId,
      platform: provider,
      provider,
      status: finalJobStatus === 'failed' ? 'error' : (isPartial ? 'warning' : 'info'),
      level: finalJobStatus === 'failed' ? 'error' : (isPartial ? 'warning' : 'info'),
      step: 'completion',
      log_message: finalJobStatus === 'failed'
        ? `Sync failed: ${partialWarningMessage}`
        : (isPartial ? `Sync completed partially: ${partialWarningMessage}` : `Sync completed successfully. ${recordsCreated} metric points saved, ${contentItemsImported} content items imported.`),
      safe_message: finalJobStatus === 'failed'
        ? `Sync failed: ${partialWarningMessage}`
        : (isPartial ? `Sync completed partially: ${partialWarningMessage}` : `Sync completed successfully. ${recordsCreated} metric points saved, ${contentItemsImported} content items imported.`)
    })

    await logAuditAction({
      companyId,
      action: finalJobStatus === 'failed' ? 'sync_failed' : (isPartial ? 'sync_partially_completed' : 'sync_completed'),
      entityType: 'platform_connection',
      entityId: connectionId,
      summary: `Historical analytics sync ${finalJobStatus} for ${provider}: ${recordsCreated} metrics, ${contentItemsImported} items.`
    })

    return {
      success: finalJobStatus !== 'failed',
      jobId,
      status: finalJobStatus,
      recordsCreated,
      contentItemsImported,
      safeErrorMessage: finalJobStatus !== 'completed' ? partialWarningMessage : undefined
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Historical analytics sync failed.'
    console.error(`Sync execution failed for connection ${connectionId}:`, err)

    if (jobId) {
      await supabase
        .from('sync_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_category: 'sync_execution_error',
          safe_error_message: errMsg
        })
        .eq('id', jobId)

      await supabase.from('sync_logs').insert({
        sync_job_id: jobId,
        company_id: companyId,
        platform: provider,
        provider,
        status: 'error',
        level: 'error',
        step: 'execution',
        log_message: errMsg,
        safe_message: errMsg
      })
    }

    await supabase
      .from('platform_connections')
      .update({
        last_sync_attempt_at: new Date().toISOString(),
        last_error_message_safe: errMsg
      })
      .eq('id', connectionId)

    await logAuditAction({
      companyId,
      action: 'sync_failed',
      entityType: 'platform_connection',
      entityId: connectionId,
      summary: `Historical analytics sync failed for ${provider}: ${errMsg}`
    })

    return {
      success: false,
      jobId,
      status: 'failed',
      recordsCreated: 0,
      contentItemsImported: 0,
      errorCategory: 'sync_execution_error',
      safeErrorMessage: errMsg
    }
  }
}
