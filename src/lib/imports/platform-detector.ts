export type PlatformSignal = 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'generic'

export interface PlatformDetectionResult {
  detectedPlatform: PlatformSignal
  confidence: number // 0.0 to 1.0
  matchedSignals: string[]
  conflictingSignals: string[]
  requiresConfirmation: boolean
}

const PLATFORM_SIGNALS: Record<PlatformSignal, string[]> = {
  facebook: [
    'page followers', 'page reach', 'page impressions', 'meta business suite',
    'facebook', 'post engagements', 'page likes', 'facebook page', 'post reach',
    'page_impressions_unique', 'page_fans'
  ],
  instagram: [
    'accounts engaged', 'accounts reached', 'reels interactions', 'instagram',
    'profile activity', 'story views', 'ig_reach', 'instagram_followers',
    'profile_visits', 'reels_views'
  ],
  youtube: [
    'subscribers', 'watch time (hours)', 'average view duration', 'impressions click-through rate',
    'youtube studio', 'youtube', 'watch_time_hours', 'channel_subscribers',
    'views_by_video', 'estimated_minutes_watched'
  ],
  tiktok: [
    'video views', 'total viewers', 'watched full video', 'tiktok studio',
    'tiktok', 'profile views', 'sound_used', 'video_completion_rate'
  ],
  generic: ['date', 'followers', 'views', 'reach', 'impressions', 'engagements']
}

/**
 * Detects platform automatically from file headers, sheet names, and file title using deterministic signal matching heuristics.
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

  // Evaluate matching signals
  (Object.keys(PLATFORM_SIGNALS) as PlatformSignal[]).forEach(platform => {
    if (platform === 'generic') return
    const signals = PLATFORM_SIGNALS[platform]
    signals.forEach(sig => {
      if (normalizedText.includes(sig)) {
        scores[platform].score += 1
        scores[platform].matches.push(sig)
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

  // Calculate confidence score (0.0 to 1.0)
  let confidence = 0
  if (highestScore >= 3) {
    confidence = 0.95
  } else if (highestScore === 2) {
    confidence = 0.85
  } else if (highestScore === 1) {
    confidence = 0.65
  } else {
    confidence = 0.20
    topPlatform = 'generic'
  }

  const conflicting: string[] = []
  Object.entries(scores).forEach(([plat, data]) => {
    if (plat !== topPlatform && data.score >= 1 && plat !== 'generic') {
      conflicting.push(plat)
    }
  })

  const requiresConfirmation = confidence < 0.75 || conflicting.length > 0 || topPlatform === 'generic'

  return {
    detectedPlatform: topPlatform,
    confidence,
    matchedSignals: scores[topPlatform]?.matches || [],
    conflictingSignals: conflicting,
    requiresConfirmation
  }
}
