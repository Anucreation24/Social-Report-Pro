import assert from 'node:assert'
import { test, describe } from 'node:test'
import { estimateTextHeight, estimateTableRowHeight, shouldBreakBefore, USABLE_PAGE_HEIGHT_PT } from '../src/lib/reports/pagination-engine.ts'
import { generateReportPDFBuffer } from '../src/lib/reports/pdf-generator.ts'

describe('PDF Pagination Engine & Multi-Page Document Flow', () => {

  test('Height Estimator — computes accurate line heights for text', () => {
    const shortText = 'Concise observation'
    const longText = 'A '.repeat(200)

    const shortHeight = estimateTextHeight(shortText, 9, 500)
    const longHeight = estimateTextHeight(longText, 9, 500)

    assert.ok(longHeight > shortHeight)
    assert.strictEqual(estimateTableRowHeight(20), 22)
  })

  test('Break Threshold Calculator — flags break when remaining space is insufficient', () => {
    assert.strictEqual(shouldBreakBefore(650, 100, USABLE_PAGE_HEIGHT_PT), true)
    assert.strictEqual(shouldBreakBefore(200, 100, USABLE_PAGE_HEIGHT_PT), false)
  })

  test('Multi-Page PDF Buffer Generation — handles large datasets across multiple pages cleanly', async () => {
    const largeContent = Array.from({ length: 30 }).map((_, i) => ({
      providerContentId: `content_${i}`,
      platform: 'facebook',
      title: `High Performing Campaign Post #${i + 1} with Extended Detailed Captions and Comprehensive Analytics Breakdown`,
      captionExcerpt: `Extended post narrative #${i + 1}`,
      permalink: 'https://facebook.com/post',
      thumbnailUrl: null,
      publishedAt: '2026-07-15',
      views: 10000 + i * 500,
      reach: 8000 + i * 400,
      impressions: 12000 + i * 600,
      likes: 500 + i * 20,
      comments: 100 + i * 5,
      shares: 50 + i * 2,
      engagements: 650 + i * 27,
      engagementRate: 5.2
    }))

    const largeRecommendations = Array.from({ length: 15 }).map((_, i) => ({
      id: `rec_${i}`,
      priority: 'high',
      title: `Strategic Action Recommendation #${i + 1}`,
      recommendation: `Comprehensive action item details for strategy execution #${i + 1} ensuring complete multi-page pagination testing across PDF export documents.`
    }))

    const multiPageSnapshot = {
      company: { id: 'c1', name: 'Multi Page Global Enterprise', logoUrl: null, timezone: 'Asia/Colombo', weekStartsOn: 'monday' },
      report: { type: 'monthly', title: 'Comprehensive Enterprise Performance Audit', periodStart: '2026-07-01', periodEnd: '2026-07-31', comparisonStart: '2026-06-01', comparisonEnd: '2026-06-30', preparedBy: 'Senior Architect', generatedAt: '2026-08-01', versionNumber: 1 },
      overall: {
        audienceTotal: { metricName: 'audience_total', currentValue: 250000, previousValue: 220000, absoluteChange: 30000, percentageChange: 13.6, isPositive: true, isUnavailable: false },
        impressions: { metricName: 'impressions', currentValue: 1500000, previousValue: 1300000, absoluteChange: 200000, percentageChange: 15.4, isPositive: true, isUnavailable: false },
        reach: { metricName: 'reach', currentValue: 950000, previousValue: 880000, absoluteChange: 70000, percentageChange: 8.0, isPositive: true, isUnavailable: false },
        views: { metricName: 'views', currentValue: 800000, previousValue: 700000, absoluteChange: 100000, percentageChange: 14.3, isPositive: true, isUnavailable: false },
        engagements: { metricName: 'engagements', currentValue: 120000, previousValue: 100000, absoluteChange: 20000, percentageChange: 20.0, isPositive: true, isUnavailable: false },
        engagementRate: { metricName: 'engagement_rate', currentValue: 8.0, previousValue: 7.5, absoluteChange: 0.5, percentageChange: 6.7, isPositive: true, isUnavailable: false },
        watchTimeSeconds: { metricName: 'watch_time_seconds', currentValue: 450000, previousValue: 400000, absoluteChange: 50000, percentageChange: 12.5, isPositive: true, isUnavailable: false },
        contentPublished: { metricName: 'content_published', currentValue: 45, previousValue: 40, absoluteChange: 5, percentageChange: 12.5, isPositive: true, isUnavailable: false }
      },
      platforms: {
        facebook: { platform: 'facebook', isConnected: true, hasData: true, availabilityStatus: 'connected', metrics: { audienceTotal: { currentValue: 100000 }, views: { currentValue: 300000 }, engagements: { currentValue: 50000 }, contentPublished: { currentValue: 20 } } },
        youtube: { platform: 'youtube', isConnected: true, hasData: true, availabilityStatus: 'connected', metrics: { audienceTotal: { currentValue: 150000 }, views: { currentValue: 500000 }, engagements: { currentValue: 70000 }, contentPublished: { currentValue: 25 } } }
      },
      topContent: largeContent,
      lowestContent: [],
      goals: [],
      executiveSummary: [
        { id: 'e1', type: 'positive', statement: 'Audience expansion maintained a steady +13.6% growth trajectory throughout the reporting month.' },
        { id: 'e2', type: 'positive', statement: 'Video view duration increased by +12.5% driven by long-form tutorial content.' }
      ],
      recommendations: largeRecommendations,
      dataAvailability: [
        { key: 'd1', status: 'available', message: 'All platform metrics synced successfully with zero permission errors.' }
      ],
      notes: {}
    }

    const pdfBuffer = await generateReportPDFBuffer(multiPageSnapshot, 'en', 'single')
    assert.ok(pdfBuffer instanceof Buffer)
    assert.ok(pdfBuffer.length > 5000, 'PDF buffer should contain valid multi-page document payload')

    const bilingualBuffer = await generateReportPDFBuffer(multiPageSnapshot, 'si', 'bilingual')
    assert.ok(bilingualBuffer instanceof Buffer)
    assert.ok(bilingualBuffer.length > 5000, 'Bilingual PDF buffer should contain valid payload')
  })

})
