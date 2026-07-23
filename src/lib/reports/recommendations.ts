import { GeneratedReportSnapshot, ReportRecommendation } from './types'

/**
 * Generates deterministic marketing recommendations based on empirical analytics.
 */
export function generateRecommendations(
  snapshot: Partial<GeneratedReportSnapshot>
): ReportRecommendation[] {
  const recommendations: ReportRecommendation[] = []

  const overall = snapshot.overall
  const platforms = snapshot.platforms || {}
  const goals = snapshot.goals || []

  if (!overall) return recommendations

  // 1. Publishing Consistency Recommendation
  const contentPublished = overall.contentPublished.currentValue
  const prevContentPublished = overall.contentPublished.previousValue
  if (prevContentPublished !== null && contentPublished < prevContentPublished) {
    recommendations.push({
      id: 'rec-publishing-frequency',
      priority: 'high',
      title: 'Increase Content Publishing Consistency',
      recommendation: `Publishing output decreased from ${prevContentPublished} items in the previous period to ${contentPublished} items. Establish a regular posting cadence to maintain algorithm momentum.`,
      supportingData: `Content Output: ${contentPublished} vs ${prevContentPublished} prev`
    })
  }

  // 2. Video vs Engagement Ratio
  if (overall.views.currentValue > 1000 && overall.engagements.currentValue < overall.views.currentValue * 0.02) {
    recommendations.push({
      id: 'rec-call-to-action',
      priority: 'medium',
      title: 'Include Stronger Calls to Action in Video Content',
      recommendation: `Video view counts are strong (${overall.views.currentValue.toLocaleString()}), but engagement rate is below 2%. Add explicit prompts encouraging viewers to comment, share, or like.`,
      supportingData: `Views: ${overall.views.currentValue.toLocaleString()}, Engagements: ${overall.engagements.currentValue.toLocaleString()}`
    })
  }

  // 3. Facebook Permission Review
  if (platforms.facebook?.isConnected && platforms.facebook.metrics.impressions.isUnavailable) {
    recommendations.push({
      id: 'rec-meta-permissions',
      priority: 'medium',
      title: 'Review Facebook Page Access Token Permissions',
      recommendation: 'Re-authenticate your Facebook Page connection to grant read_insights scope, unlocking Page Impressions and Reach metrics.',
      supportingData: 'Facebook Impressions: Permission Restricted'
    })
  }

  // 4. Unconnected Platform Recommendation
  if (platforms.instagram && !platforms.instagram.isConnected) {
    recommendations.push({
      id: 'rec-connect-instagram',
      priority: 'low',
      title: 'Connect Instagram Professional Account',
      recommendation: 'Connect your company Instagram Professional account in Platform Connections to consolidate visual content reporting into single-dashboard view.',
      supportingData: 'Instagram Connection: Inactive'
    })
  }

  // 5. Goal Target Behind Schedule
  const missedGoals = goals.filter(g => g.status === 'in_progress' && g.progressPercentage < 50)
  if (missedGoals.length > 0) {
    const targetGoal = missedGoals[0]
    recommendations.push({
      id: 'rec-goal-acceleration',
      priority: 'high',
      title: `Accelerate Progress Toward ${targetGoal.metricName.toUpperCase()} Target`,
      recommendation: `Goal "${targetGoal.metricName}" is at ${targetGoal.progressPercentage}% of the ${targetGoal.targetValue.toLocaleString()} target. Deploy targeted campaigns before period end.`,
      supportingData: `Goal Progress: ${targetGoal.currentValue}/${targetGoal.targetValue} (${targetGoal.progressPercentage}%)`
    })
  }

  // Default fallback if no specific triggers fired
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec-general-growth',
      priority: 'low',
      title: 'Maintain Current Social Engagement Strategy',
      recommendation: 'Current performance metrics are steady. Focus on replicating successful content formats and monitoring audience engagement trends.',
      supportingData: 'Stable Performance Baseline'
    })
  }

  return recommendations
}
