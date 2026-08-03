/**
 * Social Report Pro — Dynamic PDF Layout & Pagination Engine
 * 
 * Provides height estimation, section break calculation, and structural page rules for @react-pdf/renderer.
 */

export interface ComponentLayoutProps {
  estimatedHeight: number
  keepTogether: boolean
  allowPageBreakBefore: boolean
  repeatHeader?: boolean
}

export const A4_PAGE_HEIGHT_PT = 841.89 // Standard A4 height in points
export const HEADER_HEIGHT_PT = 60
export const FOOTER_HEIGHT_PT = 36
export const PAGE_TOP_MARGIN_PT = 84
export const PAGE_BOTTOM_MARGIN_PT = 48
export const USABLE_PAGE_HEIGHT_PT = A4_PAGE_HEIGHT_PT - PAGE_TOP_MARGIN_PT - PAGE_BOTTOM_MARGIN_PT // ~710 pt

/**
 * Estimates height for text blocks based on line count and font size.
 */
export function estimateTextHeight(text: string, fontSize: number = 9, containerWidthPt: number = 520): number {
  if (!text) return 0
  const avgCharWidth = fontSize * 0.5
  const charsPerLine = Math.floor(containerWidthPt / avgCharWidth) || 60
  const lines = Math.ceil(text.length / charsPerLine) || 1
  const lineHeight = fontSize * 1.3
  return Math.max(lines * lineHeight + 4, fontSize * 1.5)
}

/**
 * Estimates height of table rows.
 */
export function estimateTableRowHeight(cellTextLength: number): number {
  return Math.max(22, Math.ceil(cellTextLength / 40) * 14)
}

/**
 * Calculates whether a section needs an explicit page break before rendering.
 */
export function shouldBreakBefore(
  currentAccumulatedHeight: number,
  nextSectionHeight: number,
  usableHeight: number = USABLE_PAGE_HEIGHT_PT
): boolean {
  const currentPageUsage = currentAccumulatedHeight % usableHeight
  const remainingSpace = usableHeight - currentPageUsage
  return nextSectionHeight > remainingSpace && remainingSpace < 120
}
