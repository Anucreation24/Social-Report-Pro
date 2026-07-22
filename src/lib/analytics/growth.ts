import { GrowthComparisonResult } from './types'

/**
 * Calculates absolute and percentage growth between a current period value and a previous period value.
 * Never throws or returns NaN / Infinity.
 */
export function calculateGrowth(
  currentVal: number | null | undefined,
  prevVal: number | null | undefined
): GrowthComparisonResult {
  const current = currentVal === null || currentVal === undefined || isNaN(currentVal) ? 0 : currentVal
  const previous = prevVal === null || prevVal === undefined || isNaN(prevVal) ? null : prevVal

  if (previous === null) {
    return {
      currentValue: current,
      previousValue: 0,
      absoluteChange: current,
      percentageChange: 0,
      isPositive: current >= 0,
      isZeroBaseline: true,
      isUnavailable: true
    }
  }

  const absoluteChange = current - previous

  if (previous === 0) {
    return {
      currentValue: current,
      previousValue: 0,
      absoluteChange: current,
      percentageChange: current > 0 ? 100 : 0,
      isPositive: current >= 0,
      isZeroBaseline: true,
      isUnavailable: false
    }
  }

  const percentageChange = parseFloat(((absoluteChange / Math.abs(previous)) * 100).toFixed(1))

  return {
    currentValue: current,
    previousValue: previous,
    absoluteChange,
    percentageChange,
    isPositive: absoluteChange >= 0,
    isZeroBaseline: false,
    isUnavailable: false
  }
}
