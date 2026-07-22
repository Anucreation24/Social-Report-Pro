import { NormalizedMetricName } from './types'

export interface DbSnapshotRow {
  snapshot_date: string
  metric_name: NormalizedMetricName
  metric_value: number
  aggregation_level: string
  provider: string
  social_account_id?: string
}

// Metrics that represent point-in-time totals (should use latest snapshot value in range, not sum)
const pointInTimeMetrics: Set<NormalizedMetricName> = new Set(['audience_total'])

/**
 * Aggregates a list of database snapshot rows for a specific metric over a date range.
 * For point-in-time metrics (like audience_total), takes the latest snapshot value.
 * For cumulative metrics (like impressions, reach, views), sums up daily snapshot values.
 */
export function aggregateMetricSnapshots(
  rows: DbSnapshotRow[],
  metricName: NormalizedMetricName
): number {
  const filtered = rows.filter(r => r.metric_name === metricName)
  if (filtered.length === 0) return 0

  if (pointInTimeMetrics.has(metricName)) {
    // Sort by snapshot_date descending and return the latest value
    const sorted = [...filtered].sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date))
    return sorted[0].metric_value
  }

  // Sum daily cumulative metric values
  return filtered.reduce((sum, r) => sum + (r.metric_value || 0), 0)
}

/**
 * Aggregates all metrics present in the rows into a key-value dictionary.
 */
export function aggregateAllMetrics(
  rows: DbSnapshotRow[]
): Record<NormalizedMetricName, number> {
  const metricNames = Array.from(new Set(rows.map(r => r.metric_name)))
  const result: Partial<Record<NormalizedMetricName, number>> = {}

  for (const name of metricNames) {
    result[name] = aggregateMetricSnapshots(rows, name)
  }

  return result as Record<NormalizedMetricName, number>
}
