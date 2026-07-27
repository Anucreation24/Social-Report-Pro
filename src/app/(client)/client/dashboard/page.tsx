'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useCompany } from '@/components/providers/CompanyProvider'
import { createClient } from '@/lib/supabase/client'
import { aggregateMetricSnapshots, aggregateContentMetricRows, DbSnapshotRow, ContentMetricDbRow } from '@/lib/analytics/aggregation'
import { 
  Users, Eye, Heart, TrendingUp, Calendar, FileText, Download, 
  AlertCircle, CheckCircle2, Award, ChevronRight, Loader2, BarChart2
} from 'lucide-react'

export default function ClientDashboardPage() {
  const { activeCompany } = useCompany()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [snapshotRows, setSnapshotRows] = useState<DbSnapshotRow[]>([])
  const [contentMetricRows, setContentMetricRows] = useState<ContentMetricDbRow[]>([])
  const [topContent, setTopContent] = useState<Array<Record<string, unknown>>>([])
  const [latestReport, setLatestReport] = useState<Record<string, unknown> | null>(null)

  const loadData = useCallback(async () => {
    if (!activeCompany) return
    setLoading(true)

    try {
      // 1. Fetch Analytics Snapshots
      const { data: snapData } = await supabase
        .from('analytics_snapshots')
        .select('*')
        .eq('company_id', activeCompany.id)

      if (snapData) setSnapshotRows(snapData as DbSnapshotRow[])

      // 2. Fetch Content Items & Metrics
      const { data: contentData } = await supabase
        .from('content_items')
        .select(`
          id, title, provider, published_at, permalink,
          content_metrics (metric_name, metric_value)
        `)
        .eq('company_id', activeCompany.id)
        .order('published_at', { ascending: false })
        .limit(6)

      if (contentData) {
        const mapped = contentData.map(c => {
          const metrics = (c.content_metrics || []) as Array<{ metric_name: string; metric_value: number }>
          const views = metrics.find(m => m.metric_name === 'views')?.metric_value || 0
          const likes = metrics.find(m => m.metric_name === 'likes')?.metric_value || 0
          const comments = metrics.find(m => m.metric_name === 'comments')?.metric_value || 0
          const shares = metrics.find(m => m.metric_name === 'shares')?.metric_value || 0
          const eng = likes + comments + shares
          return { ...c, views, likes, engagements: eng }
        })
        mapped.sort((a, b) => (b.engagements as number) - (a.engagements as number))
        setTopContent(mapped)
      }

      // 3. Fetch Latest Approved Report
      const { data: reportData } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('company_id', activeCompany.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (reportData && reportData.length > 0) {
        setLatestReport(reportData[0])
      }
    } catch (err: unknown) {
      console.error('Failed to load client dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [activeCompany, supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  if (!activeCompany) return null

  // Aggregated KPIs (deduplicated by source priority rank 1 > 2 > 3 > 4)
  const audienceTotal = aggregateMetricSnapshots(snapshotRows, 'audience_total')
  const views = aggregateMetricSnapshots(snapshotRows, 'views') || aggregateContentMetricRows(contentMetricRows, 'views')
  const engagements = aggregateMetricSnapshots(snapshotRows, 'engagements') || aggregateContentMetricRows(contentMetricRows, 'engagements')
  const reach = aggregateMetricSnapshots(snapshotRows, 'reach')
  const impressions = aggregateMetricSnapshots(snapshotRows, 'impressions')

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
            Client Portal Overview
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mt-2">{activeCompany.name} Performance</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time verified social performance summary and client reports.
          </p>
        </div>

        {latestReport && (
          <Link
            href={`/client/reports/${latestReport.id}`}
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" /> View Latest Report <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Summary Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Audience</span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <span className="block text-2xl font-extrabold text-foreground">{audienceTotal.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active Followers
              </span>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Views</span>
                <Eye className="w-4 h-4 text-purple-400" />
              </div>
              <span className="block text-2xl font-extrabold text-foreground">{views.toLocaleString()}</span>
              <span className="text-[10px] text-muted-foreground font-semibold">Video & Post Views</span>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Engagements</span>
                <Heart className="w-4 h-4 text-pink-500" />
              </div>
              <span className="block text-2xl font-extrabold text-foreground">{engagements.toLocaleString()}</span>
              <span className="text-[10px] text-muted-foreground font-semibold">Likes, Comments & Shares</span>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Reach</span>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <span className="block text-2xl font-extrabold text-foreground">{reach.toLocaleString()}</span>
              <span className="text-[10px] text-muted-foreground font-semibold">Unique Accounts Reached</span>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-2 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Impressions</span>
                <BarChart2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="block text-2xl font-extrabold text-foreground">
                {impressions > 0 ? impressions.toLocaleString() : 'Limited'}
              </span>
              {impressions === 0 && (
                <span className="text-[9px] text-amber-500 font-semibold block leading-tight">
                  Meta Permission Limitation
                </span>
              )}
            </div>
          </div>

          {/* Data Availability & Limitation Notice */}
          <div className="p-4 bg-muted/40 border border-border/40 text-xs rounded-xl flex items-start gap-3 text-muted-foreground">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-foreground">Data Availability & Transparency Notice</h4>
              <p className="mt-0.5 text-[11px]">
                Facebook Impressions and Reach metrics may appear as limited due to Meta Graph API permission restrictions. All displayed metrics are prioritized using official API data, verified file imports, and manual entries without double-counting.
              </p>
            </div>
          </div>

          {/* Top Performing Content Section */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" /> Top Performing Posts
              </h3>
              <Link href="/client/content" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                View All Content <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {topContent.length === 0 ? (
              <p className="text-xs text-muted-foreground">No content items recorded for this company yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topContent.slice(0, 3).map((item, idx) => (
                  <div key={String(item.id)} className="p-4 bg-muted/30 border border-border/40 rounded-xl space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      #{idx + 1} Top Post
                    </span>
                    <h4 className="text-xs font-bold text-foreground line-clamp-2">{String(item.title)}</h4>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
                      <span>{String(item.views || 0)} Views</span>
                      <span className="font-bold text-foreground">{String(item.engagements || 0)} Engagements</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
