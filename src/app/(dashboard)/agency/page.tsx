'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Building2, Users, FileText, Activity, AlertCircle, CheckCircle2, 
  ChevronRight, Plus, RefreshCw, Layers
} from 'lucide-react'

export default function AgencyOverviewPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [totalCompanies, setTotalCompanies] = useState(0)
  const [connectedPlatformsCount, setConnectedPlatformsCount] = useState(0)
  const [reportsCount, setReportsCount] = useState(0)
  const [reviewsCount, setReviewsCount] = useState(0)
  const [companies, setCompanies] = useState<Array<Record<string, unknown>>>([])

  useEffect(() => {
    async function loadAgencyStats() {
      setLoading(true)
      try {
        // 1. Fetch Companies
        const { data: comps } = await supabase.from('companies').select('*')
        if (comps) {
          setTotalCompanies(comps.length)
          setCompanies(comps)
        }

        // 2. Fetch Connected Platforms
        const { data: conns } = await supabase
          .from('platform_connections')
          .select('id')
          .eq('connection_status', 'connected')
        if (conns) setConnectedPlatformsCount(conns.length)

        // 3. Fetch Reports Generated
        const { data: reps } = await supabase.from('generated_reports').select('id')
        if (reps) setReportsCount(reps.length)

        // 4. Fetch Reviews Pending
        const { data: revs } = await supabase
          .from('client_report_reviews')
          .select('id')
          .eq('status', 'revision_requested')
        if (revs) setReviewsCount(revs.length)
      } catch (err: unknown) {
        console.error('Failed to load agency stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAgencyStats()
  }, [supabase])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Agency Operations Hub</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Operational dashboard managing multi-company client portfolios and reporting pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/60 transition-colors"
          >
            <Building2 className="w-4 h-4 text-primary" /> Client Directory
          </Link>
          <Link
            href="/companies/new"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Client Company
          </Link>
        </div>
      </div>

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Client Companies</span>
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <span className="text-3xl font-extrabold text-foreground">{totalCompanies}</span>
          <span className="text-[10px] text-muted-foreground font-semibold">Active Managed Portfolios</span>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">API Connections</span>
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-3xl font-extrabold text-foreground">{connectedPlatformsCount}</span>
          <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Live Active Connections
          </span>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Reports Published</span>
            <FileText className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-3xl font-extrabold text-foreground">{reportsCount}</span>
          <span className="text-[10px] text-muted-foreground font-semibold">Generated PDF/Excel Snapshots</span>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Revisions Requested</span>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-3xl font-extrabold text-foreground">{reviewsCount}</span>
          <span className="text-[10px] text-amber-500 font-semibold">Client Action Required</span>
        </div>
      </div>

      {/* Managed Companies Quick Overview */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Managed Client Portfolios</h3>
          <Link href="/clients" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            View All Clients <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.slice(0, 6).map(comp => (
            <div key={String(comp.id)} className="p-4 bg-muted/30 border border-border/40 rounded-xl space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-foreground">{String(comp.name)}</h4>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                <Link
                  href={`/dashboard?companyId=${comp.id}`}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  Manage Company <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
