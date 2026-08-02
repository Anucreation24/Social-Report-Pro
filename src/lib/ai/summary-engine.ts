import { ExecutiveSummary, GrowthAnalysisMap, PlatformScoreItem, ContentIntelligence, SummaryLength } from './types'

export function generateExecutiveSummaryAi(
  growthMap: GrowthAnalysisMap,
  platformScores: PlatformScoreItem[],
  contentIntel: ContentIntelligence,
  length: SummaryLength = 'medium'
): ExecutiveSummary {
  const currentGrowth = growthMap.last_30_days || growthMap.last_7_days

  // Find best platform
  const sortedPlatforms = [...(platformScores || [])].sort((a, b) => b.score - a.score)
  const bestPlatformObj = sortedPlatforms[0]
  const bestPlatform = bestPlatformObj ? bestPlatformObj.platform : 'Facebook'

  // Top content title
  const topPost = contentIntel.topPosts && contentIntel.topPosts.length > 0 ? contentIntel.topPosts[0] : null
  const topContentTitle = topPost ? topPost.title : 'Overview Highlight'

  const audiencePct = currentGrowth.audienceGrowth.percentageChange ?? 0
  const engagementPct = currentGrowth.engagementGrowth.percentageChange ?? 0
  const viewsPct = currentGrowth.viewGrowth.percentageChange ?? 0

  const keyHighlights: string[] = []

  // Platform specific bullet summaries
  platformScores.forEach(ps => {
    const name = ps.platform.charAt(0).toUpperCase() + ps.platform.slice(1)
    const pGrowth = ps.metricsSummary.growthPct
    if (pGrowth > 0) {
      keyHighlights.push(`${name} audience increased ${pGrowth}%.`)
    } else if (pGrowth < 0) {
      keyHighlights.push(`${name} audience decreased ${Math.abs(pGrowth)}%.`)
    } else {
      keyHighlights.push(`${name} performance remained stable.`)
    }
  })

  if (engagementPct > 0) {
    keyHighlights.push(`Overall engagement increased ${engagementPct}%.`)
  } else if (engagementPct < 0) {
    keyHighlights.push(`Overall engagement dropped ${Math.abs(engagementPct)}%.`)
  } else {
    keyHighlights.push(`Engagement remained steady across active platforms.`)
  }

  let narrative = ''

  if (length === 'short') {
    narrative = `Overall Performance: Top platform ${bestPlatform.toUpperCase()} led growth (${bestPlatformObj?.score ?? 80}/100). Total audience changed by ${audiencePct >= 0 ? '+' : ''}${audiencePct}%, while total views changed by ${viewsPct >= 0 ? '+' : ''}${viewsPct}%. Top asset: "${topContentTitle}".`
  } else if (length === 'detailed') {
    narrative = `EXECUTIVE PERFORMANCE DIRECTIVE & ANALYTICS SUMMARY:\n\n` +
      `During this reporting period, the brand demonstrated ${audiencePct >= 0 ? 'positive expansion' : 'contracting reach'} with a net audience movement of ${audiencePct >= 0 ? '+' : ''}${audiencePct}%. ` +
      `Platform evaluation scores identify ${bestPlatform.toUpperCase()} as the primary growth engine scoring ${bestPlatformObj?.score ?? 80} out of 100 based on consistency, views, and audience retention.\n\n` +
      `Engagement momentum shifted by ${engagementPct >= 0 ? '+' : ''}${engagementPct}%, driven primarily by top content item "${topContentTitle}". ` +
      `View acceleration reached ${viewsPct >= 0 ? '+' : ''}${viewsPct}%. Multi-channel breakdown shows peak posting efficacy during optimal window recommendation periods.`
  } else {
    // Medium (Default)
    narrative = `Overall Performance: ${bestPlatform.toUpperCase()} was the top-performing platform scoring ${bestPlatformObj?.score ?? 80}/100. ` +
      `Audience size shifted by ${audiencePct >= 0 ? '+' : ''}${audiencePct}% and engagement shifted by ${engagementPct >= 0 ? '+' : ''}${engagementPct}%. ` +
      `The top-performing content piece was "${topContentTitle}".`
  }

  return {
    overallNarrative: narrative,
    keyHighlights,
    bestPlatform: bestPlatform.charAt(0).toUpperCase() + bestPlatform.slice(1),
    topContentTitle,
    summaryLength: length
  }
}
