export type DetectedReportType = 'account_summary' | 'content_performance'

export interface ReportTypeDetectionResult {
  detectedReportType: DetectedReportType
  confidence: number
  matchedReason: string
}

/**
 * Automatically detects whether a file represents an account_summary or content_performance report.
 */
export function detectReportTypeFromHeaders(headers: string[]): ReportTypeDetectionResult {
  const normHeaders = headers.map(h => h.toLowerCase().trim().replace(/_/g, ' '))

  const contentSignals = ['title', 'content id', 'post id', 'video title', 'caption', 'permalink', 'url', 'published at', 'post link']
  const accountSignals = ['followers', 'subscribers', 'audience total', 'page views', 'profile views', 'followers gained', 'followers lost']

  let contentScore = 0
  let accountScore = 0

  normHeaders.forEach(h => {
    if (contentSignals.some(s => h.includes(s))) contentScore += 1
    if (accountSignals.some(s => h.includes(s))) accountScore += 1
  })

  if (contentScore > accountScore) {
    return {
      detectedReportType: 'content_performance',
      confidence: 0.90,
      matchedReason: `Detected content fields (${contentScore} matches: title/caption/post_id)`
    }
  } else if (accountScore > 0) {
    return {
      detectedReportType: 'account_summary',
      confidence: 0.88,
      matchedReason: `Detected account fields (${accountScore} matches: followers/audience/profile_views)`
    }
  }

  return {
    detectedReportType: 'account_summary',
    confidence: 0.60,
    matchedReason: 'Defaulted to Account Summary'
  }
}
