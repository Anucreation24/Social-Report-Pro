import { ExecutiveSummaryStatement, GeneratedReportSnapshot } from './types'

/**
 * Generates deterministic, data-backed executive summary statements for a report snapshot.
 * No AI API calls are used — statements are compiled directly from empirical metrics.
 */
export function generateExecutiveSummary(
  snapshot: Partial<GeneratedReportSnapshot>
): ExecutiveSummaryStatement[] {
  const statements: ExecutiveSummaryStatement[] = []

  const overall = snapshot.overall
  const platforms = snapshot.platforms || {}
  const topContent = snapshot.topContent || []

  if (!overall) return statements

  // 1. Audience Summary Statement
  if (overall.audienceTotal && !overall.audienceTotal.isUnavailable) {
    const totalAudience = overall.audienceTotal.currentValue
    const changePct = overall.audienceTotal.percentageChange
    const isPos = overall.audienceTotal.isPositive

    let changeText = 'compared to the previous period'
    if (changePct !== null && !overall.audienceTotal.isUnavailable) {
      changeText = `${isPos ? '+' : ''}${changePct}% vs. previous period`
    }

    statements.push({
      id: 'exec-audience',
      type: isPos ? 'positive' : 'neutral',
      statement: `Total Audience across connected channels stands at ${totalAudience.toLocaleString()} followers/subscribers (${changeText}).`,
      supportingData: `Audience Total: ${totalAudience.toLocaleString()}`
    })
  }

  // 2. Platform Highlights
  let highestViewsPlatform = ''
  let highestViewsCount = 0
  let highestEngagementPlatform = ''
  let highestEngagementCount = 0

  for (const [pName, pData] of Object.entries(platforms)) {
    if (!pData || !pData.isConnected) continue
    const vCount = pData.metrics.views.currentValue
    const eCount = pData.metrics.engagements.currentValue

    if (vCount > highestViewsCount) {
      highestViewsCount = vCount
      highestViewsPlatform = pName
    }
    if (eCount > highestEngagementCount) {
      highestEngagementCount = eCount
      highestEngagementPlatform = pName
    }
  }

  if (highestEngagementPlatform && highestEngagementCount > 0) {
    const pCapitalized = highestEngagementPlatform.charAt(0).toUpperCase() + highestEngagementPlatform.slice(1)
    statements.push({
      id: 'exec-top-engagement',
      type: 'positive',
      statement: `${pCapitalized} generated the highest audience engagement with ${highestEngagementCount.toLocaleString()} total interactions during this reporting period.`,
      supportingData: `${pCapitalized} Engagements: ${highestEngagementCount.toLocaleString()}`
    })
  }

  if (highestViewsPlatform && highestViewsCount > 0) {
    const pCapitalized = highestViewsPlatform.charAt(0).toUpperCase() + highestViewsPlatform.slice(1)
    statements.push({
      id: 'exec-top-views',
      type: 'positive',
      statement: `${pCapitalized} contributed the highest video/content views totaling ${highestViewsCount.toLocaleString()} views.`,
      supportingData: `${pCapitalized} Views: ${highestViewsCount.toLocaleString()}`
    })
  }

  // 3. Content Publishing Activity
  const pubCount = overall.contentPublished.currentValue
  if (pubCount > 0) {
    statements.push({
      id: 'exec-content-published',
      type: 'neutral',
      statement: `A total of ${pubCount} content items were published across active platforms during the reporting period.`,
      supportingData: `Published Content: ${pubCount}`
    })
  } else {
    statements.push({
      id: 'exec-no-content',
      type: 'attention',
      statement: 'No new posts or videos were published during the selected reporting period.',
      supportingData: 'Published Content: 0'
    })
  }

  // 4. Data Availability / Limitation Notes
  if (platforms.facebook?.isConnected) {
    if (platforms.facebook.metrics.impressions.isUnavailable) {
      statements.push({
        id: 'exec-facebook-limitation',
        type: 'limitation',
        statement: 'Facebook Impressions and Reach are currently unavailable due to Meta Graph API permission restrictions.',
        supportingData: 'Meta Permission Notice'
      })
    }
  }

  if (platforms.instagram && !platforms.instagram.isConnected) {
    statements.push({
      id: 'exec-instagram-unconnected',
      type: 'limitation',
      statement: 'Instagram Professional account is not connected for this company.',
      supportingData: 'Instagram Status: Not Connected'
    })
  }

  // 5. Top Content Highlight
  if (topContent.length > 0) {
    const topPost = topContent[0]
    statements.push({
      id: 'exec-top-content',
      type: 'positive',
      statement: `Top performing content: "${topPost.title}" on ${topPost.platform.toUpperCase()} with ${topPost.engagements.toLocaleString()} engagements.`,
      supportingData: `${topPost.platform.toUpperCase()} Content ID: ${topPost.providerContentId}`
    })
  }

  return statements
}
