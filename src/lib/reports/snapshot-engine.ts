import { SupabaseClient } from '@supabase/supabase-js'
import { NormalizedMetricName } from '@/lib/analytics/types'
import { DbSnapshotRow } from '@/lib/analytics/aggregation'
import {
  DataAvailabilityItem,
  GeneratedReportSnapshot,
  PlatformReportData,
  PlatformType,
  ReportContentItem,
  ReportGoalProgress,
  ReportType,
  SingleMetricResult
} from './types'
import { calculateWeeklyReportPeriod, calculateMonthlyReportPeriod, ReportPeriodRange } from './periods'
import { generateExecutiveSummary } from './executive-summary'
import { generateRecommendations } from './recommendations'
import { aggregateCombinedMetrics } from '@/lib/analytics/aggregation'

export interface BuildSnapshotParams {
  companyId: string
  reportType: ReportType
  periodStart?: string
  periodEnd?: string
  comparisonStart?: string
  comparisonEnd?: string
  includedPlatforms?: PlatformType[]
  preparedBy?: string
  reportTitle?: string
  notes?: {
    executiveSummaryNotes?: string
    marketingNotes?: string
    recommendationsNotes?: string
  }
}

function computeSingleMetric(
  metricName: NormalizedMetricName,
  currentVal: number,
  prevVal: number | null,
  isPermissionLimited = false,
  unit?: string
): SingleMetricResult {
  if (isPermissionLimited) {
    return {
      metricName,
      currentValue: 0,
      previousValue: null,
      absoluteChange: null,
      percentageChange: null,
      isPositive: false,
      isUnavailable: true,
      availabilityReason: 'Unavailable due to Meta permission limitations',
      unit
    }
  }

  if (prevVal === null || prevVal === undefined) {
    return {
      metricName,
      currentValue: currentVal,
      previousValue: null,
      absoluteChange: null,
      percentageChange: null,
      isPositive: currentVal > 0,
      isUnavailable: true,
      availabilityReason: 'No previous period baseline',
      unit
    }
  }

  const absChange = currentVal - prevVal
  let pctChange: number | null = null

  if (prevVal === 0) {
    pctChange = currentVal > 0 ? 100 : 0
  } else {
    pctChange = Math.round(((currentVal - prevVal) / Math.abs(prevVal)) * 100 * 10) / 10
  }

  return {
    metricName,
    currentValue: currentVal,
    previousValue: prevVal,
    absoluteChange: absChange,
    percentageChange: pctChange,
    isPositive: absChange >= 0,
    isUnavailable: false,
    unit
  }
}

export async function buildReportSnapshot(
  supabase: SupabaseClient,
  params: BuildSnapshotParams
): Promise<GeneratedReportSnapshot> {
  const { companyId, reportType } = params

  // 1. Resolve company profile and preferences
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, logo_url, timezone')
    .eq('id', companyId)
    .single()

  if (!company) {
    throw new Error(`Company with ID ${companyId} not found`)
  }

  const { data: prefRow } = await supabase
    .from('company_preferences')
    .select('settings')
    .eq('company_id', companyId)
    .maybeSingle()

  const timezone = company.timezone || (prefRow?.settings?.timezone as string) || 'Asia/Colombo'
  const weekStartsOn = (prefRow?.settings?.weekStartsOn as string) || 'monday'

  // 2. Resolve dates
  let periods: ReportPeriodRange
  if (params.periodStart && params.periodEnd) {
    periods = {
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      comparisonStart: params.comparisonStart || params.periodStart,
      comparisonEnd: params.comparisonEnd || params.periodEnd,
      label: `${reportType.toUpperCase()} Report (${params.periodStart} to ${params.periodEnd})`
    }
  } else if (reportType === 'weekly') {
    periods = calculateWeeklyReportPeriod(undefined, weekStartsOn)
  } else {
    periods = calculateMonthlyReportPeriod()
  }

  // 3. Fetch Platform Connections
  const { data: connections } = await supabase
    .from('platform_connections')
    .select('id, provider, account_name, provider_account_id, is_active')
    .eq('company_id', companyId)

  const activeConnections = connections || []
  const connectedProviders = new Set(activeConnections.filter(c => c.is_active).map(c => c.provider))

  // 4. Fetch Stored Analytics Snapshots
  const { data: currentSnapshots } = await supabase
    .from('analytics_snapshots')
    .select('provider, metric_name, metric_value, snapshot_date')
    .eq('company_id', companyId)
    .gte('snapshot_date', periods.periodStart)
    .lte('snapshot_date', periods.periodEnd)

  const { data: prevSnapshots } = await supabase
    .from('analytics_snapshots')
    .select('provider, metric_name, metric_value, snapshot_date')
    .eq('company_id', companyId)
    .gte('snapshot_date', periods.comparisonStart)
    .lte('snapshot_date', periods.comparisonEnd)

  // 5. Fetch Content Items & Content Metrics
  const { data: currentContentItems } = await supabase
    .from('content_items')
    .select(`
      id, provider, provider_content_id, content_type, title, caption_excerpt, permalink, thumbnail_url, published_at,
      content_metrics (metric_name, metric_value, metric_date)
    `)
    .eq('company_id', companyId)
    .gte('published_at', `${periods.periodStart}T00:00:00Z`)
    .lte('published_at', `${periods.periodEnd}T23:59:59Z`)
    .order('published_at', { ascending: false })

  const { data: prevContentItems } = await supabase
    .from('content_items')
    .select('id, provider')
    .eq('company_id', companyId)
    .gte('published_at', `${periods.comparisonStart}T00:00:00Z`)
    .lte('published_at', `${periods.comparisonEnd}T23:59:59Z`)

  const curSnapRows: DbSnapshotRow[] = (currentSnapshots || []).map(s => ({
    snapshot_date: s.snapshot_date,
    metric_date: s.snapshot_date,
    metric_name: s.metric_name,
    metric_value: s.metric_value,
    provider: s.provider
  }))

  const prevSnapRows: DbSnapshotRow[] = (prevSnapshots || []).map(s => ({
    snapshot_date: s.snapshot_date,
    metric_date: s.snapshot_date,
    metric_name: s.metric_name,
    metric_value: s.metric_value,
    provider: s.provider
  }))

  // 6. Aggregate Overall Metrics
  const curAudience = aggregateCombinedMetrics(curSnapRows, [], 'audience_total')
  const prevAudience = aggregateCombinedMetrics(prevSnapRows, [], 'audience_total')

  const curViews = aggregateCombinedMetrics(curSnapRows, [], 'views')
  const prevViews = aggregateCombinedMetrics(prevSnapRows, [], 'views')

  const curEngagements = aggregateCombinedMetrics(curSnapRows, [], 'engagements')
  const prevEngagements = aggregateCombinedMetrics(prevSnapRows, [], 'engagements')

  const curImpressions = aggregateCombinedMetrics(curSnapRows, [], 'impressions')
  const prevImpressions = aggregateCombinedMetrics(prevSnapRows, [], 'impressions')

  const curReach = aggregateCombinedMetrics(curSnapRows, [], 'reach')
  const prevReach = aggregateCombinedMetrics(prevSnapRows, [], 'reach')

  const curWatchTime = aggregateCombinedMetrics(curSnapRows, [], 'watch_time_seconds')
  const prevWatchTime = aggregateCombinedMetrics(prevSnapRows, [], 'watch_time_seconds')

  const curPublished = (currentContentItems || []).length
  const prevPublished = (prevContentItems || []).length

  // Calculate Overall Engagement Rate
  const curEngRate = curViews > 0 ? Math.round((curEngagements / curViews) * 100 * 10) / 10 : 0
  const prevEngRate = prevViews > 0 ? Math.round((prevEngagements / prevViews) * 100 * 10) / 10 : null

  // 7. Aggregate Platform Specific Data
  const targetPlatforms: PlatformType[] = params.includedPlatforms || ['facebook', 'youtube', 'instagram', 'tiktok']
  const platformReportMap: Record<string, PlatformReportData> = {}

  for (const p of targetPlatforms) {
    const isConn = connectedProviders.has(p)
    const connObj = activeConnections.find(c => c.provider === p)

    const pCurSnap = curSnapRows.filter(r => r.provider === p)
    const pPrevSnap = prevSnapRows.filter(r => r.provider === p)

    const pAudience = aggregateCombinedMetrics(pCurSnap, [], 'audience_total')
    const pPrevAudience = aggregateCombinedMetrics(pPrevSnap, [], 'audience_total')

    const pViews = aggregateCombinedMetrics(pCurSnap, [], 'views')
    const pPrevViews = aggregateCombinedMetrics(pPrevSnap, [], 'views')

    const pEng = aggregateCombinedMetrics(pCurSnap, [], 'engagements')
    const pPrevEng = aggregateCombinedMetrics(pPrevSnap, [], 'engagements')

    const pImp = aggregateCombinedMetrics(pCurSnap, [], 'impressions')
    const pPrevImp = aggregateCombinedMetrics(pPrevSnap, [], 'impressions')

    const pReach = aggregateCombinedMetrics(pCurSnap, [], 'reach')
    const pPrevReach = aggregateCombinedMetrics(pPrevSnap, [], 'reach')

    const pLikes = aggregateCombinedMetrics(pCurSnap, [], 'likes')
    const pPrevLikes = aggregateCombinedMetrics(pPrevSnap, [], 'likes')

    const pComments = aggregateCombinedMetrics(pCurSnap, [], 'comments')
    const pPrevComments = aggregateCombinedMetrics(pPrevSnap, [], 'comments')

    const pShares = aggregateCombinedMetrics(pCurSnap, [], 'shares')
    const pPrevShares = aggregateCombinedMetrics(pPrevSnap, [], 'shares')

    const pPub = (currentContentItems || []).filter(item => item.provider === p).length
    const pPrevPub = (prevContentItems || []).filter(item => item.provider === p).length

    // Meta Permission Notice check for Facebook
    const fbPermissionLimited = p === 'facebook' && isConn && pImp === 0

    platformReportMap[p] = {
      platform: p,
      isConnected: isConn,
      hasData: isConn && (pAudience > 0 || pViews > 0 || pEng > 0 || pPub > 0),
      availabilityStatus: !isConn
        ? 'not_connected'
        : fbPermissionLimited
        ? 'permission_limited'
        : (pAudience > 0 || pViews > 0 || pEng > 0)
        ? 'connected'
        : 'no_data',
      statusNotice: fbPermissionLimited
        ? 'Impressions & Reach unavailable due to Meta permission limitations'
        : !isConn
        ? 'Platform not connected'
        : undefined,
      accountName: connObj?.account_name || undefined,
      metrics: {
        audienceTotal: computeSingleMetric('audience_total', pAudience, pPrevAudience > 0 ? pPrevAudience : null, false, 'followers'),
        impressions: computeSingleMetric('impressions', pImp, pPrevImp > 0 ? pPrevImp : null, fbPermissionLimited),
        reach: computeSingleMetric('reach', pReach, pPrevReach > 0 ? pPrevReach : null, fbPermissionLimited),
        views: computeSingleMetric('views', pViews, pPrevViews > 0 ? pPrevViews : null),
        engagements: computeSingleMetric('engagements', pEng, pPrevEng > 0 ? pPrevEng : null),
        likes: computeSingleMetric('likes', pLikes, pPrevLikes > 0 ? pPrevLikes : null),
        comments: computeSingleMetric('comments', pComments, pPrevComments > 0 ? pPrevComments : null),
        shares: computeSingleMetric('shares', pShares, pPrevShares > 0 ? pPrevShares : null),
        contentPublished: computeSingleMetric('content_published', pPub, pPrevPub > 0 ? pPrevPub : null)
      }
    }
  }

  // 8. Format Content Performance Rankings
  const formattedContent: ReportContentItem[] = (currentContentItems || []).map(item => {
    let likes = 0
    let comments = 0
    let shares = 0
    let views = 0
    let reach = 0
    let impressions = 0

    for (const m of item.content_metrics || []) {
      if (m.metric_name === 'likes') likes += m.metric_value
      if (m.metric_name === 'comments') comments += m.metric_value
      if (m.metric_name === 'shares') shares += m.metric_value
      if (m.metric_name === 'views') views += m.metric_value
      if (m.metric_name === 'reach') reach += m.metric_value
      if (m.metric_name === 'impressions') impressions += m.metric_value
    }

    const engagements = likes + comments + shares
    const engRate = views > 0 ? Math.round((engagements / views) * 100 * 10) / 10 : 0

    return {
      providerContentId: item.provider_content_id,
      platform: item.provider as PlatformType,
      title: item.title || 'Untitled Post',
      captionExcerpt: item.caption_excerpt || '',
      permalink: item.permalink || '#',
      thumbnailUrl: item.thumbnail_url,
      publishedAt: item.published_at,
      views,
      reach,
      impressions,
      likes,
      comments,
      shares,
      engagements,
      engagementRate: engRate
    }
  })

  // Rank Top Content by total engagements
  const sortedByEngagements = [...formattedContent].sort((a, b) => b.engagements - a.engagements)
  const topContent = sortedByEngagements.slice(0, 10).map((c, idx) => ({
    ...c,
    rankingReason: `#${idx + 1} highest engagements (${c.engagements.toLocaleString()} total interactions)`
  }))

  // Lowest Content ("Content Requiring Review") - only items with available engagement data
  const lowestContent = sortedByEngagements.slice(-5).reverse().map(c => ({
    ...c,
    rankingReason: `Opportunity for engagement optimization (${c.engagements.toLocaleString()} interactions)`
  }))

  // 9. Fetch Goals Progress
  const { data: dbGoals } = await supabase
    .from('goals')
    .select('id, platform, metric_name, target_value, baseline_value, current_value, target_date')
    .eq('company_id', companyId)

  const goals: ReportGoalProgress[] = (dbGoals || []).map(g => {
    const baseline = g.baseline_value || 0
    const target = g.target_value || 1
    const current = g.current_value || 0
    const remaining = Math.max(0, target - current)

    let pct = Math.round(((current - baseline) / Math.max(1, target - baseline)) * 100)
    pct = Math.min(100, Math.max(0, pct))

    let status: ReportGoalProgress['status'] = 'in_progress'
    if (current >= target) status = 'achieved'

    return {
      goalId: g.id,
      platform: g.platform,
      metricName: g.metric_name,
      targetValue: target,
      baselineValue: baseline,
      currentValue: current,
      progressPercentage: pct,
      status,
      remainingAmount: remaining
    }
  })

  // 10. Data Availability Summary List
  const dataAvailability: DataAvailabilityItem[] = [
    {
      key: 'facebook_impressions',
      platform: 'facebook',
      metricName: 'impressions',
      status: connectedProviders.has('facebook') ? (curImpressions > 0 ? 'available' : 'permission_limited') : 'not_connected',
      message: connectedProviders.has('facebook')
        ? (curImpressions > 0 ? 'Facebook Impressions & Reach available' : 'Facebook Impressions unavailable due to Meta permission limitations.')
        : 'Facebook is not connected for this company.'
    },
    {
      key: 'youtube_analytics',
      platform: 'youtube',
      metricName: 'views',
      status: connectedProviders.has('youtube') ? 'available' : 'not_connected',
      message: connectedProviders.has('youtube')
        ? 'YouTube channel views and content metrics ingested.'
        : 'YouTube channel is not connected for this company.'
    },
    {
      key: 'instagram_account',
      platform: 'instagram',
      status: connectedProviders.has('instagram') ? 'available' : 'not_connected',
      message: connectedProviders.has('instagram')
        ? 'Instagram account active.'
        : 'Instagram Professional account is not connected.'
    },
    {
      key: 'tiktok_account',
      platform: 'tiktok',
      status: connectedProviders.has('tiktok') ? 'available' : 'not_connected',
      message: connectedProviders.has('tiktok')
        ? 'TikTok account active.'
        : 'TikTok account is not connected.'
    }
  ]

  // Construct draft snapshot for rule compilers
  const draftSnapshot: Partial<GeneratedReportSnapshot> = {
    overall: {
      audienceTotal: computeSingleMetric('audience_total', curAudience, prevAudience > 0 ? prevAudience : null, false, 'followers'),
      impressions: computeSingleMetric('impressions', curImpressions, prevImpressions > 0 ? prevImpressions : null, false),
      reach: computeSingleMetric('reach', curReach, prevReach > 0 ? prevReach : null, false),
      views: computeSingleMetric('views', curViews, prevViews > 0 ? prevViews : null),
      engagements: computeSingleMetric('engagements', curEngagements, prevEngagements > 0 ? prevEngagements : null),
      engagementRate: computeSingleMetric('engagement_rate', curEngRate, prevEngRate, false, '%'),
      watchTimeSeconds: computeSingleMetric('watch_time_seconds', curWatchTime, prevWatchTime > 0 ? prevWatchTime : null, false, 'hrs'),
      contentPublished: computeSingleMetric('content_published', curPublished, prevPublished > 0 ? prevPublished : null)
    },
    platforms: platformReportMap,
    topContent,
    goals
  }

  const executiveSummary = generateExecutiveSummary(draftSnapshot)
  const recommendations = generateRecommendations(draftSnapshot)

  return {
    company: {
      id: company.id,
      name: company.name,
      logoUrl: company.logo_url,
      timezone,
      weekStartsOn
    },

    report: {
      type: reportType,
      title: params.reportTitle || `${reportType.toUpperCase()} Social Media Performance Report`,
      periodStart: periods.periodStart,
      periodEnd: periods.periodEnd,
      comparisonStart: periods.comparisonStart,
      comparisonEnd: periods.comparisonEnd,
      preparedBy: params.preparedBy || 'Marketing Department',
      generatedAt: new Date().toISOString(),
      versionNumber: 1
    },

    overall: draftSnapshot.overall!,
    platforms: platformReportMap,
    topContent,
    lowestContent,
    goals,
    executiveSummary,
    recommendations,
    dataAvailability,
    notes: {
      executiveSummaryNotes: params.notes?.executiveSummaryNotes,
      marketingNotes: params.notes?.marketingNotes,
      recommendationsNotes: params.notes?.recommendationsNotes
    }
  }
}
