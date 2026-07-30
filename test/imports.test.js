import assert from 'node:assert'
import test from 'node:test'
import { autoDetectColumnMappings } from '../src/lib/imports/column-mapping.ts'
import { parseUnitValue, parseFlexibleDate } from '../src/lib/imports/import-parser.ts'
import { deduplicateMetricsBySourcePriority, DATA_SOURCE_PRIORITIES } from '../src/lib/analytics/source-priority.ts'
import { generateCSVTemplate } from '../src/lib/imports/templates.ts'

test('Stage 4.5 — Template Generator', () => {
  const csv = generateCSVTemplate('facebook_account_summary', true)
  assert.ok(csv.toLowerCase().includes('date'), 'CSV template should contain date header')
  assert.ok(csv.toLowerCase().includes('followers'), 'CSV template should contain followers header')
})

test('Stage 4.5 — Unit Normalizer Engine', () => {
  assert.strictEqual(parseUnitValue('1,250'), 1250)
  assert.strictEqual(parseUnitValue('1.2K'), 1200)
  assert.strictEqual(parseUnitValue('3.4M'), 3400000)
  assert.strictEqual(parseUnitValue('25%'), 25)
  assert.strictEqual(parseUnitValue('$150.50'), 150.50)
  assert.strictEqual(parseUnitValue(''), null)
})

test('Stage 4.5 — Date Parsing Engine', () => {
  assert.strictEqual(parseFlexibleDate('2026-07-25'), '2026-07-25')
  assert.strictEqual(parseFlexibleDate('25/07/2026', 'DMY'), '2026-07-25')
  assert.strictEqual(parseFlexibleDate('07/25/2026', 'MDY'), '2026-07-25')
})

test('Stage 4.5 — Column Auto-Mapping & Fuzzy Match', () => {
  const headers = ['Date', 'Followers', 'Total Reach', 'Page Views', 'Post Likes']
  const mappings = autoDetectColumnMappings(headers)

  const dateMap = mappings.find(m => m.fileColumn === 'Date')
  assert.strictEqual(dateMap?.mappedField, 'date')

  const folMap = mappings.find(m => m.fileColumn === 'Followers')
  assert.strictEqual(folMap?.mappedField, 'audience_total')

  const reachMap = mappings.find(m => m.fileColumn === 'Total Reach')
  assert.strictEqual(reachMap?.mappedField, 'reach')
})

test('Stage 4.5 — Source Priority Rank Calculation & Deduplication', () => {
  assert.strictEqual(DATA_SOURCE_PRIORITIES.api, 1)
  assert.strictEqual(DATA_SOURCE_PRIORITIES.csv_import, 2)
  assert.strictEqual(DATA_SOURCE_PRIORITIES.manual_entry, 3)

  const mockRows = [
    {
      provider: 'facebook',
      snapshot_date: '2026-07-25',
      metric_name: 'impressions',
      metric_value: 500,
      data_source: 'manual_entry',
      source_priority: 3
    },
    {
      provider: 'facebook',
      snapshot_date: '2026-07-25',
      metric_name: 'impressions',
      metric_value: 1200,
      data_source: 'api',
      source_priority: 1
    }
  ]

  const deduplicated = deduplicateMetricsBySourcePriority(mockRows)
  assert.strictEqual(deduplicated.length, 1)
  assert.strictEqual(deduplicated[0].metric_value, 1200, 'API value should override manual entry')
})
