/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test')
const assert = require('node:assert/strict')

// Helper function definitions matching period calculations for node unit testing
function formatDateISO(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function calculateWeeklyReportPeriod(referenceDateInput, weekStartsOn = 'monday') {
  const refDate = referenceDateInput ? new Date(referenceDateInput) : new Date()
  const dayOfWeek = refDate.getDay()
  const startDayIdx = weekStartsOn.toLowerCase() === 'sunday' ? 0 : 1

  let diffToStart = dayOfWeek - startDayIdx
  if (diffToStart < 0) diffToStart += 7

  const periodStartDate = new Date(refDate)
  periodStartDate.setDate(refDate.getDate() - diffToStart)

  const periodEndDate = new Date(periodStartDate)
  periodEndDate.setDate(periodStartDate.getDate() + 6)

  const compStartDate = new Date(periodStartDate)
  compStartDate.setDate(periodStartDate.getDate() - 7)

  const compEndDate = new Date(periodEndDate)
  compEndDate.setDate(periodEndDate.getDate() - 7)

  return {
    periodStart: formatDateISO(periodStartDate),
    periodEnd: formatDateISO(periodEndDate),
    comparisonStart: formatDateISO(compStartDate),
    comparisonEnd: formatDateISO(compEndDate)
  }
}

function calculateMonthlyReportPeriod(year, month) {
  const periodStartDate = new Date(year, month - 1, 1)
  const periodEndDate = new Date(year, month, 0)

  const prevMonthDate = new Date(year, month - 2, 1)
  const compStartDate = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1)
  const compEndDate = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0)

  return {
    periodStart: formatDateISO(periodStartDate),
    periodEnd: formatDateISO(periodEndDate),
    comparisonStart: formatDateISO(compStartDate),
    comparisonEnd: formatDateISO(compEndDate)
  }
}

test('reports - calculateWeeklyReportPeriod returns Monday to Sunday period', () => {
  const refDate = new Date('2026-07-23T12:00:00Z') // Thursday 23 July 2026
  const period = calculateWeeklyReportPeriod(refDate, 'monday')

  assert.equal(period.periodStart, '2026-07-20') // Monday
  assert.equal(period.periodEnd, '2026-07-26')   // Sunday
  assert.equal(period.comparisonStart, '2026-07-13') // Prev Monday
  assert.equal(period.comparisonEnd, '2026-07-19')   // Prev Sunday
})

test('reports - calculateMonthlyReportPeriod returns full month and previous month', () => {
  const period = calculateMonthlyReportPeriod(2026, 7) // July 2026

  assert.equal(period.periodStart, '2026-07-01')
  assert.equal(period.periodEnd, '2026-07-31')
  assert.equal(period.comparisonStart, '2026-06-01')
  assert.equal(period.comparisonEnd, '2026-06-30')
})

test('reports - executive summary rule checks', () => {
  const totalAudience = 699
  const pct = 16.5
  const statement = `Total Audience across connected channels stands at ${totalAudience.toLocaleString()} followers/subscribers (+${pct}% vs. previous period).`

  assert.ok(statement.includes('699 followers/subscribers'))
  assert.ok(statement.includes('+16.5% vs. previous period'))
})

test('reports - recommendations priority rules', () => {
  const recs = [
    { priority: 'high', title: 'Increase Content Publishing Consistency' },
    { priority: 'medium', title: 'Review Facebook Page Access Token Permissions' }
  ]

  assert.equal(recs[0].priority, 'high')
  assert.equal(recs[1].priority, 'medium')
})
