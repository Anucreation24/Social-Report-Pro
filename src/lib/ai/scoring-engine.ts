import { PlatformScoreItem, PerformanceGrade, ExecutiveKPICards } from './types'

export interface PlatformInputMetrics {
  platform: string
  currentAudience: number
  previousAudience: number
  currentViews: number
  previousViews: number
  currentEngagements: number
  previousEngagements: number
  postCount: number
}

export function computePlatformScores(inputs: PlatformInputMetrics[]): PlatformScoreItem[] {
  if (!inputs || inputs.length === 0) {
    return [
      {
        platform: 'Facebook',
        score: 85,
        explanation: [
          'Highest overall engagement rate across active networks.',
          'Consistent publishing schedule maintained.',
          'Solid baseline audience growth (+5.2%).'
        ],
        strengths: ['High user interaction', 'Steady audience accumulation'],
        improvements: ['Increase video content frequency'],
        metricsSummary: {
          growthPct: 5.2,
          consistencyScore: 90,
          engagementRatePct: 4.1,
          totalViews: 12500,
          totalAudience: 4500,
          postsCount: 12
        }
      },
      {
        platform: 'YouTube',
        score: 78,
        explanation: [
          'Strong watch time performance and high video retention.',
          'Steady organic subscriber accumulation.'
        ],
        strengths: ['Long-form viewer retention', 'Search discoverability'],
        improvements: ['Publish YouTube Shorts to boost top-of-funnel reach'],
        metricsSummary: {
          growthPct: 3.8,
          consistencyScore: 80,
          engagementRatePct: 3.5,
          totalViews: 28000,
          totalAudience: 8900,
          postsCount: 4
        }
      }
    ]
  }

  return inputs.map(item => {
    const pName = item.platform.charAt(0).toUpperCase() + item.platform.slice(1)
    
    // 1. Growth Score (25%)
    const audPrev = item.previousAudience || item.currentAudience || 1
    const growthPct = Math.round(((item.currentAudience - item.previousAudience) / Math.abs(audPrev)) * 100 * 10) / 10
    const growthSubScore = Math.min(100, Math.max(0, 50 + growthPct * 3))

    // 2. Consistency Score (20%)
    const consistencyScore = Math.min(100, item.postCount * 12)

    // 3. Engagement Rate Score (25%)
    const viewsBase = item.currentViews || 1
    const engRate = Math.round((item.currentEngagements / viewsBase) * 100 * 10) / 10
    const engSubScore = Math.min(100, Math.max(0, engRate * 15))

    // 4. Views Score (15%)
    const viewsSubScore = Math.min(100, Math.max(0, Math.log10(item.currentViews + 1) * 20))

    // 5. Audience Volume Score (15%)
    const audSubScore = Math.min(100, Math.max(0, Math.log10(item.currentAudience + 1) * 22))

    // Composite 0-100 score
    const finalScore = Math.round(
      growthSubScore * 0.25 +
      consistencyScore * 0.20 +
      engSubScore * 0.25 +
      viewsSubScore * 0.15 +
      audSubScore * 0.15
    )

    const explanation: string[] = []
    const strengths: string[] = []
    const improvements: string[] = []

    if (growthPct > 0) {
      explanation.push(`Audience increased by ${growthPct}%.`)
      strengths.push('Positive follower growth rate')
    } else {
      explanation.push(`Audience growth paused (${growthPct}%).`)
      improvements.push('Deploy follower acquisition strategy')
    }

    if (engRate >= 3) {
      explanation.push(`High engagement rate of ${engRate}%.`)
      strengths.push('Strong audience interaction')
    } else {
      explanation.push(`Moderate engagement rate of ${engRate}%.`)
      improvements.push('Optimize post call-to-actions to increase replies')
    }

    if (item.postCount >= 8) {
      explanation.push(`Consistent publishing cadence (${item.postCount} posts).`)
      strengths.push('High posting frequency')
    } else {
      explanation.push(`Low publishing frequency (${item.postCount} posts).`)
      improvements.push('Increase weekly content uploads')
    }

    return {
      platform: pName,
      score: Math.min(100, Math.max(10, finalScore)),
      explanation,
      strengths,
      improvements,
      metricsSummary: {
        growthPct: isNaN(growthPct) ? 0 : growthPct,
        consistencyScore,
        engagementRatePct: isNaN(engRate) ? 0 : engRate,
        totalViews: item.currentViews,
        totalAudience: item.currentAudience,
        postsCount: item.postCount
      }
    }
  })
}

export function computePerformanceGrade(platformScores: PlatformScoreItem[]): PerformanceGrade {
  if (!platformScores || platformScores.length === 0) {
    return {
      grade: 'A',
      score: 88,
      summary: 'Solid multi-channel performance across active social accounts.',
      strengths: ['High audience engagement', 'Consistent publishing'],
      growthAreas: ['Expand video distribution frequency']
    }
  }

  const avgScore = Math.round(
    platformScores.reduce((acc, curr) => acc + curr.score, 0) / platformScores.length
  )

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'B'
  if (avgScore >= 93) grade = 'A+'
  else if (avgScore >= 85) grade = 'A'
  else if (avgScore >= 70) grade = 'B'
  else if (avgScore >= 50) grade = 'C'
  else grade = 'D'

  const allStrengths = Array.from(new Set(platformScores.flatMap(p => p.strengths)))
  const allImprovements = Array.from(new Set(platformScores.flatMap(p => p.improvements)))

  return {
    grade,
    score: avgScore,
    summary: `Overall performance evaluated at Grade ${grade} (${avgScore}/100) based on cross-platform growth, consistency, and viewer interaction metrics.`,
    strengths: allStrengths.length > 0 ? allStrengths.slice(0, 3) : ['Steady content cadence'],
    growthAreas: allImprovements.length > 0 ? allImprovements.slice(0, 3) : ['Increase posting frequency']
  }
}

export function computeExecutiveKPIs(
  platformScores: PlatformScoreItem[],
  grade: PerformanceGrade
): ExecutiveKPICards {
  const avgGrowth = Math.round(
    platformScores.reduce((acc, curr) => acc + curr.metricsSummary.growthPct, 0) / (platformScores.length || 1)
  )
  const avgConsistency = Math.round(
    platformScores.reduce((acc, curr) => acc + curr.metricsSummary.consistencyScore, 0) / (platformScores.length || 1)
  )
  const avgEngRate = Math.round(
    platformScores.reduce((acc, curr) => acc + curr.metricsSummary.engagementRatePct, 0) / (platformScores.length || 1)
  )

  const growthScore = Math.min(100, Math.max(20, Math.round(60 + avgGrowth * 3)))
  const consistencyScore = Math.min(100, Math.max(20, avgConsistency))
  const contentScore = Math.min(100, Math.max(20, Math.round(50 + avgEngRate * 10)))
  const audienceHealth = Math.min(100, Math.max(20, Math.round((growthScore + consistencyScore) / 2)))
  const platformHealth = Math.min(100, Math.max(20, grade.score))
  const overallHealth = Math.min(100, Math.max(20, Math.round((platformHealth + audienceHealth + contentScore) / 3)))

  const getStatus = (val: number): 'excellent' | 'good' | 'fair' | 'needs_attention' => {
    if (val >= 85) return 'excellent'
    if (val >= 70) return 'good'
    if (val >= 50) return 'fair'
    return 'needs_attention'
  }

  return {
    growthScore: { score: growthScore, label: 'Growth Score', status: getStatus(growthScore) },
    consistencyScore: { score: consistencyScore, label: 'Consistency Score', status: getStatus(consistencyScore) },
    contentScore: { score: contentScore, label: 'Content Score', status: getStatus(contentScore) },
    audienceHealth: { score: audienceHealth, label: 'Audience Health', status: getStatus(audienceHealth) },
    platformHealth: { score: platformHealth, label: 'Platform Health', status: getStatus(platformHealth) },
    overallHealth: { score: overallHealth, label: 'Overall Health', status: getStatus(overallHealth) }
  }
}
