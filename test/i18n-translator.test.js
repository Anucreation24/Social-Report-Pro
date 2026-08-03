import assert from 'node:assert'
import { test, describe } from 'node:test'
import { getLanguageOption } from '../src/lib/i18n/languages.ts'
import { getDictionary, translateStatementText, translateReportSnapshot } from '../src/lib/i18n/translator.ts'

describe('Multilingual AI Reporting & Translation Engine', () => {

  test('Language Registry — identifies English and Sinhala as supported languages', () => {
    const en = getLanguageOption('en')
    const si = getLanguageOption('si')

    assert.strictEqual(en.code, 'en')
    assert.strictEqual(en.isSupported, true)
    assert.strictEqual(si.code, 'si')
    assert.strictEqual(si.nativeName, 'සිංහල')
    assert.strictEqual(si.isSupported, true)
  })

  test('Language Registry — supports extensible future languages via fallback', () => {
    const ta = getLanguageOption('ta')
    assert.strictEqual(ta.code, 'ta')
    assert.strictEqual(ta.nativeName, 'தமிழ்')
  })

  test('Dictionary — returns localized Sinhala headings and metric labels', () => {
    const enDict = getDictionary('en')
    const siDict = getDictionary('si')

    assert.strictEqual(enDict.executiveSummary, 'Executive Summary')
    assert.strictEqual(siDict.executiveSummary, 'විධායක සාරාංශය')

    assert.strictEqual(enDict.metrics.audienceTotal, 'Total Followers')
    assert.strictEqual(siDict.metrics.audienceTotal, 'මුළු අනුගාමිකයින්')
  })

  test('Statement Translator — translates English statements into Sinhala preserving numeric metrics', () => {
    const originalText = 'Audience total reached 12,500 followers (+14.5% growth)'
    const translated = translateStatementText(originalText, 'si')

    assert.strictEqual(translated.includes('12,500'), true)
    assert.strictEqual(translated.includes('+14.5%'), true)
    assert.strictEqual(translated.includes('සමස්ත ප්‍රේක්ෂක සංඛ්‍යාව ළඟා විය'), true)
  })

  test('Snapshot Translation — creates translated copy without mutating original snapshot', () => {
    const dummySnapshot = {
      company: { id: 'c1', name: 'Test Agency', logoUrl: null, timezone: 'Asia/Colombo', weekStartsOn: 'monday' },
      report: { type: 'monthly', title: 'Monthly Social Performance Report', periodStart: '2026-07-01', periodEnd: '2026-07-31', comparisonStart: '2026-06-01', comparisonEnd: '2026-06-30', preparedBy: 'Marketing', generatedAt: '2026-08-01', versionNumber: 1 },
      overall: {
        audienceTotal: { metricName: 'audience_total', currentValue: 10000, previousValue: 9000, absoluteChange: 1000, percentageChange: 11.1, isPositive: true, isUnavailable: false, unit: 'Followers' },
        impressions: { metricName: 'impressions', currentValue: 50000, previousValue: 45000, absoluteChange: 5000, percentageChange: 11.1, isPositive: true, isUnavailable: false },
        reach: { metricName: 'reach', currentValue: 30000, previousValue: 28000, absoluteChange: 2000, percentageChange: 7.1, isPositive: true, isUnavailable: false },
        views: { metricName: 'views', currentValue: 20000, previousValue: 18000, absoluteChange: 2000, percentageChange: 11.1, isPositive: true, isUnavailable: false },
        engagements: { metricName: 'engagements', currentValue: 5000, previousValue: 4000, absoluteChange: 1000, percentageChange: 25, isPositive: true, isUnavailable: false },
        engagementRate: { metricName: 'engagement_rate', currentValue: 5.0, previousValue: 4.5, absoluteChange: 0.5, percentageChange: 11.1, isPositive: true, isUnavailable: false },
        watchTimeSeconds: { metricName: 'watch_time_seconds', currentValue: 12000, previousValue: 10000, absoluteChange: 2000, percentageChange: 20, isPositive: true, isUnavailable: false },
        contentPublished: { metricName: 'content_published', currentValue: 15, previousValue: 12, absoluteChange: 3, percentageChange: 25, isPositive: true, isUnavailable: false }
      },
      platforms: {},
      topContent: [],
      lowestContent: [],
      goals: [],
      executiveSummary: [
        { id: 'e1', type: 'positive', statement: 'Audience total reached 10,000 followers' }
      ],
      recommendations: [
        { id: 'r1', priority: 'high', title: 'Increase Publishing Consistency', recommendation: 'Maintain regular posting cadence' }
      ],
      dataAvailability: [],
      notes: {}
    }

    const translatedSingle = translateReportSnapshot(dummySnapshot, 'si', 'single')
    assert.strictEqual(dummySnapshot.overall.audienceTotal.unit, 'Followers') // Original unmutated
    assert.strictEqual(translatedSingle.overall.audienceTotal.unit.includes('මුළු අනුගාමිකයින්'), true)

    const translatedBilingual = translateReportSnapshot(dummySnapshot, 'si', 'bilingual')
    assert.strictEqual(translatedBilingual.recommendations[0].title.includes('Increase Publishing Consistency / ප්‍රකාශන ස්ථාවරභාවය වැඩි කරන්න'), true)
  })

})
