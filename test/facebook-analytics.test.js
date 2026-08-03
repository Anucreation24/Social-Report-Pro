import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  parseInsightMetricValue as parseVal,
  mergeMetrics as mergeMetricsFn,
  getFacebookAnalyticsCapabilities as getCaps
} from '../src/lib/connectors/facebook/analytics'

test('Facebook Analytics Provider — Capabilities Registration', () => {
  const caps = getCaps()
  assert.equal(caps.maxHistoricalDays, 90)
  assert.ok(caps.supportedAccountMetrics.includes('reach'))
  assert.ok(caps.supportedAccountMetrics.includes('impressions'))
  assert.ok(caps.supportedAccountMetrics.includes('engagements'))
  assert.ok(caps.supportedAccountMetrics.includes('views'))
})

test('Facebook Analytics Provider — Safe Metric Value Parser', () => {
  assert.equal(parseVal(null), 0)
  assert.equal(parseVal(undefined), 0)
  assert.equal(parseVal(42), 42)
  assert.equal(parseVal('1,250'), 1250)
  assert.equal(parseVal({ like: 10, love: 5, wow: 3 }), 18)
})

test('Facebook Analytics Provider — Metric Merging Engine', () => {
  const pageInfo = { id: 'page_123', name: 'Test Page', followersCount: 5000, fanCount: 5000 }
  const insightsMap = new Map()

  insightsMap.set('2026-08-01', [
    { name: 'reach', value: 1200, providerMetricName: 'page_impressions_unique' },
    { name: 'impressions', value: 2500, providerMetricName: 'page_impressions' },
    { name: 'engagements', value: 350, providerMetricName: 'page_post_engagements' },
    { name: 'views', value: 800, providerMetricName: 'page_video_views' }
  ])

  const results = mergeMetricsFn(pageInfo, insightsMap, '2026-08-01')

  assert.equal(results.length, 1)
  assert.equal(results[0].snapshotDate, '2026-08-01')
  
  const metricNames = results[0].metrics.map(m => m.name)
  assert.ok(metricNames.includes('reach'))
  assert.ok(metricNames.includes('impressions'))
  assert.ok(metricNames.includes('engagements'))
  assert.ok(metricNames.includes('views'))
  assert.ok(metricNames.includes('audience_total'))

  const audienceMetric = results[0].metrics.find(m => m.name === 'audience_total')
  assert.equal(audienceMetric.value, 5000)
})
