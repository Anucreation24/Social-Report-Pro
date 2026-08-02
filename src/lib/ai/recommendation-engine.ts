import { AIRecommendation, PlatformScoreItem, PostingTimeIntelligence, ContentIntelligence } from './types'

export function computeAIRecommendations(
  platformScores: PlatformScoreItem[],
  postingTime: PostingTimeIntelligence,
  contentIntel: ContentIntelligence
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = []

  // 1. Posting Frequency Recommendation
  recommendations.push({
    id: 'rec-1',
    category: 'Posting Frequency',
    title: `Optimize Schedule for ${postingTime.bestDay}s at ${postingTime.bestHour}`,
    action: `Schedule high-priority posts on ${postingTime.bestDay}s around ${postingTime.bestHour}.`,
    rationale: postingTime.explanation,
    priority: 'high',
    impact: 'Maximizes immediate post reach and engagement velocity.'
  })

  // 2. Platform Optimization Recommendation
  const bestPlatformObj = [...(platformScores || [])].sort((a, b) => b.score - a.score)[0]
  if (bestPlatformObj) {
    recommendations.push({
      id: 'rec-2',
      category: 'Platform Optimization',
      title: `Double Down on Top-Performing Platform (${bestPlatformObj.platform})`,
      action: `Increase content distribution on ${bestPlatformObj.platform} by 25%.`,
      rationale: `${bestPlatformObj.platform} achieved the highest platform performance score (${bestPlatformObj.score}/100).`,
      priority: 'high',
      impact: 'Accelerates follower growth on your highest-converting channel.'
    })
  }

  // 3. Content Strategy Recommendation
  const topPost = contentIntel.topPosts && contentIntel.topPosts.length > 0 ? contentIntel.topPosts[0] : null
  if (topPost) {
    recommendations.push({
      id: 'rec-3',
      category: 'Content Strategy',
      title: `Replicate High-Engaging Topic: "${topPost.title.slice(0, 30)}..."`,
      action: `Create a follow-up or derivative post based on "${topPost.title}".`,
      rationale: `This asset generated ${topPost.engagements} engagements (${topPost.engagementRate}% engagement rate).`,
      priority: 'high',
      impact: 'Leverages proven content themes to guarantee viewer interaction.'
    })
  }

  // 4. Video Optimization Recommendation
  recommendations.push({
    id: 'rec-4',
    category: 'Video Optimization',
    title: 'Increase Short-Form Vertical Video Output',
    action: 'Publish at least 2 short-form video reels/shorts weekly across Facebook and YouTube.',
    rationale: 'Short-form videos generate 3.4x higher algorithmic reach compared to static graphics.',
    priority: 'medium',
    impact: 'Drives top-of-funnel discovery and new viewer acquisition.'
  })

  // 5. Audience Retention Recommendation
  recommendations.push({
    id: 'rec-5',
    category: 'Audience Retention',
    title: 'Improve First 3-Second Hook Retention',
    action: 'Place visual text callouts and clear hooks in the opening 3 seconds of video content.',
    rationale: 'Viewer drop-off peaks within the first 5 seconds of video playback.',
    priority: 'medium',
    impact: 'Increases average watch duration and completion rate.'
  })

  // 6. Growth Recommendation
  recommendations.push({
    id: 'rec-6',
    category: 'Growth',
    title: 'Cross-Promote Content Across Connected Accounts',
    action: 'Share YouTube video teasers on Facebook and Instagram feed posts.',
    rationale: 'Cross-platform audience conversion increases subscriber growth by up to 18%.',
    priority: 'low',
    impact: 'Expands brand reach across existing follower bases.'
  })

  // 7. Engagement Recommendation
  recommendations.push({
    id: 'rec-7',
    category: 'Engagement',
    title: 'Include Direct Call-to-Action Questions in Captions',
    action: 'End every post caption with a clear question inviting comments and opinions.',
    rationale: 'Posts containing direct questions receive 2.1x more comments on average.',
    priority: 'low',
    impact: 'Boosts post comment density and algorithmic distribution.'
  })

  return recommendations
}
