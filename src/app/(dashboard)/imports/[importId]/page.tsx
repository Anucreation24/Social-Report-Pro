'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { getImportDetailAction } from '@/features/imports/actions'
import { 
  ArrowLeft, Download, Loader2, AlertCircle
} from 'lucide-react'

interface ImportDetailPageProps {
  params: Promise<{ importId: string }>
}

export default function ImportDetailPage({ params }: ImportDetailPageProps) {
  const resolvedParams = use(params)
  const importId = resolvedParams.importId

  const [batch, setBatch] = useState<Record<string, unknown> | null>(null)
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([])
  const [signedUrl, setSignedUrl] = useState<string>('#')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDetail() {
      if (!importId) return
      setLoading(true)
      setError(null)
      try {
        const res = await getImportDetailAction(importId)
        if (res && res.batch) {
          setBatch(res.batch as Record<string, unknown>)
          setRows(Array.isArray(res.rows) ? (res.rows as Array<Record<string, unknown>>) : [])
          setSignedUrl(res.signedUrl || '#')
        } else {
          setError('Import batch record not found.')
        }
      } catch (err: unknown) {
        console.error('Import detail load error:', err)
        setError((err as Error).message || 'Failed to load import detail.')
      } finally {
        setLoading(false)
      }
    }

    loadDetail()
  }, [importId])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (error || !batch) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12">
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Error</h4>
            <p className="mt-0.5">{error || 'Import batch not found.'}</p>
          </div>
        </div>
        <Link href="/imports" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Return to Import History
        </Link>
      </div>
    )
  }

  const batchIdStr = String(batch?.id || '').slice(0, 8)
  const platformStr = String(batch?.platform || 'unknown')
  const importTypeStr = String(batch?.import_type || 'account_summary').replace(/_/g, ' ')
  const fileNameStr = String(batch?.original_file_name || 'Manual Entry')
  const statusStr = String(batch?.status || 'pending')
  const importedRowsStr = String(batch?.imported_rows ?? 0)
  const totalRowsStr = String(batch?.total_rows ?? 0)
  const dateStr = batch?.created_at ? new Date(String(batch.created_at)).toLocaleString() : 'N/A'
  const safeRows = Array.isArray(rows) ? rows : []

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/imports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Import History
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Import Batch #{batchIdStr}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Platform: <span className="capitalize font-bold text-foreground">{platformStr}</span> | Type: <span className="capitalize font-bold text-foreground">{importTypeStr}</span>
          </p>
        </div>

        {signedUrl && signedUrl !== '#' && (
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 py-2 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" /> Download Original File
          </a>
        )}
      </div>

      {/* Batch Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border/60 rounded-xl space-y-1">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Original File</span>
          <span className="block font-mono text-xs font-bold text-foreground truncate">{fileNameStr}</span>
        </div>
        <div className="p-4 bg-card border border-border/60 rounded-xl space-y-1">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Status</span>
          <span className="block font-bold text-emerald-500 capitalize text-xs">{statusStr}</span>
        </div>
        <div className="p-4 bg-card border border-border/60 rounded-xl space-y-1">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Imported Rows</span>
          <span className="block text-base font-extrabold text-foreground">{importedRowsStr} / {totalRowsStr}</span>
        </div>
        <div className="p-4 bg-card border border-border/60 rounded-xl space-y-1">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Import Date</span>
          <span className="block text-xs font-semibold text-foreground">{dateStr}</span>
        </div>
      </div>

      {/* Parsed Staging Rows Table */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-foreground">Staged Row Audit Records ({safeRows.length})</h3>

        {safeRows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No row-level audit logs recorded for this batch.</p>
        ) : (
          <div className="overflow-x-auto max-h-96 border border-border/40 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border/40 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-2.5">Row #</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Duplicate Key</th>
                  <th className="p-2.5">Normalized Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                {safeRows.map((r, idx) => (
                  <tr key={String(r?.id || `row-${idx}`)} className="hover:bg-muted/20">
                    <td className="p-2.5 font-bold text-foreground">{String(r?.row_number ?? '-')}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r?.validation_status === 'valid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {String(r?.validation_status || 'unknown')}
                      </span>
                    </td>
                    <td className="p-2.5 text-muted-foreground">{String(r?.duplicate_key || '-')}</td>
                    <td className="p-2.5 text-foreground max-w-md truncate">
                      {JSON.stringify(r?.normalized_data || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
