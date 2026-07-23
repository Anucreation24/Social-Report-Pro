import { NormalizedMetricName } from '@/lib/analytics/types'

export type ReportType = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'

export type ReportSectionKey =
  | 'header'
  | 'executive_summary'
  | 'overall_performance'
  | 'platform_comparison'
  | 'audience_growth'
  | 'views_reach'
  | 'impressions'
  | 'engagement'
  | 'content_publishing'
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'top_content'
  | 'lowest_content'
  | 'goals'
  | 'period_comparison'
  | 'marketing_notes'
  | 'recommendations'
  | 'data_availability'
  | 'footer'

export type PlatformType = 'facebook' | 'instagram' | 'youtube' | 'tiktok'

export interface SingleMetricResult {
  metricName: NormalizedMetricName
  currentValue: number
  previousValue: number | null
  absoluteChange: number | null
  percentageChange: number | null
  isPositive: boolean
  isUnavailable: boolean
  availabilityReason?: string
  unit?: string
}

export interface PlatformReportData {
  platform: PlatformType
  isConnected: boolean
  hasData: boolean
  availabilityStatus: 'connected' | 'not_connected' | 'permission_limited' | 'no_data'
  statusNotice?: string
  accountName?: string
  accountHandle?: string
  metrics: {
    audienceTotal: SingleMetricResult
    impressions: SingleMetricResult
    reach: SingleMetricResult
    views: SingleMetricResult
    engagements: SingleMetricResult
    likes: SingleMetricResult
    comments: SingleMetricResult
    shares: SingleMetricResult
    contentPublished: SingleMetricResult
  }
}

export interface ReportContentItem {
  providerContentId: string
  platform: PlatformType
  title: string
  captionExcerpt: string
  permalink: string
  thumbnailUrl: string | null
  publishedAt: string
  views: number
  reach: number
  impressions: number
  likes: number
  comments: number
  shares: number
  engagements: number
  engagementRate: number
  rankingReason?: string
}

export interface ReportGoalProgress {
  goalId: string
  platform: string
  metricName: string
  targetValue: number
  baselineValue: number
  currentValue: number
  progressPercentage: number
  status: 'not_started' | 'in_progress' | 'achieved' | 'missed' | 'unavailable'
  remainingAmount: number
}

export interface ExecutiveSummaryStatement {
  id: string
  type: 'positive' | 'neutral' | 'attention' | 'limitation'
  statement: string
  supportingData?: string
}

export interface ReportRecommendation {
  id: string
  priority: 'high' | 'medium' | 'low'
  title: string
  recommendation: string
  supportingData?: string
}

export interface DataAvailabilityItem {
  key: string
  platform?: string
  metricName?: string
  status: 'available' | 'zero_value' | 'unavailable' | 'permission_limited' | 'not_connected' | 'processing_delay'
  message: string
}

export interface GeneratedReportSnapshot {
  company: {
    id: string
    name: string
    logoUrl: string | null
    timezone: string
    weekStartsOn: string
  }

  report: {
    id?: string
    type: ReportType
    title: string
    periodStart: string
    periodEnd: string
    comparisonStart: string
    comparisonEnd: string
    preparedBy: string
    generatedAt: string
    versionNumber: number
    revisionOf?: string | null
  }

  overall: {
    audienceTotal: SingleMetricResult
    impressions: SingleMetricResult
    reach: SingleMetricResult
    views: SingleMetricResult
    engagements: SingleMetricResult
    engagementRate: SingleMetricResult
    watchTimeSeconds: SingleMetricResult
    contentPublished: SingleMetricResult
  }

  platforms: {
    facebook?: PlatformReportData
    instagram?: PlatformReportData
    youtube?: PlatformReportData
    tiktok?: PlatformReportData
  }

  topContent: ReportContentItem[]
  lowestContent: ReportContentItem[]
  goals: ReportGoalProgress[]
  executiveSummary: ExecutiveSummaryStatement[]
  recommendations: ReportRecommendation[]
  dataAvailability: DataAvailabilityItem[]
  notes: {
    executiveSummaryNotes?: string
    marketingNotes?: string
    recommendationsNotes?: string
    platformNotes?: Record<string, string>
  }
}
