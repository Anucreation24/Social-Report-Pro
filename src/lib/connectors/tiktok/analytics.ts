import {
  DateRange,
  NormalizedAccountMetricResult,
  NormalizedContentItem,
  NormalizedContentMetric,
  ProviderAnalyticsCapabilities
} from '@/lib/analytics/types'

export function getTiktokAnalyticsCapabilities(): ProviderAnalyticsCapabilities {
  return {
    supportedAccountMetrics: [
      'audience_total',
      'views',
      'likes',
      'comments',
      'shares'
    ],
    supportedContentMetrics: ['views', 'likes', 'comments', 'shares'],
    maxHistoricalDays: 60,
    supportsRealtime: false
  }
}

export async function fetchTiktokAccountMetrics(
  _accessToken: string,
  _providerAccountId: string,
  _range: DateRange
): Promise<NormalizedAccountMetricResult[]> {
  // TikTok connector placeholder until real TikTok account connection is configured
  return []
}

export async function fetchTiktokContent(
  _accessToken: string,
  _providerAccountId: string,
  _range: DateRange
): Promise<NormalizedContentItem[]> {
  return []
}

export async function fetchTiktokContentMetrics(
  _accessToken: string,
  _providerAccountId: string,
  _providerContentIds: string[],
  _range: DateRange
): Promise<NormalizedContentMetric[]> {
  return []
}
