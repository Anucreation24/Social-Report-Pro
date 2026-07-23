import { NormalizedMetricName } from './types'

export interface DbSnapshotRow {
  snapshot_date: string
  metric_name: NormalizedMetricName | string
  metric_value: number
  aggregation_level?: string
  provider: string
  social_account_id?: string
}

export interface ContentMetricDbRow {
  metric_date: string
  metric_name: string
  metric_value: number
  provider?: string
}

// Metrics that represent point-in-time totals (should use latest snapshot value in range, not sum)
const pointInTimeMetrics: Set<string> = new Set(['audience_total'])

/**
 * Aggregates a list of database snapshot rows for a specific metric over a date range.
 * For point-in-time metrics (like audience_total), takes the latest snapshot value.
 * For cumulative metrics (like impressions, reach, views), sums up daily snapshot values.
 */
export function aggregateMetricSnapshots(
  rows: DbSnapshotRow[],
  metricName: NormalizedMetricName | string
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
 * Aggregates content metrics for a specific metric name.
 * For engagements, if no explicit 'engagements' metric name is present, sums likes + comments + shares.
 */
export function aggregateContentMetricRows(
  rows: ContentMetricDbRow[],
  metricName: NormalizedMetricName | string
): number {
  if (metricName === 'engagements') {
    let directEngagements = 0
    let reactionsSum = 0
    for (const r of rows) {
      if (r.metric_name === 'engagements') {
        directEngagements += r.metric_value || 0
      } else if (r.metric_name === 'likes' || r.metric_name === 'comments' || r.metric_name === 'shares') {
        reactionsSum += r.metric_value || 0
      }
    }
    return Math.max(directEngagements, reactionsSum)
  }

  const filtered = rows.filter(r => r.metric_name === metricName)
  return filtered.reduce((sum, r) => sum + (r.metric_value || 0), 0)
}

/**
 * Aggregates combined metrics from analytics_snapshots AND content_metrics tables without double-counting.
 */
export function aggregateCombinedMetrics(
  snapshotRows: DbSnapshotRow[],
  contentMetricRows: ContentMetricDbRow[],
  metricName: NormalizedMetricName | string
): number {
  if (pointInTimeMetrics.has(metricName)) {
    return aggregateMetricSnapshots(snapshotRows, metricName)
  }

  const snapVal = aggregateMetricSnapshots(snapshotRows, metricName)
  const contentVal = aggregateContentMetricRows(contentMetricRows, metricName)

  return Math.max(snapVal, contentVal)
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
    (result as Record<string, number>)[name] = aggregateMetricSnapshots(rows, name as NormalizedMetricName)
  }

  return result as Record<NormalizedMetricName, number>
}
