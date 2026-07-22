import { SocialPlatform } from '@/lib/connectors/types'

export type NormalizedMetricName =
  | 'audience_total'
  | 'audience_gained'
  | 'audience_lost'
  | 'reach'
  | 'impressions'
  | 'views'
  | 'engagements'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'saves'
  | 'clicks'
  | 'watch_time_seconds'
  | 'average_view_duration_seconds'
  | 'engagement_rate'
  | 'click_through_rate'
  | 'content_published'

export type AggregationLevel = 'daily' | 'weekly' | 'monthly' | 'lifetime'

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'current_week'
  | 'previous_week'
  | 'current_month'
  | 'previous_month'
  | 'custom'

export interface DateRange {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  preset?: DateRangePreset
}

export interface MetricValuePoint {
  name: NormalizedMetricName
  value: number
  unit?: string
  providerMetricName?: string
  providerMetadata?: Record<string, unknown>
}

export interface NormalizedAccountMetricResult {
  snapshotDate: string // YYYY-MM-DD
  aggregationLevel: AggregationLevel
  metrics: MetricValuePoint[]
  sourcePeriodStart?: string
  sourcePeriodEnd?: string
}

export interface NormalizedContentItem {
  providerContentId: string
  contentType: string // 'post' | 'video' | 'reel' | 'short' | 'photo'
  title?: string
  captionExcerpt?: string
  permalink?: string
  thumbnailUrl?: string
  publishedAt: string // ISO timestamp
  durationSeconds?: number
  status?: string
  providerMetadata?: Record<string, unknown>
}

export interface NormalizedContentMetric {
  providerContentId: string
  metricDate: string // YYYY-MM-DD
  metrics: Array<{
    name: NormalizedMetricName
    value: number
    providerMetricName?: string
    providerMetadata?: Record<string, unknown>
  }>
}

export interface ProviderAnalyticsCapabilities {
  supportedAccountMetrics: NormalizedMetricName[]
  supportedContentMetrics: NormalizedMetricName[]
  maxHistoricalDays: number
  supportsRealtime: boolean
}

export interface GrowthComparisonResult {
  currentValue: number
  previousValue: number
  absoluteChange: number
  percentageChange: number // e.g. +15.5 or -5.2 (NaN / Infinity safe)
  isPositive: boolean
  isZeroBaseline: boolean
  isUnavailable: boolean
}

export interface MetricSummaryCard {
  metricName: NormalizedMetricName
  label: string
  currentTotal: number
  growth: GrowthComparisonResult
  unit?: string
  tooltipExplanation?: string
}

export interface SyncJobSummary {
  id: string
  companyId: string
  platformConnectionId?: string
  provider: SocialPlatform
  jobType: 'manual' | 'scheduled' | 'backfill'
  status: 'queued' | 'running' | 'partially_completed' | 'completed' | 'failed' | 'cancelled'
  startedAt?: string
  completedAt?: string
  attemptCount: number
  errorCategory?: string
  safeErrorMessage?: string
  metadata?: Record<string, unknown>
  createdAt: string
}
