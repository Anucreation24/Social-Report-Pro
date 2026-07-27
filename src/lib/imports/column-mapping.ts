export type NormalizedField =
  | 'audience_total'
  | 'audience_gained'
  | 'audience_lost'
  | 'reach'
  | 'impressions'
  | 'views'
  | 'engagements'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'saves'
  | 'clicks'
  | 'profile_views'
  | 'watch_time_seconds'
  | 'average_view_duration_seconds'
  | 'click_through_rate'
  | 'engagement_rate'
  | 'content_published'
  | 'date'
  | 'content_id'
  | 'title'
  | 'caption'
  | 'published_at'
  | 'content_type'
  | 'permalink'
  | 'ignore'

export interface FieldMapping {
  fileColumn: string
  mappedField: NormalizedField
  confidence: 'high' | 'medium' | 'low'
  autoMapped: boolean
}

const ALIAS_MAP: Record<NormalizedField, string[]> = {
  audience_total: ['followers', 'page followers', 'fans', 'subscribers', 'total followers', 'follower count', 'total subscribers', 'audience total'],
  audience_gained: ['followers gained', 'new followers', 'subscribers gained', 'net followers', 'gained followers'],
  audience_lost: ['followers lost', 'unfollows', 'unsubscribes', 'lost followers'],
  views: ['video views', 'views', 'post views', 'reel views', 'plays', 'total views', 'video play count', 'view count'],
  engagements: ['engagement', 'engagements', 'interactions', 'post interactions', 'total engagements', 'reactions and comments'],
  reach: ['reach', 'account reach', 'post reach', 'unique viewers', 'unique users', 'reach count'],
  impressions: ['impressions', 'post impressions', 'total impressions', 'impression count'],
  likes: ['likes', 'reactions', 'post likes', 'hearts', 'like count'],
  comments: ['comments', 'post comments', 'comment count'],
  shares: ['shares', 'reposts', 'post shares', 'retweets', 'share count'],
  saves: ['saves', 'bookmarks', 'post saves', 'save count'],
  clicks: ['clicks', 'link clicks', 'website clicks', 'url clicks'],
  profile_views: ['profile views', 'page views', 'channel views', 'account visits'],
  watch_time_seconds: ['watch time', 'watch time seconds', 'watch time (seconds)', 'watch time (mins)', 'watch time (minutes)', 'watch time minutes', 'total watch time'],
  average_view_duration_seconds: ['avg view duration', 'average view duration', 'average watch time'],
  click_through_rate: ['ctr', 'click through rate', 'click-through rate'],
  engagement_rate: ['engagement rate', 'interaction rate'],
  content_published: ['content published', 'posts published', 'videos published', 'uploads'],
  date: ['date', 'snapshot date', 'day', 'timestamp', 'period date', 'metric date'],
  content_id: ['content id', 'post id', 'video id', 'item id', 'id'],
  title: ['title', 'post title', 'video title', 'name'],
  caption: ['caption', 'message', 'post text', 'description', 'body', 'post caption'],
  published_at: ['published at', 'publish date', 'posted at', 'created at', 'created date', 'date published', 'post date'],
  content_type: ['content type', 'post type', 'media type', 'type'],
  permalink: ['permalink', 'url', 'post url', 'link', 'web link'],
  ignore: []
}

/**
  Auto-detect column mapping for an array of header strings.
 */
export function autoDetectColumnMappings(headers: string[]): FieldMapping[] {
  const assignedFields = new Set<NormalizedField>()

  return headers.map(header => {
    const cleanHeader = header.trim().toLowerCase().replace(/[^a-z0-9\s_]/g, '')
    
    // 1. Direct match with NormalizedField
    const exactField = Object.keys(ALIAS_MAP).find(
      key => key === cleanHeader
    ) as NormalizedField | undefined

    if (exactField && exactField !== 'ignore' && !assignedFields.has(exactField)) {
      assignedFields.add(exactField)
      return {
        fileColumn: header,
        mappedField: exactField,
        confidence: 'high',
        autoMapped: true
      }
    }

    // 2. Alias match
    for (const [field, aliases] of Object.entries(ALIAS_MAP)) {
      const normField = field as NormalizedField
      if (normField === 'ignore' || assignedFields.has(normField)) continue

      if (aliases.some(alias => alias === cleanHeader || cleanHeader.includes(alias))) {
        assignedFields.add(normField)
        return {
          fileColumn: header,
          mappedField: normField,
          confidence: aliases.includes(cleanHeader) ? 'high' : 'medium',
          autoMapped: true
        }
      }
    }

    // 3. Fallback unmapped
    return {
      fileColumn: header,
      mappedField: 'ignore',
      confidence: 'low',
      autoMapped: false
    }
  })
}
