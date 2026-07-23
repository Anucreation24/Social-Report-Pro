'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCompany } from '@/components/providers/CompanyProvider'
import { createClient } from '@/lib/supabase/client'
import { getExportDownloadUrlAction, createReportRevisionAction, archiveReportAction } from '@/features/reports/actions'
import {
  FileText, Plus, Search, FileSpreadsheet, Loader2,
  RefreshCw, Archive, Eye
} from 'lucide-react'

interface GeneratedReportRow {
  id: string
  report_title: string
  report_type: string
  period_start: string
  period_end: string
  prepared_by: string
  generated_at: string
  status: string
  version_number: number
  included_platforms: string[]
  report_exports?: Array<{ id: string; export_type: string; file_name: string; status: string }>
}

export default function ReportsPage() {
  const { activeCompany } = useCompany()
  const companyId = activeCompany?.id

  const [reports, setReports] = useState<GeneratedReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadReports() {
      if (!companyId) return
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('generated_reports')
        .select(`
          id, report_title, report_type, period_start, period_end, prepared_by, generated_at, status, version_number, included_platforms,
          report_exports (id, export_type, file_name, status)
        `)
        .eq('company_id', companyId)
        .neq('status', 'archived')
        .order('generated_at', { ascending: false })

      if (!error && data) {
        setReports(data as unknown as GeneratedReportRow[])
      }
      setLoading(false)
    }

    loadReports()
  }, [companyId])

  const router = useRouter()

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

  const handleCreateRevision = async (reportId: string) => {
    setActionLoadingId(reportId)
    try {
      const res = await createReportRevisionAction(reportId)
      if (res.success) {
        router.push(`/reports/${res.reportId}`)
      }
    } catch (e) {
      console.error('Revision error:', e)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleArchiveReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to archive this report snapshot?')) return
    setActionLoadingId(reportId)
    try {
      await archiveReportAction(reportId)
      router.refresh()
    } catch (e) {
      console.error('Archive error:', e)
    } finally {
      setActionLoadingId(null)
    }
  }

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.report_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.prepared_by?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || r.report_type === typeFilter
    return matchesSearch && matchesType
  })

  if (!activeCompany) return null

  return (
    <div className="space-y-8">
      {/* Header & New Report Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Weekly & Monthly Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate, preview, and download custom marketing performance reports for <span className="font-semibold text-foreground">{activeCompany.name}</span>
          </p>
        </div>

        <Link
          href={`/reports/generate?companyId=${companyId}`}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm w-fit cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Generate New Report
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/80 border border-border/80 rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search report title..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-muted/40 border border-border/50 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 border border-border/50 rounded-xl self-stretch sm:self-auto">
          {[
            { id: 'all', label: 'All Reports' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                typeFilter === f.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Report History Table */}
      {loading ? (
        <div className="p-16 text-center bg-card/40 border border-border/40 rounded-2xl">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground font-medium">Loading report history...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-card border border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center py-20 bg-muted/10">
          <FileText className="w-12 h-12 text-muted-foreground/60 mb-3" />
          <h3 className="text-lg font-bold text-foreground">No Reports Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
            Compile professional PDF and Excel exports for your social media channels.
          </p>
          <Link
            href={`/reports/generate?companyId=${companyId}`}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Generate First Report
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="p-4">Report Title & Type</th>
                  <th className="p-4">Reporting Period</th>
                  <th className="p-4">Prepared By</th>
                  <th className="p-4">Generated Date</th>
                  <th className="p-4">Exports</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-medium">
                {filteredReports.map(report => {
                  const pdfExport = report.report_exports?.find(e => e.export_type === 'pdf')
                  const excelExport = report.report_exports?.find(e => e.export_type === 'xlsx')
                  const isActioning = actionLoadingId === report.id

                  return (
                    <tr key={report.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-foreground flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span>{report.report_title}</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            v{report.version_number || 1}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5 block">
                          {report.report_type} Report
                        </span>
                      </td>

                      <td className="p-4 text-muted-foreground">
                        {report.period_start} to {report.period_end}
                      </td>

                      <td className="p-4 text-foreground font-semibold">
                        {report.prepared_by || 'Marketing Department'}
                      </td>

                      <td className="p-4 text-muted-foreground">
                        {new Date(report.generated_at).toLocaleDateString()}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {pdfExport ? (
                            <button
                              onClick={() => handleDownloadExport(pdfExport.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold hover:bg-rose-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Download PDF"
                            >
                              <FileText className="w-3 h-3" />
                              PDF
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">No PDF</span>
                          )}

                          {excelExport ? (
                            <button
                              onClick={() => handleDownloadExport(excelExport.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Download Excel"
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              Excel
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">No Excel</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/reports/${report.id}`}
                            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            title="View Report Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            disabled={isActioning}
                            onClick={() => handleCreateRevision(report.id)}
                            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            title="Create Revision"
                          >
                            <RefreshCw className={`w-4 h-4 ${isActioning ? 'animate-spin' : ''}`} />
                          </button>

                          <button
                            disabled={isActioning}
                            onClick={() => handleArchiveReport(report.id)}
                            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                            title="Archive Report"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </div>
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
