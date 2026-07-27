export type DataSourceType = 'api' | 'csv_import' | 'excel_import' | 'manual_entry' | 'system_rollup'

export interface ProvenanceRecord {
  id?: string
  company_id?: string
  provider?: string
  platform?: string
  snapshot_date?: string
  metric_date?: string
  metric_name: string
  metric_value: number
  data_source?: DataSourceType | string
  source_priority?: number
  import_batch_id?: string
  source_reference?: string
}

export const DATA_SOURCE_PRIORITIES: Record<DataSourceType, number> = {
  api: 1,
  csv_import: 2,
  excel_import: 2,
  manual_entry: 3,
  system_rollup: 4
}

export function getDataSourcePriority(source?: string | null): number {
  if (!source) return 1
  return DATA_SOURCE_PRIORITIES[source as DataSourceType] || 2
}

export function getDataSourceLabel(source?: string | null): string {
  switch (source) {
    case 'api':
      return 'Official API'
    case 'csv_import':
      return 'Imported CSV'
    case 'excel_import':
      return 'Imported Excel'
    case 'manual_entry':
      return 'Manual Entry'
    case 'system_rollup':
      return 'Derived Metric'
    default:
      return 'Official API'
  }
}

/**
 * Filters a list of snapshot rows so that for any duplicate key (platform + date + metric_name),
 * only the record with the highest-priority (lowest priority number) data source is retained.
 * Prevents double-counting between API, imported files, and manual entries!
 */
export function deduplicateMetricsBySourcePriority<T extends ProvenanceRecord>(rows: T[]): T[] {
  const selectedMap = new Map<string, T>()

  for (const row of rows) {
    const platform = row.provider || row.platform || 'unknown'
    const date = row.snapshot_date || row.metric_date || 'nodate'
    const key = `${platform}:${date}:${row.metric_name}`

    const rowPriority = row.source_priority ?? getDataSourcePriority(row.data_source)

    if (!selectedMap.has(key)) {
      selectedMap.set(key, row)
    } else {
      const existing = selectedMap.get(key)!
      const existingPriority = existing.source_priority ?? getDataSourcePriority(existing.data_source)

      if (rowPriority < existingPriority) {
        // Lower number = higher priority rank (1 > 2 > 3)
        selectedMap.set(key, row)
      }
    }
  }

  return Array.from(selectedMap.values())
}
