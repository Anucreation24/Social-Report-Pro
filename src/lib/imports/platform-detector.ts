export type PlatformSignal = 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'generic'

export interface PlatformDetectionResult {
  detectedPlatform: PlatformSignal
  confidence: number // 0.0 to 1.0
  confidenceLevel: 'high' | 'medium' | 'low'
  matchedSignals: string[]
  conflictingSignals: string[]
  requiresConfirmation: boolean
}

interface SignalDefinition {
  signal: string
  weight: number // 3 = high, 1 = medium
}

const PLATFORM_WEIGHTED_SIGNALS: Record<PlatformSignal, SignalDefinition[]> = {
  facebook: [
    { signal: 'page followers', weight: 3 },
    { signal: 'page reach', weight: 3 },
    { signal: 'page impressions', weight: 3 },
    { signal: 'meta business suite', weight: 3 },
    { signal: 'facebook page', weight: 3 },
    { signal: 'page_impressions_unique', weight: 3 },
    { signal: 'page_fans', weight: 3 },
    { signal: 'facebook', weight: 3 },
    { signal: 'post reach', weight: 2 },
    { signal: 'post engagements', weight: 1 },
    { signal: 'page likes', weight: 1 }
  ],
  instagram: [
    { signal: 'reels interactions', weight: 3 },
    { signal: 'ig_reach', weight: 3 },
    { signal: 'instagram_followers', weight: 3 },
    { signal: 'reels_views', weight: 3 },
    { signal: 'accounts engaged', weight: 3 },
    { signal: 'accounts reached', weight: 3 },
    { signal: 'story views', weight: 3 },
    { signal: 'instagram', weight: 3 },
    { signal: 'profile_visits', weight: 2 }
  ],
  youtube: [
    { signal: 'subscribers', weight: 3 },
    { signal: 'watch time (hours)', weight: 3 },
    { signal: 'average view duration', weight: 3 },
    { signal: 'impressions click-through rate', weight: 3 },
    { signal: 'youtube studio', weight: 3 },
    { signal: 'youtube', weight: 3 },
    { signal: 'watch_time_hours', weight: 3 },
    { signal: 'channel_subscribers', weight: 3 },
    { signal: 'views_by_video', weight: 3 },
    { signal: 'estimated_minutes_watched', weight: 3 }
  ],
  tiktok: [
    // High-weight TikTok signals (3 pts each)
    { signal: 'video views', weight: 3 },
    { signal: 'profile views', weight: 3 },
    { signal: 'watched full video', weight: 3 },
    { signal: 'total viewers', weight: 3 },
    { signal: 'tiktok studio', weight: 3 },
    { signal: 'tiktok', weight: 3 },
    { signal: 'sound_used', weight: 3 },
    { signal: 'video_completion_rate', weight: 3 },
    // Medium-weight signals (1 pt each)
    { signal: 'likes', weight: 1 },
    { signal: 'comments', weight: 1 },
    { signal: 'shares', weight: 1 },
    { signal: 'overview', weight: 1 }
  ],
  generic: [
    { signal: 'date', weight: 1 },
    { signal: 'followers', weight: 1 },
    { signal: 'views', weight: 1 },
    { signal: 'reach', weight: 1 },
    { signal: 'impressions', weight: 1 },
    { signal: 'engagements', weight: 1 }
  ]
}

/**
 * Detects platform automatically from file headers, sheet names, and file title using weighted signal matching heuristics.
 */
export function detectPlatformFromSignals(
  headers: string[],
  fileName = '',
  sheetName = ''
): PlatformDetectionResult {
  const normalizedText = [
    fileName.toLowerCase(),
    sheetName.toLowerCase(),
    ...headers.map(h => h.toLowerCase().replace(/_/g, ' '))
  ].join(' ')

  const scores: Record<PlatformSignal, { score: number; matches: string[] }> = {
    facebook: { score: 0, matches: [] },
    instagram: { score: 0, matches: [] },
    youtube: { score: 0, matches: [] },
    tiktok: { score: 0, matches: [] },
    generic: { score: 0, matches: [] }
  };

  // Evaluate weighted matching signals
  (Object.keys(PLATFORM_WEIGHTED_SIGNALS) as PlatformSignal[]).forEach(platform => {
    if (platform === 'generic') return
    const signals = PLATFORM_WEIGHTED_SIGNALS[platform]
    signals.forEach(({ signal, weight }) => {
      // Check if signal matches in header list or normalized file context
      const isHeaderMatch = headers.some(h => h.toLowerCase().trim() === signal || h.toLowerCase().replace(/_/g, ' ').trim() === signal)
      const isTextMatch = normalizedText.includes(signal)

      if (isHeaderMatch || isTextMatch) {
        // Prevent duplicate scoring for same signal
        if (!scores[platform].matches.includes(signal)) {
          scores[platform].score += weight
          scores[platform].matches.push(signal)
        }
      }
    })
  })

  // Find top scoring platform
  let topPlatform: PlatformSignal = 'generic'
  let highestScore = 0

  Object.entries(scores).forEach(([plat, data]) => {
    if (plat !== 'generic' && data.score > highestScore) {
      highestScore = data.score
      topPlatform = plat as PlatformSignal
    }
  })

  // Determine confidence & level
  let confidence = 0
  let confidenceLevel: 'high' | 'medium' | 'low' = 'low'

  if (highestScore >= 5) {
    confidence = 0.95
    confidenceLevel = 'high'
  } else if (highestScore >= 3) {
    confidence = 0.85
    confidenceLevel = 'high'
  } else if (highestScore >= 2) {
    confidence = 0.65
    confidenceLevel = 'medium'
  } else if (highestScore >= 1) {
    confidence = 0.40
    confidenceLevel = 'low'
  } else {
    confidence = 0.20
    confidenceLevel = 'low'
    topPlatform = 'generic'
  }

  const conflicting: string[] = []
  Object.entries(scores).forEach(([plat, data]) => {
    if (plat !== topPlatform && data.score >= 3 && plat !== 'generic') {
      conflicting.push(plat)
    }
  })

  const requiresConfirmation = confidence < 0.75 || conflicting.length > 0 || topPlatform === 'generic'

  return {
    detectedPlatform: topPlatform,
    confidence,
    confidenceLevel,
    matchedSignals: scores[topPlatform]?.matches || [],
    conflictingSignals: conflicting,
    requiresConfirmation
  }
}
