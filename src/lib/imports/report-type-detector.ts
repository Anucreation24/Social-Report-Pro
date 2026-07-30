export type DetectedReportType =
  | 'account_summary'
  | 'daily_overview'
  | 'audience_growth'
  | 'content_performance'
  | 'video_performance'
  | 'generic_metrics'

export interface ReportTypeDetectionResult {
  detectedReportType: DetectedReportType
  confidence: number
  matchedReason: string
}

/**
 * Automatically detects report type category from headers and row structure.
 */
export function detectReportTypeFromHeaders(headers: string[]): ReportTypeDetectionResult {
  const normHeaders = headers.map(h => h.toLowerCase().trim().replace(/_/g, ' '))

  const isContentSpecific = normHeaders.some(h =>
    ['title', 'content id', 'post id', 'video title', 'caption', 'permalink', 'url', 'post link', 'video id'].includes(h)
  )

  const isVideoPerformance = normHeaders.some(h =>
    ['video title', 'video id', 'watch time', 'average view duration', 'video completion rate'].includes(h)
  )

  const hasDate = normHeaders.some(h => h === 'date' || h.includes('date') || h.includes('period'))
  const hasDailyOverviewMetrics = normHeaders.some(h => ['video views', 'profile views'].includes(h))

  // 1. Check for Daily Overview (e.g. TikTok Overview.csv with Date, Video Views, Profile Views, Likes, Comments, Shares)
  if (hasDate && hasDailyOverviewMetrics && !isContentSpecific) {
    return {
      detectedReportType: 'daily_overview',
      confidence: 0.95,
      matchedReason: 'Detected daily overview metrics (Date, Video Views, Profile Views)'
    }
  }

  // 2. Check for Specific Content or Video Performance
  if (isContentSpecific) {
    const reportType = isVideoPerformance ? 'video_performance' : 'content_performance'
    return {
      detectedReportType: reportType,
      confidence: 0.90,
      matchedReason: `Detected ${reportType.replace('_', ' ')} fields (title/content_id/caption)`
    }
  }

  // 3. Check for Audience Growth
  const hasAudienceGrowth = normHeaders.some(h => ['followers gained', 'followers lost', 'net followers'].includes(h))
  if (hasAudienceGrowth) {
    return {
      detectedReportType: 'audience_growth',
      confidence: 0.88,
      matchedReason: 'Detected audience growth metrics'
    }
  }

  // 4. Check for Account Summary
  const hasAccountSignals = normHeaders.some(h => ['followers', 'subscribers', 'audience total', 'page views'].includes(h))
  if (hasAccountSignals) {
    return {
      detectedReportType: 'account_summary',
      confidence: 0.85,
      matchedReason: 'Detected account summary fields (followers/audience/subscribers)'
    }
  }

  return {
    detectedReportType: 'generic_metrics',
    confidence: 0.60,
    matchedReason: 'Detected generic social metrics'
  }
}
