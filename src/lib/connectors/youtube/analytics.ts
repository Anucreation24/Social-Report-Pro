import {
  DateRange,
  NormalizedAccountMetricResult,
  NormalizedContentItem,
  NormalizedContentMetric,
  ProviderAnalyticsCapabilities
} from '@/lib/analytics/types'
import { normalizeMetricValue } from '@/lib/analytics/normalizer'

export function getYoutubeAnalyticsCapabilities(): ProviderAnalyticsCapabilities {
  return {
    supportedAccountMetrics: [
      'audience_total',
      'audience_gained',
      'audience_lost',
      'views',
      'watch_time_seconds',
      'average_view_duration_seconds',
      'likes',
      'comments',
      'shares'
    ],
    supportedContentMetrics: ['views', 'likes', 'comments', 'shares'],
    maxHistoricalDays: 365,
    supportsRealtime: true
  }
}

export async function fetchYoutubeAccountMetrics(
  accessToken: string,
  providerAccountId: string,
  range: DateRange
): Promise<NormalizedAccountMetricResult[]> {
  const resultsMap = new Map<string, NormalizedAccountMetricResult>()
  const todayDateStr = range.endDate

  // 1. Fetch channel total subscriber & view statistics from YouTube Data API
  let totalSubscribers = 0
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${providerAccountId}`
  try {
    const channelRes = await fetch(channelUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    if (channelRes.ok) {
      const channelData = await channelRes.json()
      const stats = channelData.items?.[0]?.statistics
      if (stats) {
        totalSubscribers = parseInt(stats.subscriberCount || '0', 10)
      }
    }
  } catch (err) {
    console.warn('Failed to fetch YouTube channel statistics:', err)
  }

  // Always include today's subscriber count
  resultsMap.set(todayDateStr, {
    snapshotDate: todayDateStr,
    aggregationLevel: 'daily',
    metrics: [
      {
        name: 'audience_total',
        value: totalSubscribers,
        unit: 'subscribers',
        providerMetricName: 'subscriberCount'
      }
    ]
  })

  // 2. Fetch daily report metrics from YouTube Analytics API
  const analyticsUrl = `https://youtubeanalytics.googleapis.com/v1/reports?ids=channel==MINE&startDate=${range.startDate}&endDate=${range.endDate}&metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,comments,shares&dimensions=day`

  try {
    const analyticsRes = await fetch(analyticsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (analyticsRes.ok) {
      const json = await analyticsRes.json()
      const columnHeaders = (json.columnHeaders || []).map((h: { name: string }) => h.name)
      const rows = json.rows || []

      for (const row of rows) {
        const dayIdx = columnHeaders.indexOf('day')
        if (dayIdx === -1) continue
        const dateStr = row[dayIdx]

        let entry = resultsMap.get(dateStr)
        if (!entry) {
          entry = { snapshotDate: dateStr, aggregationLevel: 'daily', metrics: [] }
          resultsMap.set(dateStr, entry)
        }

        columnHeaders.forEach((colName: string, idx: number) => {
          if (colName === 'day') return
          const rawVal = normalizeMetricValue(row[idx])

          if (colName === 'views') {
            entry.metrics.push({ name: 'views', value: rawVal, providerMetricName: colName })
          } else if (colName === 'estimatedMinutesWatched') {
            entry.metrics.push({ name: 'watch_time_seconds', value: rawVal * 60, unit: 'seconds', providerMetricName: colName })
          } else if (colName === 'averageViewDuration') {
            entry.metrics.push({ name: 'average_view_duration_seconds', value: rawVal, unit: 'seconds', providerMetricName: colName })
          } else if (colName === 'subscribersGained') {
            entry.metrics.push({ name: 'audience_gained', value: rawVal, providerMetricName: colName })
          } else if (colName === 'subscribersLost') {
            entry.metrics.push({ name: 'audience_lost', value: rawVal, providerMetricName: colName })
          } else if (colName === 'likes') {
            entry.metrics.push({ name: 'likes', value: rawVal, providerMetricName: colName })
          } else if (colName === 'comments') {
            entry.metrics.push({ name: 'comments', value: rawVal, providerMetricName: colName })
          } else if (colName === 'shares') {
            entry.metrics.push({ name: 'shares', value: rawVal, providerMetricName: colName })
          }
        })
      }
    }
  } catch (err) {
    console.warn('Failed to fetch YouTube Analytics API report:', err)
  }

  return Array.from(resultsMap.values())
}

export async function fetchYoutubeContent(
  accessToken: string,
  providerAccountId: string,
  _range: DateRange
): Promise<NormalizedContentItem[]> {
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${providerAccountId}&order=date&type=video&maxResults=50`

  try {
    const res = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    if (!res.ok) return []

    const data = await res.json()
    interface YoutubeSearchItem {
      id: { videoId?: string }
      snippet: {
        title: string
        description?: string
        publishedAt: string
        thumbnails?: { high?: { url?: string }; default?: { url?: string } }
      }
    }

    const items = (data.items || []) as YoutubeSearchItem[]

    return items
      .filter(item => item.id?.videoId)
      .map(item => ({
        providerContentId: item.id.videoId!,
        contentType: 'video',
        title: item.snippet.title || 'YouTube Video',
        captionExcerpt: item.snippet.description ? item.snippet.description.substring(0, 200) : '',
        permalink: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
        publishedAt: item.snippet.publishedAt,
        status: 'published',
        providerMetadata: { videoId: item.id.videoId }
      }))
  } catch (err) {
    console.warn('Failed to fetch YouTube channel videos:', err)
    return []
  }
}

export async function fetchYoutubeContentMetrics(
  accessToken: string,
  _providerAccountId: string,
  providerContentIds: string[],
  _range: DateRange
): Promise<NormalizedContentMetric[]> {
  if (providerContentIds.length === 0) return []
  const todayStr = new Date().toISOString().split('T')[0]

  const idsParam = providerContentIds.slice(0, 50).join(',')
  const videoStatsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${idsParam}`

  try {
    const res = await fetch(videoStatsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    if (!res.ok) return []

    const data = await res.json()
    interface YoutubeVideoItem {
      id: string
      statistics?: {
        viewCount?: string
        likeCount?: string
        commentCount?: string
      }
    }

    const items = (data.items || []) as YoutubeVideoItem[]

    return items.map(item => {
      const views = parseInt(item.statistics?.viewCount || '0', 10)
      const likes = parseInt(item.statistics?.likeCount || '0', 10)
      const comments = parseInt(item.statistics?.commentCount || '0', 10)

      return {
        providerContentId: item.id,
        metricDate: todayStr,
        metrics: [
          { name: 'views', value: views },
          { name: 'likes', value: likes },
          { name: 'comments', value: comments },
          { name: 'engagements', value: likes + comments }
        ]
      }
    })
  } catch (err) {
    console.warn('Failed to fetch YouTube content metrics:', err)
    return []
  }
}
