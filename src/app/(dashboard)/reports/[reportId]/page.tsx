'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GeneratedReportSnapshot } from '@/lib/reports/types'
import { ReportPreview } from '@/components/reports/ReportPreview'
import { getExportDownloadUrlAction, createReportRevisionAction, archiveReportAction } from '@/features/reports/actions'
import {
  ArrowLeft, FileText, FileSpreadsheet, RefreshCw, Archive, Loader2,
  CheckCircle2, AlertCircle
} from 'lucide-react'

interface ReportDetailPageProps {
  params: Promise<{ reportId: string }>
}

export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  const resolvedParams = use(params)
  const reportId = resolvedParams.reportId
  const router = useRouter()

  const [snapshot, setSnapshot] = useState<GeneratedReportSnapshot | null>(null)
  const [reportMeta, setReportMeta] = useState<Record<string, unknown> | null>(null)
  const [exportsList, setExportsList] = useState<Array<{ id: string; export_type: string; file_name: string; status: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    async function loadReportDetails() {
      setLoading(true)
      const supabase = createClient()

      const { data: reportRow, error: fetchErr } = await supabase
        .from('generated_reports')
        .select(`
          *,
          report_exports (*)
        `)
        .eq('id', reportId)
        .single()

      if (fetchErr || !reportRow) {
        setError(`Report not found: ${fetchErr?.message || 'Invalid ID'}`)
        setLoading(false)
        return
      }

      setReportMeta(reportRow as Record<string, unknown>)
      setExportsList((reportRow.report_exports || []) as Array<{ id: string; export_type: string; file_name: string; status: string }>)
      if (reportRow.report_data) {
        setSnapshot(reportRow.report_data as unknown as GeneratedReportSnapshot)
      }
      setLoading(false)
    }

    loadReportDetails()
  }, [reportId])

  const handleDownloadExport = async (exportId: string) => {
    try {
      const res = await getExportDownloadUrlAction(exportId)
      if (res.signedUrl && res.signedUrl !== '#') {
        window.open(res.signedUrl, '_blank')
      }
    } catch (e) {
      console.error('Download error:', e)
    }
  }

  const handleCreateRevision = async () => {
    setActionLoading(true)
    try {
      const res = await createReportRevisionAction(reportId)
      if (res.success) {
        router.push(`/reports/${res.reportId}`)
      }
    } catch (e: unknown) {
      console.error('Revision error:', e)
      setError((e as Error).message || 'Failed to create revision')
    } finally {
      setActionLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this report snapshot?')) return
    setActionLoading(true)
    try {
      await archiveReportAction(reportId)
      router.push('/reports')
    } catch (e: unknown) {
      console.error('Archive error:', e)
      setError((e as Error).message || 'Failed to archive report')
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-16 text-center bg-card/40 border border-border/40 rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
        <p className="text-xs text-muted-foreground font-medium">Loading report snapshot...</p>
      </div>
    )
  }

  if (error || !snapshot) {
    return (
      <div className="p-12 text-center bg-card border border-border/60 rounded-2xl space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-foreground">Report Snapshot Unavailable</h3>
        <p className="text-xs text-muted-foreground">{error || 'Unable to render report snapshot.'}</p>
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Reports
        </Link>
      </div>
    )
  }

  const pdfExport = exportsList.find(e => e.export_type === 'pdf')
  const excelExport = exportsList.find(e => e.export_type === 'xlsx')

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link href="/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Report History
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">{snapshot.report.title}</h1>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              v{snapshot.report.versionNumber || 1}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Period: <span className="font-semibold text-foreground">{snapshot.report.periodStart} to {snapshot.report.periodEnd}</span> | Prepared By: {snapshot.report.preparedBy}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {pdfExport && (
            <button
              onClick={() => handleDownloadExport(pdfExport.id)}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Download PDF
            </button>
          )}

          {excelExport && (
            <button
              onClick={() => handleDownloadExport(excelExport.id)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download Excel
            </button>
          )}

          <button
            disabled={actionLoading}
            onClick={handleCreateRevision}
            className="bg-card hover:bg-muted border border-border/80 text-foreground text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Create new version revision"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            Create Revision
          </button>

          <button
            disabled={actionLoading}
            onClick={handleArchive}
            className="bg-card hover:bg-rose-500/10 border border-border/80 hover:border-rose-500/30 text-muted-foreground hover:text-rose-500 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Archive report"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Immutable Snapshot Warning Banner */}
      <div className="p-4 bg-muted/30 border border-border/40 rounded-2xl flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>This is an immutable report snapshot generated on <strong className="text-foreground">{new Date(snapshot.report.generatedAt).toLocaleString()}</strong>.</span>
        </div>
        {Boolean(reportMeta?.revision_of) && (
          <span className="font-semibold text-primary">Revision of previous version</span>
        )}
      </div>

      {/* Report Document Preview */}
      <ReportPreview snapshot={snapshot} />
    </div>
  )
}
