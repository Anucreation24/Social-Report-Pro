import Papa from 'papaparse'
import ExcelJS from 'exceljs'
import { FieldMapping } from './column-mapping'

export interface ParsedFileResult {
  fileName: string
  fileSizeBytes: number
  sheets: string[]
  selectedSheet: string
  headers: string[]
  rows: Record<string, string | number | null>[]
  totalRows: number
}

export interface NormalizedRowResult {
  rowNumber: number
  sourceData: Record<string, unknown>
  normalizedData: Record<string, unknown>
  status: 'valid' | 'warning' | 'invalid'
  errors: string[]
  warnings: string[]
  duplicateKey?: string
  isDerivedEngagement?: boolean
  derivedFrom?: string[]
  missingYearDetected?: boolean
}

/**
 * Validates basic file metadata before parsing.
 */
export function validateFileMetadata(file: { name: string; size: number; type?: string }): { valid: boolean; error?: string } {
  if (!file) return { valid: false, error: 'No file provided.' }
  if (file.size === 0) return { valid: false, error: 'Uploaded file is empty (0 bytes).' }
  if (file.size > 10 * 1024 * 1024) return { valid: false, error: 'File size exceeds 10 MB limit.' }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'csv' && ext !== 'xlsx') {
    return { valid: false, error: 'Unsupported file format. Please upload a CSV or XLSX file.' }
  }

  return { valid: true }
}

/**
 * Parses raw CSV content from string or Buffer.
 */
export function parseCSVContent(contentString: string, fileName = 'upload.csv'): ParsedFileResult {
  const cleanContent = contentString.startsWith('\uFEFF') ? contentString.slice(1) : contentString

  const parsed = Papa.parse<Record<string, string>>(cleanContent, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: h => h.trim()
  })

  if (parsed.errors && parsed.errors.length > 0) {
    const fatalError = parsed.errors.find(e => e.type === 'Quotes' || e.type === 'FieldMismatch')
    if (fatalError) {
      console.warn('CSV parsing warnings/errors:', parsed.errors)
    }
  }

  const headers = parsed.meta.fields || []
  const rows = (parsed.data || []) as Record<string, string | number | null>[]

  return {
    fileName,
    fileSizeBytes: Buffer.byteLength(cleanContent, 'utf8'),
    sheets: ['Sheet1'],
    selectedSheet: 'Sheet1',
    headers,
    rows,
    totalRows: rows.length
  }
}

/**
 * Parses raw XLSX Buffer using ExcelJS.
 */
export async function parseXLSXBuffer(buffer: Buffer, fileName = 'upload.xlsx', sheetName?: string): Promise<ParsedFileResult> {
  const workbook = new ExcelJS.Workbook()
  
  try {
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0])
  } catch (err: unknown) {
    const msg = (err as Error).message || ''
    if (msg.includes('encrypted') || msg.includes('password')) {
      throw new Error('Password-protected Excel workbooks are not supported.')
    }
    throw new Error(`Corrupted or invalid Excel file: ${msg}`)
  }

  const sheetNames = workbook.worksheets.map(w => w.name)
  if (sheetNames.length === 0) {
    throw new Error('Workbook contains no visible worksheets.')
  }

  const targetSheetName = sheetName && sheetNames.includes(sheetName) ? sheetName : sheetNames[0]
  const worksheet = workbook.getWorksheet(targetSheetName)

  if (!worksheet) {
    throw new Error(`Worksheet '${targetSheetName}' not found.`)
  }

  const headers: string[] = []
  const rows: Record<string, string | number | null>[] = []

  let headerRowIndex = 1
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (headers.length === 0 && rowNumber <= 5) {
      const values = Array.isArray(row.values) ? row.values.slice(1) : []
      const stringValues = values.map(v => (v !== null && v !== undefined ? String(v).trim() : ''))
      if (stringValues.some(v => v.length > 0)) {
        headerRowIndex = rowNumber
        stringValues.forEach((v, idx) => headers.push(v || `Column_${idx + 1}`))
      }
    }
  })

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRowIndex) return
    const rowObj: Record<string, string | number | null> = {}
    const values = Array.isArray(row.values) ? row.values.slice(1) : []

    headers.forEach((h, idx) => {
      const rawVal = values[idx]
      if (rawVal !== undefined && rawVal !== null) {
        if (typeof rawVal === 'object' && 'result' in rawVal) {
          rowObj[h] = (rawVal as { result: string | number }).result
        } else if (typeof rawVal === 'object' && 'text' in rawVal) {
          rowObj[h] = (rawVal as { text: string }).text
        } else if (rawVal instanceof Date) {
          rowObj[h] = rawVal.toISOString().split('T')[0]
        } else {
          rowObj[h] = rawVal as string | number
        }
      } else {
        rowObj[h] = null
      }
    })

    const hasData = Object.values(rowObj).some(v => v !== null && v !== '')
    if (hasData) {
      rows.push(rowObj)
    }
  })

  return {
    fileName,
    fileSizeBytes: buffer.length,
    sheets: sheetNames,
    selectedSheet: targetSheetName,
    headers,
    rows,
    totalRows: rows.length
  }
}

/**
 * Normalizes numeric strings, percentages, and multipliers (1.2K -> 1200, 3.4M -> 3400000).
 */
export function normalizeNumericValue(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return isNaN(val) ? null : val

  const str = String(val).trim()
  if (str === '-' || str === 'N/A' || str === 'null' || str === 'undefined') return null

  // Time format: HH:MM:SS or MM:SS
  const timeParts = str.split(':')
  if (timeParts.length === 2 || timeParts.length === 3) {
    const numbers = timeParts.map(p => parseFloat(p))
    if (numbers.every(n => !isNaN(n))) {
      if (numbers.length === 2) return numbers[0] * 60 + numbers[1]
      if (numbers.length === 3) return numbers[0] * 3600 + numbers[1] * 60 + numbers[2]
    }
  }

  let multiplier = 1
  let cleanStr = str.replace(/[,$\u20AC\u00A3]/g, '')

  if (cleanStr.endsWith('K')) {
    multiplier = 1000
    cleanStr = cleanStr.slice(0, -1)
  } else if (cleanStr.endsWith('M')) {
    multiplier = 1000000
    cleanStr = cleanStr.slice(0, -1)
  } else if (cleanStr.endsWith('%')) {
    cleanStr = cleanStr.slice(0, -1)
  }

  const parsed = parseFloat(cleanStr)
  if (isNaN(parsed) || !isFinite(parsed)) return null

  return parsed * multiplier
}

const MONTH_NAMES: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11
}

export interface DateParseResult {
  date: string | null
  ambiguous: boolean
  missingYear?: boolean
  detectedFormat?: string
  error?: string
}

/**
 * Parses and normalizes dates (YYYY-MM-DD, ISO, DD/MM/YYYY, MM/DD/YYYY, Excel serial dates, MMMM D).
 * If year is missing (e.g. "October 1"), flags missingYear and uses selectedYear if supplied.
 */
export function parseAndNormalizeDate(
  val: unknown,
  preferredFormat: 'auto' | 'DMY' | 'MDY' = 'auto',
  selectedYear?: number
): DateParseResult {
  if (val === null || val === undefined || val === '') {
    return { date: null, ambiguous: false, error: 'Date is missing.' }
  }

  // 1. If already Date object or ISO string
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return { date: null, ambiguous: false, error: 'Invalid Date object.' }
    return { date: val.toISOString().split('T')[0], ambiguous: false }
  }

  // 2. Excel Serial Number (e.g. 46200)
  if (typeof val === 'number' && val > 30000 && val < 70000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30))
    const dateObj = new Date(excelEpoch.getTime() + val * 86400000)
    return { date: dateObj.toISOString().split('T')[0], ambiguous: false }
  }

  const str = String(val).trim()

  // 3. Check for MMMM D or D MMMM format missing year (e.g. "October 1", "Oct 1", "1 October")
  const alphaMatch1 = str.match(/^([A-Za-z]+)\s+(\d{1,2})$/)
  const alphaMatch2 = str.match(/^(\d{1,2})\s+([A-Za-z]+)$/)

  if (alphaMatch1 || alphaMatch2) {
    const monthStr = (alphaMatch1 ? alphaMatch1[1] : alphaMatch2![2]).toLowerCase()
    const day = parseInt(alphaMatch1 ? alphaMatch1[2] : alphaMatch2![1], 10)

    if (monthStr in MONTH_NAMES && day >= 1 && day <= 31) {
      const monthIdx = MONTH_NAMES[monthStr]
      if (selectedYear) {
        const d = new Date(Date.UTC(selectedYear, monthIdx, day))
        return { date: d.toISOString().split('T')[0], ambiguous: false, missingYear: false }
      }
      return {
        date: null,
        ambiguous: false,
        missingYear: true,
        detectedFormat: 'MMMM D',
        error: 'Please confirm reporting year.'
      }
    }
  }

  // 4. YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10)
    const m = parseInt(isoMatch[2], 10)
    const d = parseInt(isoMatch[3], 10)
    const dateObj = new Date(Date.UTC(y, m - 1, d))
    return { date: dateObj.toISOString().split('T')[0], ambiguous: false }
  }

  // 5. Slash / Dash formats: DD/MM/YYYY vs MM/DD/YYYY
  const slashedMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/)
  if (slashedMatch) {
    const num1 = parseInt(slashedMatch[1], 10)
    const num2 = parseInt(slashedMatch[2], 10)
    let year = parseInt(slashedMatch[3], 10)
    if (year < 100) year += 2000

    let day = num1
    let month = num2
    let isAmbiguous = false

    if (num1 <= 12 && num2 <= 12 && num1 !== num2) {
      isAmbiguous = true
      if (preferredFormat === 'MDY') {
        month = num1
        day = num2
      } else {
        day = num1
        month = num2
      }
    } else if (num1 > 12) {
      day = num1
      month = num2
    } else if (num2 > 12) {
      month = num1
      day = num2
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return { date: null, ambiguous: false, error: `Invalid day/month in date string '${str}'.` }
    }

    const dateObj = new Date(Date.UTC(year, month - 1, day))
    return { date: dateObj.toISOString().split('T')[0], ambiguous: isAmbiguous }
  }

  // Fallback Date.parse
  const timestamp = Date.parse(str)
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp)
    return { date: d.toISOString().split('T')[0], ambiguous: false }
  }

  return { date: null, ambiguous: false, error: `Unrecognized date format '${str}'.` }
}

/**
 * Normalizes a single row based on user's field mappings and validates constraints.
 * Supports partial metric acceptance, dynamic engagement derivation, and preserves null for missing metrics.
 */
export function normalizeAndValidateRow(
  row: Record<string, unknown>,
  rowNumber: number,
  mappings: FieldMapping[],
  companyId: string,
  platform: string,
  importType: string,
  dateFormatPreference: 'auto' | 'DMY' | 'MDY' = 'auto',
  selectedYear?: number
): NormalizedRowResult {
  const normalizedData: Record<string, unknown> = {}
  const errors: string[] = []
  const warnings: string[] = []
  let missingYearDetected = false

  mappings.forEach(m => {
    if (m.mappedField === 'ignore') return
    const rawVal = row[m.fileColumn]

    if (m.mappedField === 'date' || m.mappedField === 'published_at') {
      const parsedDate = parseAndNormalizeDate(rawVal, dateFormatPreference, selectedYear)
      if (parsedDate.missingYear) {
        missingYearDetected = true
        errors.push(`Column '${m.fileColumn}' date '${rawVal}' is missing year. Please confirm reporting year.`)
      } else if (parsedDate.error) {
        errors.push(`Column '${m.fileColumn}': ${parsedDate.error}`)
      } else {
        normalizedData[m.mappedField] = parsedDate.date
        if (parsedDate.ambiguous) {
          warnings.push(`Column '${m.fileColumn}' date '${rawVal}' is ambiguous (interpreted as ${parsedDate.date}).`)
        }
      }
    } else if (m.mappedField === 'content_id' || m.mappedField === 'title' || m.mappedField === 'caption' || m.mappedField === 'content_type' || m.mappedField === 'permalink') {
      normalizedData[m.mappedField] = rawVal !== null && rawVal !== undefined ? String(rawVal).trim() : null
    } else {
      // Numeric KPI fields - preserve null if missing (DO NOT convert to 0)
      const numVal = normalizeNumericValue(rawVal)
      if (rawVal !== null && rawVal !== undefined && rawVal !== '' && numVal === null) {
        errors.push(`Column '${m.fileColumn}' value '${rawVal}' is not a valid number.`)
      } else {
        if (numVal !== null && numVal < 0 && m.mappedField !== 'audience_lost') {
          errors.push(`Column '${m.fileColumn}' metric cannot be negative (${numVal}).`)
        }

        if (m.mappedField === 'watch_time_seconds' && m.fileColumn.toLowerCase().includes('min')) {
          normalizedData[m.mappedField] = numVal !== null ? Math.round(numVal * 60) : null
        } else {
          normalizedData[m.mappedField] = numVal
        }
      }
    }
  })

  // Engagement Derivation: engagements = likes + comments + shares if engagements column not present
  let isDerivedEngagement = false
  let derivedFrom: string[] | undefined = undefined

  const hasImportedEngagements = normalizedData.engagements !== undefined && normalizedData.engagements !== null
  const hasLikes = typeof normalizedData.likes === 'number'
  const hasComments = typeof normalizedData.comments === 'number'
  const hasShares = typeof normalizedData.shares === 'number'

  if (!hasImportedEngagements && (hasLikes || hasComments || hasShares)) {
    const l = (normalizedData.likes as number) || 0
    const c = (normalizedData.comments as number) || 0
    const s = (normalizedData.shares as number) || 0
    normalizedData.engagements = l + c + s
    isDerivedEngagement = true
    derivedFrom = ['likes', 'comments', 'shares']
  }

  // Check mandatory fields: At least one date or period and at least one metric/title
  if ((importType === 'account_summary' || importType === 'daily_overview') && !normalizedData.date) {
    if (!missingYearDetected) {
      errors.push('Row missing required date field.')
    }
  }
  if ((importType === 'content_performance' || importType === 'video_performance') && !normalizedData.published_at && !normalizedData.title) {
    errors.push('Content performance row missing required published_at date or title.')
  }

  // Verify at least one recognized metric or date exists
  const numericMetricKeys = ['audience_total', 'views', 'engagements', 'likes', 'comments', 'shares', 'profile_views', 'reach', 'impressions']
  const hasAnyMetric = numericMetricKeys.some(k => normalizedData[k] !== undefined && normalizedData[k] !== null)
  if (!hasAnyMetric && !normalizedData.date && !normalizedData.title) {
    errors.push('Row does not contain any recognized social metrics or dates.')
  }

  // Construct row duplicate key
  let duplicateKey = ''
  if (importType === 'account_summary' || importType === 'daily_overview') {
    duplicateKey = `${companyId}:${platform}:${normalizedData.date || 'nodate'}`
  } else {
    const provId = normalizedData.content_id || normalizedData.permalink || normalizedData.title || 'noid'
    duplicateKey = `${companyId}:${platform}:${normalizedData.published_at || 'nodate'}:${provId}`
  }

  const status = errors.length > 0 ? 'invalid' : warnings.length > 0 ? 'warning' : 'valid'

  return {
    rowNumber,
    sourceData: row,
    normalizedData,
    status,
    errors,
    warnings,
    duplicateKey,
    isDerivedEngagement,
    derivedFrom,
    missingYearDetected
  }
}

export function parseUnitValue(val: unknown): number | null {
  return normalizeNumericValue(val)
}

export function parseFlexibleDate(val: unknown, preferredFormat: 'auto' | 'DMY' | 'MDY' = 'auto', selectedYear?: number): string | null {
  return parseAndNormalizeDate(val, preferredFormat, selectedYear).date
}
