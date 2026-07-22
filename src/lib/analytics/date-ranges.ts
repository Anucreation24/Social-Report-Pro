import { DateRange, DateRangePreset } from './types'

/**
 * Formats a Date object to YYYY-MM-DD string format.
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns start and end dates (YYYY-MM-DD) for a given date range preset.
 */
export function getDateRange(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string,
  now: Date = new Date()
): DateRange {
  const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  if (preset === 'custom' && customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd, preset: 'custom' }
  }

  const endDateStr = formatDateToYYYYMMDD(utcNow)

  switch (preset) {
    case 'today':
      return { startDate: endDateStr, endDate: endDateStr, preset: 'today' }

    case 'yesterday': {
      const yesterday = new Date(utcNow)
      yesterday.setUTCDate(yesterday.getUTCDate() - 1)
      const yStr = formatDateToYYYYMMDD(yesterday)
      return { startDate: yStr, endDate: yStr, preset: 'yesterday' }
    }

    case 'last_7_days': {
      const start = new Date(utcNow)
      start.setUTCDate(start.getUTCDate() - 6)
      return { startDate: formatDateToYYYYMMDD(start), endDate: endDateStr, preset: 'last_7_days' }
    }

    case 'last_30_days': {
      const start = new Date(utcNow)
      start.setUTCDate(start.getUTCDate() - 29)
      return { startDate: formatDateToYYYYMMDD(start), endDate: endDateStr, preset: 'last_30_days' }
    }

    case 'current_week': {
      // Assuming week starts on Monday
      const dayOfWeek = utcNow.getUTCDay() // 0 = Sunday, 1 = Monday...
      const diff = (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
      const start = new Date(utcNow)
      start.setUTCDate(start.getUTCDate() - diff)
      return { startDate: formatDateToYYYYMMDD(start), endDate: endDateStr, preset: 'current_week' }
    }

    case 'previous_week': {
      const dayOfWeek = utcNow.getUTCDay()
      const diff = (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
      const end = new Date(utcNow)
      end.setUTCDate(end.getUTCDate() - diff - 1)
      const start = new Date(end)
      start.setUTCDate(start.getUTCDate() - 6)
      return {
        startDate: formatDateToYYYYMMDD(start),
        endDate: formatDateToYYYYMMDD(end),
        preset: 'previous_week'
      }
    }

    case 'current_month': {
      const start = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), 1))
      return { startDate: formatDateToYYYYMMDD(start), endDate: endDateStr, preset: 'current_month' }
    }

    case 'previous_month': {
      const start = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth() - 1, 1))
      const end = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), 0))
      return {
        startDate: formatDateToYYYYMMDD(start),
        endDate: formatDateToYYYYMMDD(end),
        preset: 'previous_month'
      }
    }

    default: {
      const start = new Date(utcNow)
      start.setUTCDate(start.getUTCDate() - 29)
      return { startDate: formatDateToYYYYMMDD(start), endDate: endDateStr, preset: 'last_30_days' }
    }
  }
}

/**
 * Returns the previous equivalent DateRange with the exact same duration in days.
 */
export function getPreviousEquivalentPeriod(range: DateRange): DateRange {
  const startMs = Date.parse(range.startDate)
  const endMs = Date.parse(range.endDate)

  if (isNaN(startMs) || isNaN(endMs)) {
    return { startDate: range.startDate, endDate: range.endDate }
  }

  const durationDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1)

  const prevEnd = new Date(startMs)
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1)

  const prevStart = new Date(prevEnd)
  prevStart.setUTCDate(prevStart.getUTCDate() - durationDays + 1)

  return {
    startDate: formatDateToYYYYMMDD(prevStart),
    endDate: formatDateToYYYYMMDD(prevEnd)
  }
}
