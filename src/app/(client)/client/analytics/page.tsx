'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { createClient } from '@/lib/supabase/client'
import { aggregateMetricSnapshots, DbSnapshotRow } from '@/lib/analytics/aggregation'
import { BarChart3, Loader2, Users, Eye, Heart, TrendingUp } from 'lucide-react'

export default function ClientAnalyticsPage() {
  const { activeCompany } = useCompany()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [snapshotRows, setSnapshotRows] = useState<DbSnapshotRow[]>([])

  const loadData = useCallback(async () => {
    if (!activeCompany) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('analytics_snapshots')
        .select('*')
        .eq('company_id', activeCompany.id)

      if (data) setSnapshotRows(data as DbSnapshotRow[])
    } catch (err: unknown) {
      console.error('Failed to load client analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [activeCompany, supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  if (!activeCompany) return null

  const audienceTotal = aggregateMetricSnapshots(snapshotRows, 'audience_total')
  const views = aggregateMetricSnapshots(snapshotRows, 'views')
  const engagements = aggregateMetricSnapshots(snapshotRows, 'engagements')
  const reach = aggregateMetricSnapshots(snapshotRows, 'reach')
  const impressions = aggregateMetricSnapshots(snapshotRows, 'impressions')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Client Analytics Overview</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Historical analytics metrics aggregated from verified data sources for {activeCompany.name}.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Audience Growth</span>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-3xl font-extrabold text-foreground">{audienceTotal.toLocaleString()}</span>
            <p className="text-xs text-muted-foreground">Total verified followers across connected platforms.</p>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Video & Post Views</span>
              <Eye className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-3xl font-extrabold text-foreground">{views.toLocaleString()}</span>
            <p className="text-xs text-muted-foreground">Total views generated across active content.</p>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Engagements</span>
              <Heart className="w-5 h-5 text-pink-500" />
            </div>
            <span className="text-3xl font-extrabold text-foreground">{engagements.toLocaleString()}</span>
            <p className="text-xs text-muted-foreground">Total likes, comments, and shares recorded.</p>
          </div>
        </div>
      )}
    </div>
  )
}
