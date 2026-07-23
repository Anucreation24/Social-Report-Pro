import { createClient } from '@/lib/supabase/client'
import { DateRange, MetricSummaryCard, NormalizedMetricName } from '@/lib/analytics/types'
import { getPreviousEquivalentPeriod } from '@/lib/analytics/date-ranges'
import { calculateGrowth } from '@/lib/analytics/growth'
import { aggregateCombinedMetrics, ContentMetricDbRow, DbSnapshotRow } from '@/lib/analytics/aggregation'

export interface DashboardMetricsResult {
  summaryCards: MetricSummaryCard[]
  platformBreakdown: Array<{
    platform: string
    audience: number
    views: number
    engagements: number
  }>
  lastSyncAt: string | null
}

export async function fetchDashboardAnalyticsData(
  companyId: string,
  range: DateRange
): Promise<DashboardMetricsResult> {
  const supabase = await createClient()

  const prevRange = getPreviousEquivalentPeriod(range)

  // 1. Fetch current range snapshots
  const { data: currentRows } = await supabase
    .from('analytics_snapshots')
    .select('snapshot_date, metric_name, metric_value, aggregation_level, provider, social_account_id')
    .eq('company_id', companyId)
    .gte('snapshot_date', range.startDate)
    .lte('snapshot_date', range.endDate)

  // 2. Fetch previous range snapshots
  const { data: prevRows } = await supabase
    .from('analytics_snapshots')
    .select('snapshot_date, metric_name, metric_value, aggregation_level, provider, social_account_id')
    .eq('company_id', companyId)
    .gte('snapshot_date', prevRange.startDate)
    .lte('snapshot_date', prevRange.endDate)

  // 3. Fetch current range content metrics
  const { data: currentContentRows } = await supabase
    .from('content_metrics')
    .select('metric_date, metric_name, metric_value, content_items(provider)')
    .eq('company_id', companyId)
    .gte('metric_date', range.startDate)
    .lte('metric_date', range.endDate)

  // 4. Fetch previous range content metrics
  const { data: prevContentRows } = await supabase
    .from('content_metrics')
    .select('metric_date, metric_name, metric_value, content_items(provider)')
    .eq('company_id', companyId)
    .gte('metric_date', prevRange.startDate)
    .lte('metric_date', prevRange.endDate)

  // 5. Fetch latest connection sync timestamp
  const { data: conn } = await supabase
    .from('platform_connections')
    .select('last_successful_sync_at')
    .eq('company_id', companyId)
    .not('last_successful_sync_at', 'is', null)
    .order('last_successful_sync_at', { ascending: false })
    .limit(1)

  const lastSyncAt = conn && conn.length > 0 ? conn[0].last_successful_sync_at : null

  const cRows = (currentRows || []) as DbSnapshotRow[]
  const pRows = (prevRows || []) as DbSnapshotRow[]

  interface ContentMetricsJoinRow {
    metric_date: string
    metric_name: string
    metric_value: number
    content_items: { provider: string } | null
  }

  const cContent: ContentMetricDbRow[] = (currentContentRows as unknown as ContentMetricsJoinRow[] || []).map(r => ({
    metric_date: r.metric_date,
    metric_name: r.metric_name,
    metric_value: r.metric_value,
    provider: r.content_items?.provider
  }))

  const pContent: ContentMetricDbRow[] = (prevContentRows as unknown as ContentMetricsJoinRow[] || []).map(r => ({
    metric_date: r.metric_date,
    metric_name: r.metric_name,
    metric_value: r.metric_value,
    provider: r.content_items?.provider
  }))

  const metricsToSummarize: Array<{ key: NormalizedMetricName; label: string; unit?: string; tooltip?: string }> = [
    { key: 'audience_total', label: 'Total Audience', tooltip: 'Latest total follower/subscriber count across platforms.' },
    { key: 'impressions', label: 'Total Impressions', tooltip: 'Total times content was displayed.' },
    { key: 'views', label: 'Total Views', tooltip: 'Total video/post views.' },
    { key: 'engagements', label: 'Total Engagements', tooltip: 'Sum of likes, comments, and shares.' },
    { key: 'watch_time_seconds', label: 'Watch Time (Hours)', unit: 'hrs', tooltip: 'Total watch time in hours.' }
  ]

  const summaryCards: MetricSummaryCard[] = metricsToSummarize.map(item => {
    let curVal = aggregateCombinedMetrics(cRows, cContent, item.key)
    let preVal = aggregateCombinedMetrics(pRows, pContent, item.key)

    if (item.key === 'watch_time_seconds') {
      curVal = parseFloat((curVal / 3600).toFixed(1))
      preVal = parseFloat((preVal / 3600).toFixed(1))
    }

    const growth = calculateGrowth(curVal, preVal)

    return {
      metricName: item.key,
      label: item.label,
      currentTotal: curVal,
      growth,
      unit: item.unit,
      tooltipExplanation: item.tooltip
    }
  })

  // Platform breakdown
  const platforms = ['facebook', 'youtube', 'instagram', 'tiktok']
  const platformBreakdown = platforms.map(p => {
    const pSnapCurr = cRows.filter(r => r.provider === p)
    const pContentCurr = cContent.filter(r => r.provider === p)
    return {
      platform: p,
      audience: aggregateCombinedMetrics(pSnapCurr, pContentCurr, 'audience_total'),
      views: aggregateCombinedMetrics(pSnapCurr, pContentCurr, 'views'),
      engagements: aggregateCombinedMetrics(pSnapCurr, pContentCurr, 'engagements')
    }
  })

  return {
    summaryCards,
    platformBreakdown,
    lastSyncAt
  }
}

export async function fetchAnalyticsTrendData(
  companyId: string,
  range: DateRange,
  platformFilter: string = 'all'
) {
  const supabase = await createClient()

  let snapQuery = supabase
    .from('analytics_snapshots')
    .select('snapshot_date, metric_name, metric_value, provider')
    .eq('company_id', companyId)
    .gte('snapshot_date', range.startDate)
    .lte('snapshot_date', range.endDate)

  if (platformFilter !== 'all') {
    snapQuery = snapQuery.eq('provider', platformFilter)
  }

  const { data: snapData } = await snapQuery

  const contentQuery = supabase
    .from('content_metrics')
    .select('metric_date, metric_name, metric_value, content_items(provider)')
    .eq('company_id', companyId)
    .gte('metric_date', range.startDate)
    .lte('metric_date', range.endDate)

  const { data: contentData } = await contentQuery

  const snapRows = snapData || []
  interface ContentJoinRow {
    metric_date: string
    metric_name: string
    metric_value: number
    content_items: { provider: string } | null
  }
  const contentRows = (contentData as unknown as ContentJoinRow[] || []).filter(r => 
    platformFilter === 'all' || r.content_items?.provider === platformFilter
  )

  // Group by date
  const dateMap = new Map<string, Record<string, number>>()

  for (const r of snapRows) {
    const d = r.snapshot_date
    if (!dateMap.has(d)) {
      dateMap.set(d, { date: d } as unknown as Record<string, number>)
    }
    const node = dateMap.get(d)!
    const metricKey = `${r.provider}_${r.metric_name}`
    node[metricKey] = Math.max(node[metricKey] || 0, r.metric_value)
    node[r.metric_name] = Math.max(node[r.metric_name] || 0, r.metric_value)
  }

  for (const r of contentRows) {
    const d = r.metric_date
    if (!d) continue
    const p = r.content_items?.provider || 'facebook'
    if (!dateMap.has(d)) {
      dateMap.set(d, { date: d } as unknown as Record<string, number>)
    }
    const node = dateMap.get(d)!
    const metricKey = `${p}_${r.metric_name}`
    node[metricKey] = Math.max(node[metricKey] || 0, r.metric_value)
    node[r.metric_name] = Math.max(node[r.metric_name] || 0, r.metric_value)
  }

  const sortedDates = Array.from(dateMap.keys()).sort()
  return sortedDates.map(d => dateMap.get(d)!)
}

export async function fetchContentPerformanceData(
  companyId: string,
  options: {
    platform?: string
    contentType?: string
    search?: string
    sortBy?: string
    page?: number
    pageSize?: number
  }
) {
  const supabase = await createClient()
  const { platform = 'all', contentType = 'all', search = '', sortBy = 'newest', page = 1, pageSize = 20 } = options

  let query = supabase
    .from('content_items')
    .select(`
      id,
      provider,
      provider_content_id,
      content_type,
      title,
      caption_excerpt,
      permalink,
      thumbnail_url,
      published_at,
      duration_seconds,
      status,
      content_metrics (
        metric_name,
        metric_value
      )
    `, { count: 'exact' })
    .eq('company_id', companyId)

  if (platform !== 'all') {
    query = query.eq('provider', platform)
  }

  if (contentType !== 'all') {
    query = query.eq('content_type', contentType)
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (sortBy === 'newest') {
    query = query.order('published_at', { ascending: false })
  } else {
    query = query.order('published_at', { ascending: false })
  }

  const fromIndex = (page - 1) * pageSize
  const toIndex = fromIndex + pageSize - 1

  query = query.range(fromIndex, toIndex)

  const { data, count, error } = await query

  if (error || !data) {
    return { items: [], totalCount: 0 }
  }

  interface RawMetricRow {
    metric_name: string
    metric_value: number
  }

  const formattedItems = data.map(item => {
    const rawMetrics = (item.content_metrics || []) as unknown as RawMetricRow[]
    const metricsMap: Record<string, number> = {}

    for (const m of rawMetrics) {
      metricsMap[m.metric_name] = (metricsMap[m.metric_name] || 0) + m.metric_value
    }

    return {
      id: item.id,
      provider: item.provider,
      providerContentId: item.provider_content_id,
      contentType: item.content_type,
      title: item.title || 'Untitled Content',
      captionExcerpt: item.caption_excerpt || '',
      permalink: item.permalink || '#',
      thumbnailUrl: item.thumbnail_url || '',
      publishedAt: item.published_at,
      durationSeconds: item.duration_seconds,
      views: metricsMap['views'] || 0,
      reach: metricsMap['reach'] || 0,
      impressions: metricsMap['impressions'] || 0,
      likes: metricsMap['likes'] || 0,
      comments: metricsMap['comments'] || 0,
      shares: metricsMap['shares'] || 0,
      engagements: metricsMap['engagements'] || (metricsMap['likes'] || 0) + (metricsMap['comments'] || 0) + (metricsMap['shares'] || 0)
    }
  })

  // In-memory sort for metric columns if specified
  if (sortBy === 'views') {
    formattedItems.sort((a, b) => b.views - a.views)
  } else if (sortBy === 'engagements') {
    formattedItems.sort((a, b) => b.engagements - a.engagements)
  } else if (sortBy === 'reach') {
    formattedItems.sort((a, b) => b.reach - a.reach)
  }

  return {
    items: formattedItems,
    totalCount: count || 0
  }
}

export async function fetchSyncJobsHistory(companyId: string, limit: number = 20) {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('sync_jobs')
    .select(`
      id,
      company_id,
      platform_connection_id,
      provider,
      job_type,
      status,
      started_at,
      completed_at,
      attempt_count,
      error_category,
      safe_error_message,
      metadata,
      created_at
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return jobs || []
}
