import {
  DateRange,
  NormalizedAccountMetricResult,
  NormalizedContentItem,
  NormalizedContentMetric,
  ProviderAnalyticsCapabilities,
  MetricValuePoint
} from '@/lib/analytics/types'
import { normalizeMetricValue } from '@/lib/analytics/normalizer'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface MetaGraphErrorDetail {
  message?: string
  type?: string
  code?: number
  error_subcode?: number
  fbtrace_id?: string
}

export interface MetaGraphErrorResponse {
  error?: MetaGraphErrorDetail
}

export interface PageInfoResult {
  id: string
  name: string
  followersCount: number
  fanCount: number
}

export interface FacebookPostNode {
  id: string
  message?: string
  created_time: string
  permalink_url?: string
  full_picture?: string
  attachments?: {
    data?: Array<{ media_type?: string }>
  }
}

// ============================================================================
// Deprecated & Supported Metric Mappings (Graph API v21.0+)
// ============================================================================
/**
 * Graph API Deprecation & Replacement Audit:
 * - `page_impressions_unique` (Legacy reach) -> fallback to `page_views_unique` or `page_impressions_by_story_type_unique`
 * - `page_impressions` (Legacy impressions) -> fallback to `page_views_total`
 * - `page_post_engagements` (Legacy page engagement) -> fallback to `page_actions_post_reactions_total` or sum of reactions
 * - `page_video_views` (Legacy page video views) -> fallback to `page_media_total_views`
 * - `post_video_views` (Legacy post video views) -> fallback to `post_video_views_organic` or `post_media_views`
 */

const ACCOUNT_METRIC_CANDIDATES: Array<{
  normalizedName: 'reach' | 'impressions' | 'engagements' | 'views'
  primaryMetric: string
  fallbackMetrics: string[]
}> = [
  {
    normalizedName: 'reach',
    primaryMetric: 'page_impressions_unique',
    fallbackMetrics: ['page_views_unique', 'page_daily_follows_unique']
  },
  {
    normalizedName: 'impressions',
    primaryMetric: 'page_impressions',
    fallbackMetrics: ['page_views_total']
  },
  {
    normalizedName: 'engagements',
    primaryMetric: 'page_post_engagements',
    fallbackMetrics: ['page_actions_post_reactions_total', 'page_daily_follows']
  },
  {
    normalizedName: 'views',
    primaryMetric: 'page_video_views',
    fallbackMetrics: ['page_media_total_views']
  }
]

// ============================================================================
// Utility & Retry Helpers
// ============================================================================

/**
 * Exponential backoff fetch wrapper for Meta Graph API calls.
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let attempt = 0
  let delay = 300 // ms

  while (attempt < maxRetries) {
    try {
      const res = await fetch(url, options)
      if (res.ok) return res

      // Retry on transient status codes
      if ([429, 500, 502, 503, 504].includes(res.status)) {
        attempt++
        if (attempt >= maxRetries) return res
        await new Promise(r => setTimeout(r, delay))
        delay *= 2
        continue
      }

      // Check Meta rate limit error codes (4, 17, 32, 613)
      const clone = res.clone()
      const json: MetaGraphErrorResponse = await clone.json().catch(() => ({}))
      const code = json.error?.code
      if (code && [4, 17, 32, 613].includes(code)) {
        attempt++
        if (attempt >= maxRetries) return res
        await new Promise(r => setTimeout(r, delay))
        delay *= 2
        continue
      }

      return res
    } catch (err) {
      attempt++
      if (attempt >= maxRetries) throw err
      await new Promise(r => setTimeout(r, delay))
      delay *= 2
    }
  }

  return fetch(url, options)
}

/**
 * Safely parses any insight value node (numeric, string, object).
 */
export function parseInsightMetricValue(rawVal: unknown): number {
  if (rawVal === null || rawVal === undefined) return 0
  if (typeof rawVal === 'number') return isNaN(rawVal) ? 0 : rawVal
  if (typeof rawVal === 'string') {
    const parsed = parseFloat(rawVal.replace(/,/g, ''))
    return isNaN(parsed) ? 0 : parsed
  }
  if (typeof rawVal === 'object') {
    // If val is a key-value object (e.g. { "like": 10, "love": 5 }), sum numeric properties
    let sum = 0
    Object.values(rawVal as Record<string, unknown>).forEach(v => {
      if (typeof v === 'number') sum += v
      else if (typeof v === 'string') {
        const p = parseFloat(v)
        if (!isNaN(p)) sum += p
      }
    })
    return sum
  }
  return normalizeMetricValue(rawVal)
}

/**
 * Validates Meta permission error codes and throws a descriptive reconnect error.
 */
function checkForPermissionError(
  status: number,
  errJson: MetaGraphErrorResponse,
  endpoint: string,
  providerAccountId: string,
  metricName?: string
) {
  const err = errJson?.error
  const code = err?.code
  const subcode = err?.error_subcode

  // Log structured server error
  console.error('[Facebook Graph API Error Detail]', {
    endpoint,
    providerAccountId,
    requestedMetric: metricName || 'all',
    httpStatus: status,
    metaErrorCode: code,
    metaErrorSubcode: subcode,
    metaMessage: err?.message,
    fbtraceId: err?.fbtrace_id
  })

  // Code 190 (Invalid OAuth 2.0 Access Token), 200 (Permissions error), 230 (Permissions error), 10 (Permission denied)
  if (code === 190 || code === 200 || code === 230 || code === 10 || status === 401 || status === 403) {
    let missingPerm = 'pages_read_engagement, pages_read_user_content, or read_insights'
    if (err?.message?.includes('pages_show_list')) missingPerm = 'pages_show_list'
    else if (err?.message?.includes('pages_read_engagement')) missingPerm = 'pages_read_engagement'
    else if (err?.message?.includes('pages_read_user_content')) missingPerm = 'pages_read_user_content'
    else if (err?.message?.includes('read_insights')) missingPerm = 'read_insights'

    throw new Error(
      `Reconnect required — Facebook Access Token lacks required permission (${missingPerm}). Meta message: ${err?.message || 'Access token invalid or expired.'}`
    )
  }
}

// ============================================================================
// Core Modular Helpers
// ============================================================================

/**
 * Capabilities provider registration.
 */
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

/**
 * 1. fetchPageInfo: Retrieves Page followers count and metadata.
 */
export async function fetchPageInfo(
  accessToken: string,
  pageId: string,
  apiVersion = 'v21.0'
): Promise<PageInfoResult> {
  const encToken = encodeURIComponent(accessToken)
  const pageUrl = `https://graph.facebook.com/${apiVersion}/${pageId}?fields=id,name,followers_count,fan_count&access_token=${encToken}`

  const res = await fetchWithRetry(pageUrl)
  if (!res.ok) {
    const errJson: MetaGraphErrorResponse = await res.json().catch(() => ({}))
    checkForPermissionError(res.status, errJson, `GET /${pageId}`, pageId, 'followers_count')
    return { id: pageId, name: 'Facebook Page', followersCount: 0, fanCount: 0 }
  }

  const data = await res.json()
  return {
    id: data.id || pageId,
    name: data.name || 'Facebook Page',
    followersCount: typeof data.followers_count === 'number' ? data.followers_count : (data.fanCount ?? 0),
    fanCount: typeof data.fan_count === 'number' ? data.fan_count : (data.followersCount ?? 0)
  }
}

/**
 * 2. fetchPageInsights: Safely fetches Page Insights for individual metric candidates.
 */
export async function fetchPageInsights(
  accessToken: string,
  pageId: string,
  range: DateRange,
  apiVersion = 'v21.0'
): Promise<Map<string, MetricValuePoint[]>> {
  const encToken = encodeURIComponent(accessToken)
  const metricsByDate = new Map<string, MetricValuePoint[]>()

  // Execute independent metric candidate requests concurrently
  const fetchPromises = ACCOUNT_METRIC_CANDIDATES.map(async candidate => {
    const metricsToTry = [candidate.primaryMetric, ...candidate.fallbackMetrics]

    for (const metricName of metricsToTry) {
      const insightsUrl = `https://graph.facebook.com/${apiVersion}/${pageId}/insights?metric=${metricName}&period=day&since=${range.startDate}&until=${range.endDate}&access_token=${encToken}`

      try {
        const res = await fetchWithRetry(insightsUrl)
        if (!res.ok) {
          const errJson: MetaGraphErrorResponse = await res.json().catch(() => ({}))
          // Check if it's a permission error (which should throw to trigger reconnect)
          checkForPermissionError(res.status, errJson, `GET /${pageId}/insights`, pageId, metricName)
          // Otherwise, continue to try fallback metric
          continue
        }

        const json = await res.json()
        const dataList = json.data || []
        if (!Array.isArray(dataList) || dataList.length === 0) continue

        let metricSucceeded = false

        for (const item of dataList) {
          const values = item.values || []
          if (!Array.isArray(values) || values.length === 0) continue

          for (const valNode of values) {
            const dateStr = typeof valNode.end_time === 'string' ? valNode.end_time.split('T')[0] : ''
            if (!dateStr) continue

            const val = parseInsightMetricValue(valNode.value)

            let dateEntry = metricsByDate.get(dateStr)
            if (!dateEntry) {
              dateEntry = []
              metricsByDate.set(dateStr, dateEntry)
            }

            // Deduplicate if already added
            if (!dateEntry.some(m => m.name === candidate.normalizedName)) {
              dateEntry.push({
                name: candidate.normalizedName,
                value: val,
                providerMetricName: item.name || metricName
              })
              metricSucceeded = true
            }
          }
        }

        if (metricSucceeded) break // Primary or current fallback metric succeeded, stop trying lower fallbacks
      } catch (err) {
        if (err instanceof Error && err.message.includes('Reconnect required')) {
          throw err
        }
        console.warn(`[Facebook Page Insights Warning] Metric '${metricName}' for Page ${pageId}:`, err)
      }
    }
  })

  await Promise.allSettled(fetchPromises)
  return metricsByDate
}

/**
 * 3. fetchPosts: Retrieves published posts for a Page.
 */
export async function fetchPosts(
  accessToken: string,
  pageId: string,
  apiVersion = 'v21.0'
): Promise<FacebookPostNode[]> {
  const encToken = encodeURIComponent(accessToken)
  const postsUrl = `https://graph.facebook.com/${apiVersion}/${pageId}/published_posts?fields=id,message,created_time,permalink_url,full_picture,attachments{media_type}&limit=50&access_token=${encToken}`

  try {
    const res = await fetchWithRetry(postsUrl)
    if (!res.ok) {
      const errJson: MetaGraphErrorResponse = await res.json().catch(() => ({}))
      checkForPermissionError(res.status, errJson, `GET /${pageId}/published_posts`, pageId, 'published_posts')
      return []
    }

    const json = await res.json()
    return (json.data || []) as FacebookPostNode[]
  } catch (err) {
    if (err instanceof Error && err.message.includes('Reconnect required')) throw err
    console.warn(`[Facebook fetchPosts Warning] Page ${pageId}:`, err)
    return []
  }
}

/**
 * 4. fetchPostInsights: Retrieves reactions, comments, shares, and post insights per post.
 */
export async function fetchPostInsights(
  accessToken: string,
  postId: string,
  apiVersion = 'v21.0'
): Promise<{ likes: number; comments: number; shares: number; impressions: number; reach: number; views: number }> {
  const encToken = encodeURIComponent(accessToken)

  let likes = 0
  let comments = 0
  let shares = 0
  let impressions = 0
  let reach = 0
  let views = 0

  // 4a. Object fields for direct engagement (100% reliable)
  const postMetricUrl = `https://graph.facebook.com/${apiVersion}/${postId}?fields=reactions.summary(true),comments.summary(true),shares&access_token=${encToken}`

  try {
    const res = await fetchWithRetry(postMetricUrl)
    if (res.ok) {
      const data = await res.json()
      likes = parseInsightMetricValue(data.reactions?.summary?.total_count)
      comments = parseInsightMetricValue(data.comments?.summary?.total_count)
      shares = parseInsightMetricValue(data.shares?.count)
    }
  } catch (e) {
    console.warn(`[Facebook post metrics warning] ${postId}:`, e)
  }

  // 4b. Post Insights Metrics (requested gracefully)
  const postMetricCandidates: Array<{
    key: 'impressions' | 'reach' | 'views'
    candidates: string[]
  }> = [
    { key: 'impressions', candidates: ['post_impressions', 'post_media_views'] },
    { key: 'reach', candidates: ['post_impressions_unique', 'post_impressions_by_story_type_unique'] },
    { key: 'views', candidates: ['post_video_views', 'post_video_views_organic', 'post_media_views'] }
  ]

  for (const candidateGroup of postMetricCandidates) {
    for (const metricName of candidateGroup.candidates) {
      const insightsUrl = `https://graph.facebook.com/${apiVersion}/${postId}/insights?metric=${metricName}&access_token=${encToken}`
      try {
        const insightsRes = await fetchWithRetry(insightsUrl)
        if (insightsRes.ok) {
          const insightsJson = await insightsRes.json()
          const dataList = insightsJson.data || []
          if (Array.isArray(dataList) && dataList.length > 0) {
            const val = parseInsightMetricValue(dataList[0]?.values?.[0]?.value)
            if (val > 0) {
              if (candidateGroup.key === 'impressions') impressions = val
              else if (candidateGroup.key === 'reach') reach = val
              else if (candidateGroup.key === 'views') views = val
              break
            }
          }
        }
      } catch {
        // Silently skip non-applicable metrics (e.g. video views on text posts)
      }
    }
  }

  return { likes, comments, shares, impressions, reach, views }
}

/**
 * 5. mergeMetrics: Combines page info audience count and page insights metrics into normalized results.
 */
export function mergeMetrics(
  pageInfo: PageInfoResult,
  insightsMap: Map<string, MetricValuePoint[]>,
  endDate: string
): NormalizedAccountMetricResult[] {
  const resultsMap = new Map<string, NormalizedAccountMetricResult>()

  // Populate from insightsMap
  insightsMap.forEach((metrics, dateStr) => {
    resultsMap.set(dateStr, {
      snapshotDate: dateStr,
      aggregationLevel: 'daily',
      metrics: [...metrics]
    })
  })

  // Ensure end date point exists with audience_total
  let endEntry = resultsMap.get(endDate)
  if (!endEntry) {
    endEntry = { snapshotDate: endDate, aggregationLevel: 'daily', metrics: [] }
    resultsMap.set(endDate, endEntry)
  }

  if (!endEntry.metrics.some(m => m.name === 'audience_total')) {
    endEntry.metrics.push({
      name: 'audience_total',
      value: pageInfo.followersCount || pageInfo.fanCount || 0,
      unit: 'followers',
      providerMetricName: 'followers_count'
    })
  }

  return Array.from(resultsMap.values()).sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate))
}

// ============================================================================
// Main Public Export Interfaces
// ============================================================================

/**
 * Fetches normalized Facebook Page account metrics over a given DateRange.
 */
export async function fetchFacebookAccountMetrics(
  accessToken: string,
  providerAccountId: string,
  range: DateRange,
  providerMetadata?: Record<string, unknown>
): Promise<NormalizedAccountMetricResult[]> {
  const apiVersion = process.env.META_GRAPH_API_VERSION || 'v21.0'
  const tokenToUse = (providerMetadata?.pageAccessToken as string) || accessToken

  if (!tokenToUse) {
    throw new Error('Reconnect required — missing Page Access Token for Facebook integration.')
  }

  // Concurrently fetch Page metadata and Page insights
  const [pageInfoRes, insightsMapRes] = await Promise.allSettled([
    fetchPageInfo(tokenToUse, providerAccountId, apiVersion),
    fetchPageInsights(tokenToUse, providerAccountId, range, apiVersion)
  ])

  let pageInfo: PageInfoResult = { id: providerAccountId, name: 'Facebook Page', followersCount: 0, fanCount: 0 }
  if (pageInfoRes.status === 'fulfilled') {
    pageInfo = pageInfoRes.value
  } else if (pageInfoRes.reason instanceof Error && pageInfoRes.reason.message.includes('Reconnect required')) {
    throw pageInfoRes.reason
  }

  let insightsMap = new Map<string, MetricValuePoint[]>()
  if (insightsMapRes.status === 'fulfilled') {
    insightsMap = insightsMapRes.value
  } else if (insightsMapRes.reason instanceof Error && insightsMapRes.reason.message.includes('Reconnect required')) {
    throw insightsMapRes.reason
  }

  return mergeMetrics(pageInfo, insightsMap, range.endDate)
}

/**
 * Fetches published content items for a Facebook Page.
 */
export async function fetchFacebookContent(
  accessToken: string,
  providerAccountId: string,
  _range: DateRange,
  providerMetadata?: Record<string, unknown>
): Promise<NormalizedContentItem[]> {
  const apiVersion = process.env.META_GRAPH_API_VERSION || 'v21.0'
  const tokenToUse = (providerMetadata?.pageAccessToken as string) || accessToken

  const posts = await fetchPosts(tokenToUse, providerAccountId, apiVersion)

  return posts.map(post => {
    const mediaType = post.attachments?.data?.[0]?.media_type || 'post'
    return {
      providerContentId: post.id,
      contentType: mediaType.toLowerCase(),
      title: post.message ? post.message.substring(0, 80) : 'Facebook Post',
      captionExcerpt: post.message ? post.message.substring(0, 200) : '',
      permalink: post.permalink_url || `https://facebook.com/${post.id}`,
      thumbnailUrl: post.full_picture || '',
      publishedAt: post.created_time || new Date().toISOString(),
      status: 'published',
      providerMetadata: { rawId: post.id }
    }
  })
}

/**
 * Fetches content metrics for Facebook posts concurrently.
 */
export async function fetchFacebookContentMetrics(
  accessToken: string,
  _providerAccountId: string,
  providerContentIds: string[],
  _range: DateRange,
  providerMetadata?: Record<string, unknown>
): Promise<NormalizedContentMetric[]> {
  const apiVersion = process.env.META_GRAPH_API_VERSION || 'v21.0'
  const tokenToUse = (providerMetadata?.pageAccessToken as string) || accessToken
  const todayStr = new Date().toISOString().split('T')[0]

  const idsToProcess = (providerContentIds || []).slice(0, 25)

  // Fetch post insights concurrently in parallel batches
  const promises = idsToProcess.map(async postId => {
    try {
      const ins = await fetchPostInsights(tokenToUse, postId, apiVersion)
      const engagements = ins.likes + ins.comments + ins.shares

      const metricsList: Array<{ name: NormalizedContentMetric['metrics'][number]['name']; value: number; providerMetricName?: string }> = [
        { name: 'likes', value: ins.likes, providerMetricName: 'reactions' },
        { name: 'comments', value: ins.comments, providerMetricName: 'comments' },
        { name: 'shares', value: ins.shares, providerMetricName: 'shares' },
        { name: 'engagements', value: engagements, providerMetricName: 'page_post_engagements' }
      ]

      if (ins.impressions > 0) {
        metricsList.push({ name: 'impressions', value: ins.impressions, providerMetricName: 'post_impressions' })
      }
      if (ins.reach > 0) {
        metricsList.push({ name: 'reach', value: ins.reach, providerMetricName: 'post_impressions_unique' })
      }
      if (ins.views > 0) {
        metricsList.push({ name: 'views', value: ins.views, providerMetricName: 'post_video_views' })
      }

      return {
        providerContentId: postId,
        metricDate: todayStr,
        metrics: metricsList
      }
    } catch (e) {
      console.warn(`[Facebook Content Metrics Warning] ${postId}:`, e)
      return null
    }
  })

  const results = await Promise.allSettled(promises)
  const validMetrics: NormalizedContentMetric[] = []

  results.forEach(res => {
    if (res.status === 'fulfilled' && res.value) {
      validMetrics.push(res.value)
    }
  })

  return validMetrics
}
