import ExcelJS from 'exceljs'
import { GeneratedReportSnapshot } from './types'

export async function generateReportExcelBuffer(snapshot: GeneratedReportSnapshot): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Social Report Pro'
  workbook.created = new Date()

  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E293B' } // Slate 800
  }

  const headerFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFF' }
  }

  // ----------------------------------------------------
  // Sheet 1: Report Summary
  // ----------------------------------------------------
  const summarySheet = workbook.addWorksheet('Report Summary')
  summarySheet.views = [{ state: 'frozen', ySplit: 6 }]

  summarySheet.mergeCells('A1:E1')
  summarySheet.getCell('A1').value = snapshot.company.name
  summarySheet.getCell('A1').font = { size: 16, bold: true, color: { argb: '0F172A' } }

  summarySheet.mergeCells('A2:E2')
  summarySheet.getCell('A2').value = `${snapshot.report.title} (${snapshot.report.type.toUpperCase()})`
  summarySheet.getCell('A2').font = { size: 12, bold: true, color: { argb: '2563EB' } }

  summarySheet.getCell('A3').value = `Reporting Period: ${snapshot.report.periodStart} to ${snapshot.report.periodEnd}`
  summarySheet.getCell('A4').value = `Prepared By: ${snapshot.report.preparedBy} | Generated: ${new Date(snapshot.report.generatedAt).toLocaleDateString()}`

  summarySheet.addRow([])
  const kpiHeaderRow = summarySheet.addRow(['Metric', 'Current Value', 'Previous Value', 'Change (%)', 'Status'])
  kpiHeaderRow.eachCell(cell => {
    cell.fill = headerFill
    cell.font = headerFont
  })

  const overall = snapshot.overall
  const metricsList = [
    { label: 'Total Audience', m: overall.audienceTotal },
    { label: 'Total Views', m: overall.views },
    { label: 'Total Engagements', m: overall.engagements },
    { label: 'Total Impressions', m: overall.impressions },
    { label: 'Total Reach', m: overall.reach },
    { label: 'Watch Time (Hours)', m: overall.watchTimeSeconds },
    { label: 'Content Published', m: overall.contentPublished }
  ]

  for (const item of metricsList) {
    const m = item.m
    summarySheet.addRow([
      item.label,
      m.currentValue,
      m.previousValue ?? 'N/A',
      m.percentageChange !== null ? `${m.percentageChange}%` : 'N/A',
      m.isUnavailable ? (m.availabilityReason || 'Unavailable') : 'Available'
    ])
  }

  // ----------------------------------------------------
  // Sheet 2: Platform Comparison
  // ----------------------------------------------------
  const compSheet = workbook.addWorksheet('Platform Comparison')
  compSheet.views = [{ state: 'frozen', ySplit: 2 }]

  compSheet.getCell('A1').value = 'Platform Comparison Overview'
  compSheet.getCell('A1').font = { size: 13, bold: true }

  const compHeader = compSheet.addRow(['Platform', 'Status', 'Audience', 'Views', 'Engagements', 'Published Posts'])
  compHeader.eachCell(cell => {
    cell.fill = headerFill
    cell.font = headerFont
  })

  for (const [pKey, pData] of Object.entries(snapshot.platforms)) {
    if (!pData) continue
    compSheet.addRow([
      pKey.toUpperCase(),
      pData.isConnected ? (pData.metrics.impressions.isUnavailable ? 'Permission Notice' : 'Connected') : 'Not Connected',
      pData.metrics.audienceTotal.currentValue,
      pData.metrics.views.currentValue,
      pData.metrics.engagements.currentValue,
      pData.metrics.contentPublished.currentValue
    ])
  }

  // ----------------------------------------------------
  // Sheet 3..6: Provider Specific Sheets (Facebook, Instagram, YouTube, TikTok)
  // ----------------------------------------------------
  const providerKeys: Array<'facebook' | 'instagram' | 'youtube' | 'tiktok'> = ['facebook', 'instagram', 'youtube', 'tiktok']
  for (const pKey of providerKeys) {
    const pData = snapshot.platforms[pKey]
    if (!pData) continue

    const pSheet = workbook.addWorksheet(pKey.toUpperCase())
    pSheet.views = [{ state: 'frozen', ySplit: 2 }]

    pSheet.getCell('A1').value = `${pKey.toUpperCase()} Performance Details`
    pSheet.getCell('A1').font = { size: 13, bold: true }

    const pHeader = pSheet.addRow(['Metric Name', 'Current Value', 'Previous Baseline', 'Change (%)', 'Status'])
    pHeader.eachCell(cell => {
      cell.fill = headerFill
      cell.font = headerFont
    })

    for (const [mKey, mVal] of Object.entries(pData.metrics)) {
      pSheet.addRow([
        mKey,
        mVal.currentValue,
        mVal.previousValue ?? 'N/A',
        mVal.percentageChange !== null ? `${mVal.percentageChange}%` : 'N/A',
        mVal.isUnavailable ? (mVal.availabilityReason || 'Unavailable') : 'Available'
      ])
    }
  }

  // ----------------------------------------------------
  // Sheet 7: Top Content
  // ----------------------------------------------------
  const contentSheet = workbook.addWorksheet('Top Content')
  contentSheet.views = [{ state: 'frozen', ySplit: 2 }]

  contentSheet.getCell('A1').value = 'Top Performing Content'
  contentSheet.getCell('A1').font = { size: 13, bold: true }

  const contentHeader = contentSheet.addRow([
    'Platform', 'Title / Excerpt', 'Published Date', 'Views', 'Likes', 'Comments', 'Shares', 'Total Engagements', 'Permalink'
  ])
  contentHeader.eachCell(cell => {
    cell.fill = headerFill
    cell.font = headerFont
  })

  for (const item of snapshot.topContent) {
    contentSheet.addRow([
      item.platform.toUpperCase(),
      item.title,
      new Date(item.publishedAt).toLocaleDateString(),
      item.views,
      item.likes,
      item.comments,
      item.shares,
      item.engagements,
      item.permalink
    ])
  }

  // ----------------------------------------------------
  // Sheet 8: Goals
  // ----------------------------------------------------
  const goalsSheet = workbook.addWorksheet('Goals')
  goalsSheet.views = [{ state: 'frozen', ySplit: 2 }]

  goalsSheet.getCell('A1').value = 'KPI Goal Progress'
  goalsSheet.getCell('A1').font = { size: 13, bold: true }

  const goalsHeader = goalsSheet.addRow(['Platform', 'Metric Name', 'Baseline', 'Current Value', 'Target Value', 'Progress (%)', 'Status'])
  goalsHeader.eachCell(cell => {
    cell.fill = headerFill
    cell.font = headerFont
  })

  for (const g of snapshot.goals) {
    goalsSheet.addRow([
      g.platform.toUpperCase(),
      g.metricName,
      g.baselineValue,
      g.currentValue,
      g.targetValue,
      `${g.progressPercentage}%`,
      g.status.toUpperCase()
    ])
  }

  // ----------------------------------------------------
  // Sheet 9: Data Availability
  // ----------------------------------------------------
  const availSheet = workbook.addWorksheet('Data Availability')
  availSheet.views = [{ state: 'frozen', ySplit: 2 }]

  availSheet.getCell('A1').value = 'Data Availability & Platform Disclaimers'
  availSheet.getCell('A1').font = { size: 13, bold: true }

  const availHeader = availSheet.addRow(['Key', 'Platform', 'Status', 'Message'])
  availHeader.eachCell(cell => {
    cell.fill = headerFill
    cell.font = headerFont
  })

  for (const item of snapshot.dataAvailability) {
    availSheet.addRow([
      item.key,
      item.platform?.toUpperCase() || 'GENERAL',
      item.status.toUpperCase(),
      item.message
    ])
  }

  // Auto-fit column widths across all sheets
  workbook.eachSheet(sheet => {
    sheet.columns.forEach(col => {
      let maxLen = 12
      col.eachCell?.({ includeEmpty: true }, cell => {
        const str = cell.value ? cell.value.toString() : ''
        if (str.length > maxLen) {
          maxLen = Math.min(60, str.length)
        }
      })
      col.width = maxLen + 3
    })
  })

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
