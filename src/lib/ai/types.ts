export type SummaryLength = 'short' | 'medium' | 'detailed'

export interface ExecutiveSummary {
  overallNarrative: string
  keyHighlights: string[]
  bestPlatform: string
  topContentTitle: string
  summaryLength: SummaryLength
}

export interface GrowthMetric {
  metricName: string
  currentVal: number
  prevVal: number | null
  absoluteChange: number | null
  percentageChange: number | null
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface PeriodGrowthAnalysis {
  audienceGrowth: GrowthMetric
  viewGrowth: GrowthMetric
  reachGrowth: GrowthMetric
  engagementGrowth: GrowthMetric
  watchTimeGrowth: GrowthMetric
  followerGain: number
  followerLoss: number
  comparisonLabel: string
}

export type GrowthTimeframe = 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'previous_period' | 'yoy'

export interface GrowthAnalysisMap {
  yesterday: PeriodGrowthAnalysis
  last_7_days: PeriodGrowthAnalysis
  last_30_days: PeriodGrowthAnalysis
  this_month: PeriodGrowthAnalysis
  last_month: PeriodGrowthAnalysis
  previous_period: PeriodGrowthAnalysis
  yoy: PeriodGrowthAnalysis
}

export interface PlatformScoreItem {
  platform: string
  score: number // 0-100
  explanation: string[]
  strengths: string[]
  improvements: string[]
  metricsSummary: {
    growthPct: number
    consistencyScore: number
    engagementRatePct: number
    totalViews: number
    totalAudience: number
    postsCount: number
  }
}

export interface ContentItemRef {
  id: string
  title: string
  platform: string
  publishedAt?: string
  views?: number
  engagements?: number
  likes?: number
  comments?: number
  shares?: number
  engagementRate?: number
  reason?: string
}

export interface ContentIntelligence {
  topPosts: ContentItemRef[]
  worstPosts: ContentItemRef[]
  mostShared: ContentItemRef[]
  mostCommented: ContentItemRef[]
  mostViewed: ContentItemRef[]
  highestEngagementRate: ContentItemRef[]
  longestPerforming: ContentItemRef[]
  trendingContent: ContentItemRef[]
}

export type RecommendationCategory =
  | 'Growth'
  | 'Engagement'
  | 'Content Strategy'
  | 'Posting Frequency'
  | 'Platform Optimization'
  | 'Audience Retention'
  | 'Video Optimization'

export type PriorityLevel = 'high' | 'medium' | 'low'

export interface AIRecommendation {
  id: string
  category: RecommendationCategory
  title: string
  action: string
  rationale: string
  priority: PriorityLevel
  impact: string
}

export interface PostingTimeIntelligence {
  bestDay: string
  bestHour: string
  worstDay: string
  worstHour: string
  confidence: 'high' | 'medium' | 'low'
  sampleSize: number
  explanation: string
}

export interface SpikeOrDropAlert {
  metric: string
  platform: string
  changePct: number
  type: 'spike' | 'drop'
  explanation: string
}

export interface TrendDetection {
  increasingMetrics: string[]
  decreasingMetrics: string[]
  stableMetrics: string[]
  suddenSpikes: SpikeOrDropAlert[]
  suddenDrops: SpikeOrDropAlert[]
}

export interface AIForecast {
  nextWeekAudience: number
  nextMonthAudience: number
  expectedViews: number
  expectedEngagement: number
  confidenceScore: number // 0-100
  explanation: string
}

export interface PerformanceGrade {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D'
  score: number // 0-100
  summary: string
  strengths: string[]
  growthAreas: string[]
}

export interface KPICardMetric {
  score: number // 0-100
  label: string
  status: 'excellent' | 'good' | 'fair' | 'needs_attention'
}

export interface ExecutiveKPICards {
  growthScore: KPICardMetric
  consistencyScore: KPICardMetric
  contentScore: KPICardMetric
  audienceHealth: KPICardMetric
  platformHealth: KPICardMetric
  overallHealth: KPICardMetric
}

export interface AIExecutiveIntelligenceReport {
  companyId: string
  generatedAt: string
  summaryLength: SummaryLength
  executiveSummary: ExecutiveSummary
  growthAnalysis: GrowthAnalysisMap
  platformScores: PlatformScoreItem[]
  contentIntelligence: ContentIntelligence
  recommendations: AIRecommendation[]
  postingTimeIntelligence: PostingTimeIntelligence
  trendDetection: TrendDetection
  forecast: AIForecast
  performanceGrade: PerformanceGrade
  executiveKPIs: ExecutiveKPICards
}
