import test from 'node:test'
import assert from 'node:assert/strict'

import { generateExecutiveSummaryAi } from '../src/lib/ai/summary-engine.ts'
import { computePlatformScores, computePerformanceGrade, computeExecutiveKPIs } from '../src/lib/ai/scoring-engine.ts'
import { computeContentIntelligence, computePostingTimeIntelligence } from '../src/lib/ai/content-intelligence.ts'
import { computeAIRecommendations } from '../src/lib/ai/recommendation-engine.ts'
import { computeTrendDetection, computeAIForecast } from '../src/lib/ai/forecast-engine.ts'
import { computeGrowthAnalysisMap } from '../src/lib/ai/growth-analysis-engine.ts'

test('Stage 5 AI Engine — Executive Summary Length Selection', () => {
  const dummyGrowth = computeGrowthAnalysisMap([], { audienceTotal: 5000, views: 25000, reach: 30000, engagements: 2100 })
  const dummyScores = computePlatformScores([
    { platform: 'facebook', currentAudience: 5000, previousAudience: 4500, currentViews: 25000, previousViews: 20000, currentEngagements: 2100, previousEngagements: 1800, postCount: 12 }
  ])
  const dummyContent = computeContentIntelligence([])

  const shortSum = generateExecutiveSummaryAi(dummyGrowth, dummyScores, dummyContent, 'short')
  assert.ok(shortSum.overallNarrative.length < 250, 'Short summary should be concise')
  assert.strictEqual(shortSum.bestPlatform, 'Facebook')

  const detailedSum = generateExecutiveSummaryAi(dummyGrowth, dummyScores, dummyContent, 'detailed')
  assert.ok(detailedSum.overallNarrative.includes('EXECUTIVE PERFORMANCE DIRECTIVE'), 'Detailed summary should include detailed narrative')
})

test('Stage 5 AI Engine — Platform Scoring Engine (0-100 & Rationale)', () => {
  const scores = computePlatformScores([
    { platform: 'facebook', currentAudience: 10000, previousAudience: 8000, currentViews: 50000, previousViews: 40000, currentEngagements: 4000, previousEngagements: 3000, postCount: 15 },
    { platform: 'youtube', currentAudience: 2000, previousAudience: 2000, currentViews: 1000, previousViews: 1000, currentEngagements: 50, previousEngagements: 50, postCount: 1 }
  ])

  assert.strictEqual(scores.length, 2)
  assert.ok(scores[0].score >= 0 && scores[0].score <= 100, 'Score must be between 0 and 100')
  assert.ok(scores[0].score > scores[1].score, 'Higher activity platform should score higher')
  assert.ok(scores[0].explanation.length > 0, 'Must include bulleted explanations')
})

test('Stage 5 AI Engine — Performance Grade Assignment', () => {
  const scores = computePlatformScores([
    { platform: 'facebook', currentAudience: 10000, previousAudience: 8000, currentViews: 50000, previousViews: 40000, currentEngagements: 4000, previousEngagements: 3000, postCount: 15 }
  ])
  const grade = computePerformanceGrade(scores)
  assert.ok(['A+', 'A', 'B', 'C', 'D'].includes(grade.grade), 'Grade must be a valid letter grade')
  assert.ok(grade.score > 0, 'Composite score must be positive')
})

test('Stage 5 AI Engine — Executive KPI Cards Calculation', () => {
  const scores = computePlatformScores([
    { platform: 'facebook', currentAudience: 10000, previousAudience: 8000, currentViews: 50000, previousViews: 40000, currentEngagements: 4000, previousEngagements: 3000, postCount: 15 }
  ])
  const grade = computePerformanceGrade(scores)
  const kpis = computeExecutiveKPIs(scores, grade)

  assert.ok(kpis.growthScore.score >= 0 && kpis.growthScore.score <= 100)
  assert.ok(kpis.consistencyScore.score >= 0 && kpis.consistencyScore.score <= 100)
  assert.ok(kpis.overallHealth.score >= 0 && kpis.overallHealth.score <= 100)
})

test('Stage 5 AI Engine — Content Intelligence Classification', () => {
  const items = [
    { id: '1', title: 'Top Video', provider: 'facebook', published_at: '2026-07-01T12:00:00Z', views: 10000, engagements: 1200, shares: 150, comments: 200 },
    { id: '2', title: 'Low Post', provider: 'facebook', published_at: '2026-07-02T12:00:00Z', views: 200, engagements: 5, shares: 0, comments: 1 }
  ]

  const intel = computeContentIntelligence(items)
  assert.strictEqual(intel.topPosts[0].id, '1', 'Post 1 should be identified as top post')
  assert.strictEqual(intel.worstPosts[0].id, '2', 'Post 2 should be identified as worst post')
  assert.strictEqual(intel.mostShared[0].id, '1')
  assert.strictEqual(intel.mostCommented[0].id, '1')
})

test('Stage 5 AI Engine — Posting Time Intelligence', () => {
  const items = [
    { id: '1', title: 'P1', provider: 'facebook', published_at: '2026-07-07T18:00:00Z', views: 5000, engagements: 500 }, // Tuesday 6 PM
    { id: '2', title: 'P2', provider: 'facebook', published_at: '2026-07-07T18:30:00Z', views: 6000, engagements: 600 },
    { id: '3', title: 'P3', provider: 'facebook', published_at: '2026-07-05T03:00:00Z', views: 100, engagements: 2 }   // Sunday 3 AM
  ]

  const postingTime = computePostingTimeIntelligence(items)
  assert.strictEqual(postingTime.bestDay, 'Tuesday')
  assert.strictEqual(postingTime.bestHour, '18:00 (6 PM)')
  assert.strictEqual(postingTime.worstHour, '03:00 (3 AM)')
})

test('Stage 5 AI Engine — Prioritized Recommendations', () => {
  const scores = computePlatformScores([
    { platform: 'facebook', currentAudience: 10000, previousAudience: 8000, currentViews: 50000, previousViews: 40000, currentEngagements: 4000, previousEngagements: 3000, postCount: 15 }
  ])
  const postingTime = computePostingTimeIntelligence([])
  const contentIntel = computeContentIntelligence([])

  const recs = computeAIRecommendations(scores, postingTime, contentIntel)
  assert.ok(recs.length >= 5, 'Should generate at least 5 recommendations')
  assert.ok(recs.some(r => r.priority === 'high'), 'Must include high priority recommendations')
})

test('Stage 5 AI Engine — Trend Detection & Statistical Forecast', () => {
  const history = [
    { date: '2026-07-01', audience_total: 1000, views: 500, engagements: 50 },
    { date: '2026-07-02', audience_total: 1050, views: 550, engagements: 55 },
    { date: '2026-07-03', audience_total: 1100, views: 600, engagements: 60 },
    { date: '2026-07-04', audience_total: 1150, views: 650, engagements: 65 },
    { date: '2026-07-05', audience_total: 1200, views: 1500, engagements: 200 } // Spike
  ]

  const trends = computeTrendDetection(history)
  assert.ok(trends.increasingMetrics.includes('Audience Total'))

  const forecast = computeAIForecast(history)
  assert.ok(forecast.nextWeekAudience > 1200, 'Forecast audience should grow based on linear trend')
  assert.ok(forecast.nextMonthAudience > forecast.nextWeekAudience, 'Monthly forecast should be higher than weekly')
})
