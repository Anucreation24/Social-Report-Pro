import assert from 'node:assert'
import test from 'node:test'
import { detectPlatformFromSignals } from '../src/lib/imports/platform-detector.ts'
import { detectReportTypeFromHeaders } from '../src/lib/imports/report-type-detector.ts'
import { autoDetectColumnMappings } from '../src/lib/imports/column-mapping.ts'
import { parseAndNormalizeDate, normalizeAndValidateRow, parseCSVContent } from '../src/lib/imports/import-parser.ts'

const TIKTOK_OVERVIEW_CSV = `Date,Video Views,Profile Views,Likes,Comments,Shares
October 1,0,0,0,0,0
October 2,0,0,0,0,0
October 3,0,1,0,0,0`

test('TikTok Importer — Platform Signal Detection for Overview.csv', () => {
  const parsed = parseCSVContent(TIKTOK_OVERVIEW_CSV, 'Overview.csv')
  const detection = detectPlatformFromSignals(parsed.headers, 'Overview.csv')

  assert.strictEqual(detection.detectedPlatform, 'tiktok', 'Platform should be TikTok')
  assert.strictEqual(detection.confidenceLevel, 'high', 'Confidence level should be high')
  assert.ok(detection.confidence >= 0.85, 'Confidence score should be >= 0.85')
  assert.ok(detection.matchedSignals.includes('video views'), 'Should match video views signal')
  assert.ok(detection.matchedSignals.includes('profile views'), 'Should match profile views signal')
  assert.strictEqual(detection.conflictingSignals.length, 0, 'No conflicting platform signals')
})

test('TikTok Importer — Report Type Detection for Daily Overview', () => {
  const parsed = parseCSVContent(TIKTOK_OVERVIEW_CSV, 'Overview.csv')
  const reportTypeResult = detectReportTypeFromHeaders(parsed.headers)

  assert.strictEqual(reportTypeResult.detectedReportType, 'daily_overview', 'Report type should be daily_overview')
  assert.ok(reportTypeResult.confidence >= 0.90, 'Confidence should be high for daily overview')
})

test('TikTok Importer — Column Mapping', () => {
  const parsed = parseCSVContent(TIKTOK_OVERVIEW_CSV, 'Overview.csv')
  const mappings = autoDetectColumnMappings(parsed.headers)

  const dateMap = mappings.find(m => m.fileColumn === 'Date')
  const viewsMap = mappings.find(m => m.fileColumn === 'Video Views')
  const profileViewsMap = mappings.find(m => m.fileColumn === 'Profile Views')
  const likesMap = mappings.find(m => m.fileColumn === 'Likes')
  const commentsMap = mappings.find(m => m.fileColumn === 'Comments')
  const sharesMap = mappings.find(m => m.fileColumn === 'Shares')

  assert.strictEqual(dateMap?.mappedField, 'date')
  assert.strictEqual(viewsMap?.mappedField, 'views')
  assert.strictEqual(profileViewsMap?.mappedField, 'profile_views')
  assert.strictEqual(likesMap?.mappedField, 'likes')
  assert.strictEqual(commentsMap?.mappedField, 'comments')
  assert.strictEqual(sharesMap?.mappedField, 'shares')
})

test('TikTok Importer — Date Parsing with Missing Year', () => {
  const resNoYear = parseAndNormalizeDate('October 1')
  assert.strictEqual(resNoYear.missingYear, true, 'Should flag missing year for October 1')
  assert.strictEqual(resNoYear.date, null)

  const resWithYear = parseAndNormalizeDate('October 1', 'auto', 2026)
  assert.strictEqual(resWithYear.missingYear, false)
  assert.strictEqual(resWithYear.date, '2026-10-01', 'Should normalize to 2026-10-01 when selectedYear is 2026')
})

test('TikTok Importer — Engagement Derivation and Preserved NULL for Missing Metrics', () => {
  const parsed = parseCSVContent(TIKTOK_OVERVIEW_CSV, 'Overview.csv')
  const mappings = autoDetectColumnMappings(parsed.headers)

  const testRow = {
    Date: 'October 3',
    'Video Views': '1250',
    'Profile Views': '45',
    Likes: '180',
    Comments: '14',
    Shares: '8'
  }

  const normalized = normalizeAndValidateRow(
    testRow,
    3,
    mappings,
    'comp_123',
    'tiktok',
    'daily_overview',
    'auto',
    2026
  )

  assert.strictEqual(normalized.status, 'valid')
  assert.strictEqual(normalized.normalizedData.date, '2026-10-03')
  assert.strictEqual(normalized.normalizedData.views, 1250)
  assert.strictEqual(normalized.normalizedData.profile_views, 45)
  assert.strictEqual(normalized.normalizedData.likes, 180)
  assert.strictEqual(normalized.normalizedData.comments, 14)
  assert.strictEqual(normalized.normalizedData.shares, 8)

  // Derived Engagements = 180 + 14 + 8 = 202
  assert.strictEqual(normalized.normalizedData.engagements, 202, 'Engagements should be derived sum')
  assert.strictEqual(normalized.isDerivedEngagement, true, 'Should be flagged as derived engagement')

  // Missing metrics MUST remain undefined / null (NOT 0)
  assert.strictEqual(normalized.normalizedData.reach, undefined, 'Missing reach should not be converted to 0')
  assert.strictEqual(normalized.normalizedData.impressions, undefined, 'Missing impressions should not be converted to 0')
  assert.strictEqual(normalized.normalizedData.audience_total, undefined, 'Missing followers should not be converted to 0')
})
