import {
  DateRange,
  NormalizedAccountMetricResult,
  NormalizedContentItem,
  NormalizedContentMetric,
  ProviderAnalyticsCapabilities
} from '@/lib/analytics/types'

export function getInstagramAnalyticsCapabilities(): ProviderAnalyticsCapabilities {
  return {
    supportedAccountMetrics: [
      'audience_total',
      'reach',
      'impressions',
      'views',
      'engagements',
      'likes',
      'comments',
      'saves'
    ],
    supportedContentMetrics: ['reach', 'impressions', 'likes', 'comments', 'saves'],
    maxHistoricalDays: 30,
    supportsRealtime: false
  }
}

export async function fetchInstagramAccountMetrics(
  _accessToken: string,
  _providerAccountId: string,
  _range: DateRange
): Promise<NormalizedAccountMetricResult[]> {
  // Instagram connector placeholder until real Instagram account connection is configured
  return []
}

export async function fetchInstagramContent(
  _accessToken: string,
  _providerAccountId: string,
  _range: DateRange
): Promise<NormalizedContentItem[]> {
  return []
}

export async function fetchInstagramContentMetrics(
  _accessToken: string,
  _providerAccountId: string,
  _providerContentIds: string[],
  _range: DateRange
): Promise<NormalizedContentMetric[]> {
  return []
}
