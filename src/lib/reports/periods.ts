/**
 * Reporting Period Utilities
 * Supports Weekly and Monthly date calculations with timezone awareness and weekStartsOn customization.
 */

export interface ReportPeriodRange {
  periodStart: string // YYYY-MM-DD
  periodEnd: string   // YYYY-MM-DD
  comparisonStart: string // YYYY-MM-DD
  comparisonEnd: string   // YYYY-MM-DD
  label: string
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Calculates Weekly Report period (current/selected week and previous equivalent week)
 */
export function calculateWeeklyReportPeriod(
  referenceDateInput?: string | Date,
  weekStartsOn: string = 'monday'
): ReportPeriodRange {
  const refDate = referenceDateInput
    ? typeof referenceDateInput === 'string'
      ? new Date(referenceDateInput)
      : new Date(referenceDateInput)
    : new Date()

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = refDate.getDay()

  // Target start day index (Monday = 1, Sunday = 0)
  const startDayIdx = weekStartsOn.toLowerCase() === 'sunday' ? 0 : 1

  // Calculate days since start of week
  let diffToStart = dayOfWeek - startDayIdx
  if (diffToStart < 0) {
    diffToStart += 7
  }

  const periodStartDate = new Date(refDate)
  periodStartDate.setDate(refDate.getDate() - diffToStart)
  periodStartDate.setHours(0, 0, 0, 0)

  const periodEndDate = new Date(periodStartDate)
  periodEndDate.setDate(periodStartDate.getDate() + 6)
  periodEndDate.setHours(23, 59, 59, 999)

  // Previous equivalent week
  const compStartDate = new Date(periodStartDate)
  compStartDate.setDate(periodStartDate.getDate() - 7)

  const compEndDate = new Date(periodEndDate)
  compEndDate.setDate(periodEndDate.getDate() - 7)

  const pStart = formatDateISO(periodStartDate)
  const pEnd = formatDateISO(periodEndDate)
  const cStart = formatDateISO(compStartDate)
  const cEnd = formatDateISO(compEndDate)

  return {
    periodStart: pStart,
    periodEnd: pEnd,
    comparisonStart: cStart,
    comparisonEnd: cEnd,
    label: `Weekly Report (${pStart} to ${pEnd})`
  }
}

/**
 * Calculates Monthly Report period (selected full calendar month and previous full calendar month)
 */
export function calculateMonthlyReportPeriod(
  yearInput?: number,
  monthInput?: number // 1-indexed (1 = Jan, 12 = Dec)
): ReportPeriodRange {
  const now = new Date()
  const year = yearInput ?? now.getFullYear()
  const month = monthInput ?? now.getMonth() + 1 // 1-12

  // Month start & end
  const periodStartDate = new Date(year, month - 1, 1)
  const periodEndDate = new Date(year, month, 0) // Last day of month

  // Previous month start & end
  const prevMonthDate = new Date(year, month - 2, 1)
  const compStartDate = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1)
  const compEndDate = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0)

  const pStart = formatDateISO(periodStartDate)
  const pEnd = formatDateISO(periodEndDate)
  const cStart = formatDateISO(compStartDate)
  const cEnd = formatDateISO(compEndDate)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const monthName = monthNames[month - 1] || 'Month'

  return {
    periodStart: pStart,
    periodEnd: pEnd,
    comparisonStart: cStart,
    comparisonEnd: cEnd,
    label: `${monthName} ${year} Monthly Report (${pStart} to ${pEnd})`
  }
}
