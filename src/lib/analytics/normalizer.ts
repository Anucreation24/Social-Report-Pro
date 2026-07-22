import { NormalizedMetricName } from './types'

// Facebook metric name mapping dictionary
const facebookMetricMap: Record<string, NormalizedMetricName> = {
  page_fans: 'audience_total',
  followers_count: 'audience_total',
  page_fan_adds: 'audience_gained',
  page_follows_adds: 'audience_gained',
  page_fan_removes: 'audience_lost',
  page_impressions_unique: 'reach',
  page_post_impressions_unique: 'reach',
  page_impressions: 'impressions',
  page_post_impressions: 'impressions',
  page_video_views: 'views',
  page_video_views_organic: 'views',
  page_post_engagements: 'engagements',
  page_engaged_users: 'engagements',
  reactions: 'likes',
  comments: 'comments',
  shares: 'shares',
}

// YouTube metric name mapping dictionary
const youtubeMetricMap: Record<string, NormalizedMetricName> = {
  subscriberCount: 'audience_total',
  subscribers: 'audience_total',
  subscribersGained: 'audience_gained',
  subscribersLost: 'audience_lost',
  viewCount: 'views',
  views: 'views',
  likeCount: 'likes',
  likes: 'likes',
  commentCount: 'comments',
  comments: 'comments',
  shares: 'shares',
  estimatedMinutesWatched: 'watch_time_seconds',
  averageViewDuration: 'average_view_duration_seconds',
  annotationClickThroughRate: 'click_through_rate',
}

/**
 * Maps raw provider metric name to standardized NormalizedMetricName.
 * Returns null if the provider metric is unknown or unsupported.
 */
export function normalizeProviderMetricName(
  provider: string,
  rawMetricName: string
): NormalizedMetricName | null {
  const cleanName = rawMetricName.trim()
  if (provider === 'facebook') {
    return facebookMetricMap[cleanName] || null
  }
  if (provider === 'youtube') {
    return youtubeMetricMap[cleanName] || null
  }
  return null
}

/**
 * Safely parses raw numeric metric values, returning 0 if value is undefined or NaN.
 */
export function normalizeMetricValue(val: unknown): number {
  if (val === null || val === undefined) return 0
  const num = typeof val === 'number' ? val : parseFloat(String(val))
  return isNaN(num) ? 0 : num
}

/**
 * Calculates engagement rate percentage safely.
 * Formula: (Engagements / Reach or Impressions or Views) * 100
 */
export function calculateEngagementRate(engagements: number, reachOrImpressions: number): number {
  if (!reachOrImpressions || reachOrImpressions <= 0) return 0
  const rate = (engagements / reachOrImpressions) * 100
  return parseFloat(rate.toFixed(2))
}
