import test from 'node:test'
import assert from 'node:assert/strict'
import { detectPlatformFromSignals } from '../src/lib/imports/platform-detector.js'
import { detectReportTypeFromHeaders } from '../src/lib/imports/report-type-detector.js'
import { computeFileSignature } from '../src/lib/imports/import-profile-engine.js'
import { isValidHexColor } from '../src/lib/branding/branding-engine.js'

test('Stage 4.6 — Platform Signal Detector Heuristics', async (t) => {
  await t.test('detects Facebook signals correctly', () => {
    const res = detectPlatformFromSignals(['Page Followers', 'Page Reach', 'Post Engagements'], 'facebook_export.csv')
    assert.equal(res.detectedPlatform, 'facebook')
    assert.equal(res.confidence >= 0.8, true)
    assert.equal(res.requiresConfirmation, false)
  })

  await t.test('detects YouTube signals correctly', () => {
    const res = detectPlatformFromSignals(['Subscribers', 'Watch Time (Hours)', 'Average View Duration'], 'youtube_studio.csv')
    assert.equal(res.detectedPlatform, 'youtube')
    assert.equal(res.confidence >= 0.8, true)
  })

  await t.test('detects TikTok signals correctly', () => {
    const res = detectPlatformFromSignals(['Video Views', 'Total Viewers', 'Watched Full Video'], 'tiktok_analytics.xlsx')
    assert.equal(res.detectedPlatform, 'tiktok')
    assert.equal(res.confidence >= 0.8, true)
  })

  await t.test('requires confirmation for low confidence or unknown signals', () => {
    const res = detectPlatformFromSignals(['Custom Column A', 'Custom Column B'], 'unknown.csv')
    assert.equal(res.detectedPlatform, 'generic')
    assert.equal(res.requiresConfirmation, true)
  })
})

test('Stage 4.6 — Report Type Detector', async (t) => {
  await t.test('detects content performance from post titles & captions', () => {
    const res = detectReportTypeFromHeaders(['Post Title', 'Caption', 'Post ID', 'Likes', 'Comments'])
    assert.equal(res.detectedReportType, 'content_performance')
  })

  await t.test('detects account summary from followers & views', () => {
    const res = detectReportTypeFromHeaders(['Date', 'Followers', 'Page Views', 'Impressions'])
    assert.equal(res.detectedReportType, 'account_summary')
  })
})

test('Stage 4.6 — Import Profile Structural Signature', async (t) => {
  await t.test('generates deterministic signature for same headers regardless of case', () => {
    const sig1 = computeFileSignature(['Date', 'Followers', 'Reach'], 'Sheet1')
    const sig2 = computeFileSignature(['date', 'followers', 'reach'], 'sheet1')
    assert.equal(sig1, sig2)
    assert.equal(sig1.length, 16)
  })
})

test('Stage 4.6 — Branding Hex Color Validation', async (t) => {
  await t.test('validates 6-digit hex colors', () => {
    assert.equal(isValidHexColor('#4F46E5'), true)
    assert.equal(isValidHexColor('#06B6D4'), true)
    assert.equal(isValidHexColor('#10B981'), true)
    assert.equal(isValidHexColor('invalid'), false)
    assert.equal(isValidHexColor('#123'), false)
  })
})
