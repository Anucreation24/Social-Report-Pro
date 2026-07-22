import {
  DateRange,
  NormalizedAccountMetricResult,
  NormalizedContentItem,
  NormalizedContentMetric,
  ProviderAnalyticsCapabilities
} from '@/lib/analytics/types'
import { normalizeMetricValue } from '@/lib/analytics/normalizer'

export function getFacebookAnalyticsCapabilities(): ProviderAnalyticsCapabilities {
  return {
    supportedAccountMetrics: [
      'audience_total',
      'reach',
      'impressions',
      'views',
      'engagements',
      'likes',
      'comments',
      'shares'
    ],
    supportedContentMetrics: [
      'reach',
      'impressions',
      'views',
      'engagements',
      'likes',
      'comments',
      'shares'
    ],
    maxHistoricalDays: 90,
    supportsRealtime: false
  }
}

export async function fetchFacebookAccountMetrics(
  accessToken: string,
  providerAccountId: string,
  range: DateRange
): Promise<NormalizedAccountMetricResult[]> {
  const apiVersion = process.env.META_GRAPH_API_VERSION || 'v21.0'
  const pageUrl = `https://graph.facebook.com/${apiVersion}/${providerAccountId}?fields=followers_count,fan_count&access_token=${accessToken}`

  let followersCount = 0
  try {
    const pageRes = await fetch(pageUrl)
    if (pageRes.ok) {
      const pageData = await pageRes.json()
      followersCount = pageData.followers_count || pageData.fan_count || 0
    }
  } catch (e) {
    console.warn('Failed to fetch Facebook Page followers count:', e)
  }

  // Attempt to fetch page insights (daily metrics)
  const insightsMetrics = 'page_impressions_unique,page_impressions,page_post_engagements,page_video_views'
  const insightsUrl = `https://graph.facebook.com/${apiVersion}/${providerAccountId}/insights?metric=${insightsMetrics}&period=day&since=${range.startDate}&until=${range.endDate}&access_token=${accessToken}`

  const resultsMap = new Map<string, NormalizedAccountMetricResult>()

  // Always include today's / end date point for audience_total
  const todayDateStr = range.endDate
  resultsMap.set(todayDateStr, {
    snapshotDate: todayDateStr,
    aggregationLevel: 'daily',
    metrics: [
      {
        name: 'audience_total',
        value: followersCount,
        unit: 'followers',
        providerMetricName: 'followers_count'
      }
    ]
  })

  try {
    const res = await fetch(insightsUrl)
    if (res.ok) {
      const json = await res.json()
      const dataList = json.data || []

      for (const item of dataList) {
        const metricName = item.name
        const values = item.values || []

        for (const valNode of values) {
          // end_time is in format "2026-07-20T07:00:00+0000"
          const dateStr = (valNode.end_time || '').split('T')[0]
          if (!dateStr) continue

          let entry = resultsMap.get(dateStr)
          if (!entry) {
            entry = { snapshotDate: dateStr, aggregationLevel: 'daily', metrics: [] }
            resultsMap.set(dateStr, entry)
          }

          const rawVal = normalizeMetricValue(valNode.value)

          if (metricName === 'page_impressions_unique') {
            entry.metrics.push({ name: 'reach', value: rawVal, providerMetricName: metricName })
          } else if (metricName === 'page_impressions') {
            entry.metrics.push({ name: 'impressions', value: rawVal, providerMetricName: metricName })
          } else if (metricName === 'page_post_engagements') {
            entry.metrics.push({ name: 'engagements', value: rawVal, providerMetricName: metricName })
          } else if (metricName === 'page_video_views') {
            entry.metrics.push({ name: 'views', value: rawVal, providerMetricName: metricName })
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to fetch Facebook Page insights:', err)
  }

  return Array.from(resultsMap.values())
}

export async function fetchFacebookContent(
  accessToken: string,
  providerAccountId: string,
  _range: DateRange
): Promise<NormalizedContentItem[]> {
  const apiVersion = process.env.META_GRAPH_API_VERSION || 'v21.0'
  const postsUrl = `https://graph.facebook.com/${apiVersion}/${providerAccountId}/published_posts?fields=id,message,created_time,permalink_url,full_picture,attachments{media_type}&limit=50&access_token=${accessToken}`

  try {
    const res = await fetch(postsUrl)
    if (!res.ok) return []
    const json = await res.json()
    const posts = json.data || []

    interface FacebookPost {
      id: string
      message?: string
      created_time: string
      permalink_url?: string
      full_picture?: string
      attachments?: {
        data?: Array<{ media_type?: string }>
      }
    }

    return (posts as FacebookPost[]).map(post => {
      const mediaType = post.attachments?.data?.[0]?.media_type || 'post'
      return {
        providerContentId: post.id,
        contentType: mediaType.toLowerCase(),
        title: post.message ? post.message.substring(0, 80) : 'Facebook Post',
        captionExcerpt: post.message ? post.message.substring(0, 200) : '',
        permalink: post.permalink_url || `https://facebook.com/${post.id}`,
        thumbnailUrl: post.full_picture || '',
        publishedAt: post.created_time,
        status: 'published',
        providerMetadata: { rawId: post.id }
      }
    })
  } catch (err) {
    console.warn('Failed to fetch Facebook posts:', err)
    return []
  }
}

export async function fetchFacebookContentMetrics(
  accessToken: string,
  _providerAccountId: string,
  providerContentIds: string[],
  _range: DateRange
): Promise<NormalizedContentMetric[]> {
  const apiVersion = process.env.META_GRAPH_API_VERSION || 'v21.0'
  const results: NormalizedContentMetric[] = []
  const todayStr = new Date().toISOString().split('T')[0]

  for (const postId of providerContentIds.slice(0, 20)) {
    const postMetricUrl = `https://graph.facebook.com/${apiVersion}/${postId}?fields=reactions.summary(true),comments.summary(true),shares&access_token=${accessToken}`
    try {
      const res = await fetch(postMetricUrl)
      if (res.ok) {
        const data = await res.json()
        const likes = data.reactions?.summary?.total_count || 0
        const comments = data.comments?.summary?.total_count || 0
        const shares = data.shares?.count || 0
        const totalEngagements = likes + comments + shares

        results.push({
          providerContentId: postId,
          metricDate: todayStr,
          metrics: [
            { name: 'likes', value: likes },
            { name: 'comments', value: comments },
            { name: 'shares', value: shares },
            { name: 'engagements', value: totalEngagements }
          ]
        })
      }
    } catch (e) {
      console.warn(`Failed to fetch metrics for Facebook post ${postId}:`, e)
    }
  }

  return results
}
