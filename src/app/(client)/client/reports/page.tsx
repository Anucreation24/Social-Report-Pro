'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useCompany } from '@/components/providers/CompanyProvider'
import { createClient } from '@/lib/supabase/client'
import { FileText, Loader2, Calendar, Download, Eye, CheckCircle2 } from 'lucide-react'

export default function ClientReportsPage() {
  const { activeCompany } = useCompany()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<Array<Record<string, unknown>>>([])

  const loadData = useCallback(async () => {
    if (!activeCompany) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('company_id', activeCompany.id)
        .order('created_at', { ascending: false })

      if (data) setReports(data as Array<Record<string, unknown>>)
    } catch (err: unknown) {
      console.error('Failed to load client reports:', err)
    } finally {
      setLoading(false)
    }
  }, [activeCompany, supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  if (!activeCompany) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Approved Client Reports</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Historical weekly and monthly performance reports for {activeCompany.name}.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-card border border-border/60 rounded-2xl p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">No Generated Reports Available</h3>
          <p className="text-xs text-muted-foreground">Your agency marketing manager has not published any client reports yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map(r => (
            <div key={String(r.id)} className="bg-card border border-border/60 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-border transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full capitalize">
                    {String(r.report_type)} Report
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Verified
                  </span>
                </div>

                <h3 className="font-bold text-base text-foreground leading-snug">{String(r.report_title || 'Performance Report')}</h3>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    Period: {new Date(String(r.period_start)).toLocaleDateString()} – {new Date(String(r.period_end)).toLocaleDateString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Version: {String(r.report_version || 'v1.0')}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                <Link
                  href={`/client/reports/${r.id}`}
                  className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 py-2 rounded-xl transition-colors"
                >
                  <Eye className="w-4 h-4" /> Open Report
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
