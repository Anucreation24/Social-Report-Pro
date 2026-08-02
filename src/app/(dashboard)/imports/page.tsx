'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useCompany } from '@/components/providers/CompanyProvider'
import { getImportHistoryAction, archiveImportBatchAction } from '@/features/imports/actions'
import { 
  FileSpreadsheet, Plus, Filter, Loader2, AlertCircle, CheckCircle2, 
  Trash2, Eye
} from 'lucide-react'

interface ImportBatchRow {
  id: string
  company_id: string
  platform: string
  import_type: string
  source_type: string
  reporting_period_start: string | null
  reporting_period_end: string | null
  original_file_name: string | null
  file_size_bytes: number | null
  status: string
  total_rows: number
  valid_rows: number
  invalid_rows: number
  imported_rows: number
  imported_by: string | null
  imported_at: string | null
  created_at: string
}

export default function ImportHistoryPage() {
  const { activeCompany } = useCompany()

  const [batches, setBatches] = useState<ImportBatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [platformFilter, setPlatformFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    if (!activeCompany?.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getImportHistoryAction(activeCompany.id, platformFilter)
      setBatches(Array.isArray(data) ? (data as unknown as ImportBatchRow[]) : [])
    } catch (err: unknown) {
      console.error('Failed to fetch import history:', err)
      setError((err as Error).message || 'Failed to load import history.')
      setBatches([])
    } finally {
      setLoading(false)
    }
  }, [activeCompany, platformFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory()
  }, [fetchHistory])

  const handleArchive = async (batchId: string) => {
    if (!batchId) return
    if (!confirm('Are you sure you want to archive this import batch?')) return
    setArchivingId(batchId)
    try {
      const res = await archiveImportBatchAction(batchId)
      if (res && res.success) {
        fetchHistory()
      } else if (res && res.error) {
        setError(res.error)
      }
    } catch (err: unknown) {
      console.error('Archive error:', err)
      setError((err as Error).message || 'Failed to archive batch.')
    } finally {
      setArchivingId(null)
    }
  }

  if (!activeCompany) {
    return (
      <div className="space-y-6 py-12 text-center">
        <div className="p-8 bg-card border border-border/60 rounded-2xl space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <h3 className="text-base font-bold text-foreground">Loading Workspace Context...</h3>
          <p className="text-xs text-muted-foreground">Preparing Import History for your active company.</p>
        </div>
      </div>
    )
  }

  const safeBatches = Array.isArray(batches) ? batches : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Data Import History</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Audit logs of CSV/Excel file imports and manual KPI entries for {activeCompany?.name || 'Workspace'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/manual-entry/new"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/60 transition-colors"
          >
            <Plus className="w-4 h-4 text-blue-400" /> Enter Manually
          </Link>
          <Link
            href="/imports/new"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
          >
            <Plus className="w-4 h-4" /> Import File
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-card border border-border/60 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <Filter className="w-4 h-4 text-primary" /> Filter Platform:
        </div>
        <div className="flex items-center gap-2">
          {['all', 'facebook', 'instagram', 'youtube', 'tiktok'].map(p => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                platformFilter === p
                  ? 'bg-primary/10 border border-primary text-primary'
                  : 'bg-muted/40 border border-border/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Error</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : safeBatches.length === 0 ? (
        <div className="bg-card border border-border/60 rounded-2xl p-12 text-center space-y-3">
          <FileSpreadsheet className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">No Import Batches Recorded</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            You haven&apos;t uploaded any CSV/Excel reports or manual KPI entries yet.
          </p>
          <Link
            href="/imports/new"
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl transition-colors mt-2"
          >
            <Plus className="w-4 h-4" /> Upload First File
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border/40 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Platform</th>
                  <th className="p-3.5">Source & Type</th>
                  <th className="p-3.5">File Name / Ref</th>
                  <th className="p-3.5">Imported Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Rows</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {safeBatches.map((b, idx) => {
                  const platformStr = String(b?.platform || 'unknown')
                  const sourceTypeStr = String(b?.source_type || 'csv_import').replace(/_/g, ' ')
                  const importTypeStr = String(b?.import_type || 'account_summary').replace(/_/g, ' ')
                  const fileNameStr = b?.original_file_name || 'Manual Entry'
                  const dateStr = b?.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A'

                  return (
                    <tr key={b?.id || `batch-${idx}`} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 capitalize font-bold text-foreground">{platformStr}</td>
                      <td className="p-3.5">
                        <span className="capitalize font-semibold text-foreground">{sourceTypeStr}</span>
                        <span className="block text-[10px] text-muted-foreground">{importTypeStr}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-xs text-foreground">{fileNameStr}</span>
                        {typeof b?.file_size_bytes === 'number' && (
                          <span className="block text-[10px] text-muted-foreground">{(b.file_size_bytes / 1024).toFixed(1)} KB</span>
                        )}
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {dateStr}
                      </td>
                      <td className="p-3.5">
                        {b?.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        ) : b?.status === 'partially_completed' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            Partial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-foreground">{b?.imported_rows ?? 0}</span> / {b?.total_rows ?? 0}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {b?.id && (
                          <Link
                            href={`/imports/${b.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/60 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect
                          </Link>
                        )}
                        {b?.id && (
                          <button
                            onClick={() => handleArchive(b.id)}
                            disabled={archivingId === b.id}
                            className="p-1 text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                            title="Archive batch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
