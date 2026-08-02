'use server'

import { createClient } from '@/lib/supabase/server'
import { verifyCompanyPermission } from '@/lib/permissions'
import { DATA_SOURCE_PRIORITIES } from '@/lib/analytics/source-priority'

export interface ManualKPIInput {
  companyId: string
  platform: 'facebook' | 'instagram' | 'youtube' | 'tiktok'
  snapshotDate: string
  granularity: 'daily' | 'weekly' | 'monthly' | 'lifetime'
  audienceTotal?: number | null
  audienceGained?: number | null
  audienceLost?: number | null
  reach?: number | null
  impressions?: number | null
  views?: number | null
  engagements?: number | null
  likes?: number | null
  comments?: number | null
  shares?: number | null
  saves?: number | null
  clicks?: number | null
  profileViews?: number | null
  watchTimeSeconds?: number | null
  contentPublished?: number | null
  notes?: string
}

export async function saveManualKPIEntryAction(
  input: ManualKPIInput
): Promise<{ success: boolean; count?: number; batchId?: string | null; error?: string }> {
  try {
    if (!input || !input.companyId) {
      return { success: false, error: 'Missing company ID or invalid input.' }
    }

    const supabase = await createClient()

    // 1. Verify Permission
    const perm = await verifyCompanyPermission(input.companyId, ['owner', 'admin', 'marketing_manager'])
    if (!perm.authorized) {
      return { success: false, error: perm.error || 'Unauthorized: Only Marketing Managers, Admins, or Owners can enter manual KPIs.' }
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      return { success: false, error: 'Unauthenticated user session.' }
    }

    const sourceType = 'manual_entry'
    const sourcePriority = DATA_SOURCE_PRIORITIES[sourceType]

    // Map input metrics without converting blank/undefined to 0
    const metricMap: Record<string, number | null | undefined> = {
      audience_total: input.audienceTotal,
      audience_gained: input.audienceGained,
      audience_lost: input.audienceLost,
      reach: input.reach,
      impressions: input.impressions,
      views: input.views,
      engagements: input.engagements,
      likes: input.likes,
      comments: input.comments,
      shares: input.shares,
      saves: input.saves,
      clicks: input.clicks,
      profile_views: input.profileViews,
      watch_time_seconds: input.watchTimeSeconds,
      content_published: input.contentPublished
    }

    const inserts: Record<string, unknown>[] = []

    Object.entries(metricMap).forEach(([mKey, val]) => {
      if (val !== undefined && val !== null) {
        inserts.push({
          company_id: input.companyId,
          platform_connection_id: null,
          provider: input.platform,
          snapshot_date: input.snapshotDate,
          aggregation_level: input.granularity,
          metric_name: mKey,
          metric_value: val,
          raw_data: { notes: input.notes || null, granularity: input.granularity },
          data_source: sourceType,
          imported_by: user.id,
          imported_at: new Date().toISOString(),
          source_reference: input.notes ? `Manual Note: ${input.notes}` : 'Manual Entry',
          source_priority: sourcePriority
        })
      }
    })

    if (inserts.length === 0) {
      return { success: false, error: 'No numeric metric values provided for manual entry.' }
    }

    // Record manual entry batch for history
    let batchId: string | null = null
    try {
      const { data: batchRow } = await supabase
        .from('data_import_batches')
        .insert({
          company_id: input.companyId,
          platform: input.platform,
          import_type: 'manual_kpi',
          source_type: sourceType,
          reporting_period_start: input.snapshotDate,
          reporting_period_end: input.snapshotDate,
          original_file_name: `Manual_KPI_${input.platform}_${input.snapshotDate}`,
          status: 'completed',
          total_rows: 1,
          valid_rows: 1,
          imported_rows: 1,
          imported_by: user.id,
          imported_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (batchRow?.id) {
        batchId = batchRow.id
      }
    } catch (bErr) {
      console.error('Batch history record caught error:', bErr)
    }

    if (batchId) {
      inserts.forEach(ins => {
        ins.import_batch_id = batchId
      })
    }

    const { error: insertErr } = await supabase.from('analytics_snapshots').insert(inserts)
    if (insertErr) {
      console.error('Failed to insert manual KPI snapshots:', insertErr)
      return { success: false, error: `Database error saving manual KPI entries: ${insertErr.message}` }
    }

    return { success: true, count: inserts.length, batchId }
  } catch (err: unknown) {
    console.error('saveManualKPIEntryAction exception caught:', err)
    return { success: false, error: (err as Error).message || 'Failed to save manual KPI entries.' }
  }
}

export interface ManualContentItem {
  id?: string
  title: string
  caption?: string
  contentType: string
  publishedAt: string
  permalink?: string
  views?: number | null
  reach?: number | null
  impressions?: number | null
  likes?: number | null
  comments?: number | null
  shares?: number | null
  saves?: number | null
  engagements?: number | null
  watchTimeSeconds?: number | null
  notes?: string
}

export interface ManualContentInput {
  companyId: string
  platform: 'facebook' | 'instagram' | 'youtube' | 'tiktok'
  items: ManualContentItem[]
}

export async function saveManualContentEntryAction(
  input: ManualContentInput
): Promise<{ success: boolean; count?: number; batchId?: string | null; error?: string }> {
  try {
    if (!input || !input.companyId) {
      return { success: false, error: 'Missing company ID or invalid input.' }
    }

    const supabase = await createClient()

    // 1. Verify Permission
    const perm = await verifyCompanyPermission(input.companyId, ['owner', 'admin', 'marketing_manager'])
    if (!perm.authorized) {
      return { success: false, error: perm.error || 'Unauthorized: Only Marketing Managers, Admins, or Owners can save manual content items.' }
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      return { success: false, error: 'Unauthenticated user session.' }
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: 'No content items provided.' }
    }

    const sourceType = 'manual_entry'
    const sourcePriority = DATA_SOURCE_PRIORITIES[sourceType]

    // Create batch history row
    let batchId: string | null = null
    try {
      const { data: batchRow } = await supabase
        .from('data_import_batches')
        .insert({
          company_id: input.companyId,
          platform: input.platform,
          import_type: 'manual_content',
          source_type: sourceType,
          original_file_name: `Manual_Content_${input.platform}_${new Date().toISOString().split('T')[0]}`,
          status: 'completed',
          total_rows: input.items.length,
          valid_rows: input.items.length,
          imported_rows: input.items.length,
          imported_by: user.id,
          imported_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (batchRow?.id) {
        batchId = batchRow.id
      }
    } catch (bErr) {
      console.error('Batch history record caught error:', bErr)
    }

    const contentItemInserts: Record<string, unknown>[] = []
    const contentMetricInserts: Record<string, unknown>[] = []

    input.items.forEach((item, idx) => {
      const itemId = item.id || crypto.randomUUID()
      const provId = `man_${Date.now()}_${idx + 1}`

      contentItemInserts.push({
        id: itemId,
        company_id: input.companyId,
        social_account_id: null,
        provider: input.platform,
        provider_content_id: provId,
        content_type: item.contentType || 'post',
        title: item.title || 'Untitled Post',
        caption: item.caption || null,
        published_at: item.publishedAt || new Date().toISOString(),
        permalink: item.permalink || null,
        data_source: sourceType,
        import_batch_id: batchId,
        imported_by: user.id,
        imported_at: new Date().toISOString(),
        source_reference: item.notes ? `Manual Note: ${item.notes}` : 'Manual Entry',
        source_priority: sourcePriority
      })

      const metricKeys: Array<[string, number | null | undefined]> = [
        ['views', item.views],
        ['reach', item.reach],
        ['impressions', item.impressions],
        ['likes', item.likes],
        ['comments', item.comments],
        ['shares', item.shares],
        ['saves', item.saves],
        ['engagements', item.engagements],
        ['watch_time_seconds', item.watchTimeSeconds]
      ]

      metricKeys.forEach(([mKey, val]) => {
        if (val !== undefined && val !== null) {
          contentMetricInserts.push({
            company_id: input.companyId,
            content_item_id: itemId,
            metric_name: mKey,
            metric_value: val,
            data_source: sourceType,
            import_batch_id: batchId,
            imported_by: user.id,
            imported_at: new Date().toISOString(),
            source_reference: 'Manual Entry',
            source_priority: sourcePriority
          })
        }
      })
    })

    const { error: itemErr } = await supabase.from('content_items').insert(contentItemInserts)
    if (itemErr) {
      console.error('Failed to insert manual content items:', itemErr)
      return { success: false, error: `Database error saving content items: ${itemErr.message}` }
    }

    if (contentMetricInserts.length > 0) {
      const { error: metricErr } = await supabase.from('content_metrics').insert(contentMetricInserts)
      if (metricErr) {
        console.error('Failed to insert manual content metrics:', metricErr)
        return { success: false, error: `Database error saving content metrics: ${metricErr.message}` }
      }
    }

    return { success: true, count: contentItemInserts.length, batchId }
  } catch (err: unknown) {
    console.error('saveManualContentEntryAction exception caught:', err)
    return { success: false, error: (err as Error).message || 'Failed to save manual content entries.' }
  }
}
