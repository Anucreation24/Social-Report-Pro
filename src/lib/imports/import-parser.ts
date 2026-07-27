import Papa from 'papaparse'
import ExcelJS from 'exceljs'
import { FieldMapping, NormalizedField } from './column-mapping'

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
  // Strip BOM if present
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
    await workbook.xlsx.load(buffer as any)
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

  // Read header row (Row 1)
  const firstRow = worksheet.getRow(1)
  firstRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const headerVal = String(cell.value || `Column_${colNumber}`).trim()
    headers.push(headerVal)
  })

  if (headers.length === 0) {
    throw new Error('No header columns found in Row 1 of worksheet.')
  }

  // Read data rows starting from Row 2
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return // skip header

    const rowObj: Record<string, string | number | null> = {}
    let hasData = false

    headers.forEach((header, idx) => {
      const cell = row.getCell(idx + 1)
      let val: string | number | null = null

      if (cell.value !== null && cell.value !== undefined) {
        if (typeof cell.value === 'object') {
          // Handle Excel formula, result, or rich text
          if ('result' in cell.value) {
            val = (cell.value as { result?: string | number }).result ?? null
          } else if ('text' in cell.value) {
            val = (cell.value as { text?: string }).text ?? null
          } else if (cell.value instanceof Date) {
            val = cell.value.toISOString().split('T')[0]
          } else {
            val = String(cell.value)
          }
        } else {
          val = cell.value as string | number
        }
      }

      if (val !== null && String(val).trim() !== '') {
        hasData = true
      }
      rowObj[header] = val
    })

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
 * Normalizes compact strings like "1.2K", "3.4M", "1,250", "15.4%" into numbers.
 */
export function normalizeNumericValue(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) return null
    return val
  }

  const str = String(val).trim().toUpperCase()
  if (str === '') return null

  // Compact notation: 1.2K -> 1200, 3.4M -> 3400000
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

/**
 * Parses and normalizes dates (YYYY-MM-DD, ISO, DD/MM/YYYY, MM/DD/YYYY, Excel serial dates).
 * Returns dateString and ambiguous warning flag.
 */
export function parseAndNormalizeDate(val: unknown, preferredFormat: 'auto' | 'DMY' | 'MDY' = 'auto'): { date: string | null; ambiguous: boolean; error?: string } {
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

  // 3. YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10)
    const m = parseInt(isoMatch[2], 10)
    const d = parseInt(isoMatch[3], 10)
    const dateObj = new Date(Date.UTC(y, m - 1, d))
    return { date: dateObj.toISOString().split('T')[0], ambiguous: false }
  }

  // 4. Slash / Dash formats: DD/MM/YYYY vs MM/DD/YYYY
  const slashedMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/)
  if (slashedMatch) {
    const num1 = parseInt(slashedMatch[1], 10)
    const num2 = parseInt(slashedMatch[2], 10)
    let year = parseInt(slashedMatch[3], 10)
    if (year < 100) year += 2000

    let day = num1
    let month = num2
    let isAmbiguous = false

    // Ambiguous if both <= 12 and different
    if (num1 <= 12 && num2 <= 12 && num1 !== num2) {
      isAmbiguous = true
      if (preferredFormat === 'MDY') {
        month = num1
        day = num2
      } else {
        // Default DMY (DD/MM/YYYY)
        day = num1
        month = num2
      }
    } else if (num1 > 12) {
      // First number > 12 -> must be DD/MM/YYYY
      day = num1
      month = num2
    } else if (num2 > 12) {
      // Second number > 12 -> must be MM/DD/YYYY
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
 */
export function normalizeAndValidateRow(
  row: Record<string, unknown>,
  rowNumber: number,
  mappings: FieldMapping[],
  companyId: string,
  platform: string,
  importType: string,
  dateFormatPreference: 'auto' | 'DMY' | 'MDY' = 'auto'
): NormalizedRowResult {
  const normalizedData: Record<string, unknown> = {}
  const errors: string[] = []
  const warnings: string[] = []

  mappings.forEach(m => {
    if (m.mappedField === 'ignore') return
    const rawVal = row[m.fileColumn]

    if (m.mappedField === 'date' || m.mappedField === 'published_at') {
      const parsedDate = parseAndNormalizeDate(rawVal, dateFormatPreference)
      if (parsedDate.error) {
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
      // Numeric KPI fields
      const numVal = normalizeNumericValue(rawVal)
      if (rawVal !== null && rawVal !== undefined && rawVal !== '' && numVal === null) {
        errors.push(`Column '${m.fileColumn}' value '${rawVal}' is not a valid number.`)
      } else {
        if (numVal !== null && numVal < 0 && m.mappedField !== 'audience_lost') {
          errors.push(`Column '${m.fileColumn}' metric cannot be negative (${numVal}).`)
        }

        // Special unit conversion: watch_time_seconds if raw header indicated minutes
        if (m.mappedField === 'watch_time_seconds' && m.fileColumn.toLowerCase().includes('min')) {
          normalizedData[m.mappedField] = numVal !== null ? Math.round(numVal * 60) : null
        } else {
          normalizedData[m.mappedField] = numVal
        }
      }
    }
  })

  // Check mandatory fields
  if (importType === 'account_summary' && !normalizedData.date) {
    errors.push('Row missing required date field.')
  }
  if (importType === 'content_performance' && !normalizedData.published_at && !normalizedData.title) {
    errors.push('Content performance row missing required published_at date or title.')
  }

  // Construct row duplicate key
  let duplicateKey = ''
  if (importType === 'account_summary') {
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
    duplicateKey
  }
}

export function parseUnitValue(val: unknown): number | null {
  return normalizeNumericValue(val)
}

export function parseFlexibleDate(val: unknown, preferredFormat: 'auto' | 'DMY' | 'MDY' = 'auto'): string | null {
  return parseAndNormalizeDate(val, preferredFormat).date
}
