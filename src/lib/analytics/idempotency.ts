import { SupabaseClient } from '@supabase/supabase-js'
import {
  NormalizedAccountMetricResult,
  NormalizedContentItem,
  NormalizedContentMetric
} from './types'
import { SocialPlatform } from '@/lib/connectors/types'

export interface SaveSnapshotsInput {
  companyId: string
  socialAccountId: string
  platformConnectionId?: string
  provider: SocialPlatform
  results: NormalizedAccountMetricResult[]
}

export interface SaveContentInput {
  companyId: string
  socialAccountId: string
  platformConnectionId?: string
  provider: SocialPlatform
  items: NormalizedContentItem[]
}

export interface SaveContentMetricsInput {
  companyId: string
  contentMetrics: NormalizedContentMetric[]
}

/**
 * Idempotently saves account metric snapshots to analytics_snapshots table.
 */
export async function saveAccountSnapshotsIdempotent(
  supabase: SupabaseClient,
  input: SaveSnapshotsInput
): Promise<{ count: number; error: string | null }> {
  const { companyId, socialAccountId, platformConnectionId, provider, results } = input
  if (results.length === 0) return { count: 0, error: null }

  const rowsToUpsert = []

  for (const result of results) {
    for (const metric of result.metrics) {
      rowsToUpsert.push({
        company_id: companyId,
        social_account_id: socialAccountId,
        platform_connection_id: platformConnectionId || null,
        provider,
        snapshot_date: result.snapshotDate,
        aggregation_level: result.aggregationLevel || 'daily',
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit || null,
        provider_metric_name: metric.providerMetricName || null,
        provider_metadata: metric.providerMetadata || {},
        source_period_start: result.sourcePeriodStart || null,
        source_period_end: result.sourcePeriodEnd || null,
        updated_at: new Date().toISOString()
      })
    }
  }

  if (rowsToUpsert.length === 0) return { count: 0, error: null }

  const { error } = await supabase
    .from('analytics_snapshots')
    .upsert(rowsToUpsert, {
      onConflict: 'company_id,social_account_id,provider,snapshot_date,aggregation_level,metric_name'
    })

  if (error) {
    console.error('Failed to upsert analytics_snapshots:', error)
    return { count: 0, error: error.message }
  }

  return { count: rowsToUpsert.length, error: null }
}

/**
 * Idempotently saves content items to content_items table.
 * Returns map of provider_content_id -> db content_item_id.
 */
export async function saveContentItemsIdempotent(
  supabase: SupabaseClient,
  input: SaveContentInput
): Promise<{ itemMap: Map<string, string>; error: string | null }> {
  const { companyId, socialAccountId, platformConnectionId, provider, items } = input
  const itemMap = new Map<string, string>()
  if (items.length === 0) return { itemMap, error: null }

  const rowsToUpsert = items.map(item => ({
    company_id: companyId,
    social_account_id: socialAccountId,
    platform_connection_id: platformConnectionId || null,
    provider,
    provider_content_id: item.providerContentId,
    content_type: item.contentType,
    title: item.title || null,
    caption: item.captionExcerpt || null,
    caption_excerpt: item.captionExcerpt || null,
    permalink: item.permalink || null,
    thumbnail_url: item.thumbnailUrl || null,
    published_at: item.publishedAt,
    duration_seconds: item.durationSeconds || null,
    status: item.status || 'published',
    provider_metadata: item.providerMetadata || {},
    updated_at: new Date().toISOString()
  }))

  const { data, error } = await supabase
    .from('content_items')
    .upsert(rowsToUpsert, {
      onConflict: 'provider,social_account_id,provider_content_id'
    })
    .select('id, provider_content_id')

  if (error) {
    console.error('Failed to upsert content_items:', error)
    return { itemMap, error: error.message }
  }

  if (data) {
    for (const row of data) {
      itemMap.set(row.provider_content_id, row.id)
    }
  }

  return { itemMap, error: null }
}

/**
 * Idempotently saves content metrics to content_metrics table.
 */
export async function saveContentMetricsIdempotent(
  supabase: SupabaseClient,
  input: SaveContentMetricsInput,
  itemMap: Map<string, string>
): Promise<{ count: number; error: string | null }> {
  const { companyId, contentMetrics } = input
  if (contentMetrics.length === 0) return { count: 0, error: null }

  const rowsToUpsert = []

  for (const cm of contentMetrics) {
    const dbContentItemId = itemMap.get(cm.providerContentId)
    if (!dbContentItemId) continue

    for (const m of cm.metrics) {
      rowsToUpsert.push({
        company_id: companyId,
        content_item_id: dbContentItemId,
        metric_date: cm.metricDate,
        metric_name: m.name,
        metric_value: m.value,
        provider_metric_name: m.providerMetricName || null,
        provider_metadata: m.providerMetadata || {},
        updated_at: new Date().toISOString()
      })
    }
  }

  if (rowsToUpsert.length === 0) return { count: 0, error: null }

  const { error } = await supabase
    .from('content_metrics')
    .upsert(rowsToUpsert, {
      onConflict: 'content_item_id,metric_date,metric_name'
    })

  if (error) {
    console.error('Failed to upsert content_metrics:', error)
    return { count: 0, error: error.message }
  }

  return { count: rowsToUpsert.length, error: null }
}
