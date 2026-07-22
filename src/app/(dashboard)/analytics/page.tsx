'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { fetchAnalyticsTrendData, fetchDashboardAnalyticsData, DashboardMetricsResult } from '@/features/sync/queries'
import { getDateRange } from '@/lib/analytics/date-ranges'
import { DateRangePreset } from '@/lib/analytics/types'
import {
  BarChart3,
  Calendar,
  Filter,
  Loader2,
  TrendingUp,
  Users,
  Eye,
  Heart,
  Video,
  Facebook,
  Youtube,
  Instagram,
  HelpCircle
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function AnalyticsPage() {
  const { activeCompany } = useCompany()
  const [preset, setPreset] = useState<DateRangePreset>('last_30_days')
  const [platform, setPlatform] = useState<string>('all')
  const [metricsData, setMetricsData] = useState<DashboardMetricsResult | null>(null)
  const [trendData, setTrendData] = useState<Record<string, number>[]>([])
  const [loading, setLoading] = useState(true)

  const companyId = activeCompany?.id

  useEffect(() => {
    if (!companyId) return
    let isSubscribed = true
    const range = getDateRange(preset)

    Promise.all([
      fetchDashboardAnalyticsData(companyId, range),
      fetchAnalyticsTrendData(companyId, range, platform)
    ])
      .then(([summaryRes, trendRes]) => {
        if (isSubscribed) {
          setMetricsData(summaryRes)
          setTrendData(trendRes as Record<string, number>[])
          setLoading(false)
        }
      })
      .catch(e => {
        console.error('Failed to load analytics trends:', e)
        if (isSubscribed) setLoading(false)
      })

    return () => {
      isSubscribed = false
    }
  }, [companyId, preset, platform])


  if (!activeCompany) return null

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Performance Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historical social performance trend charts for <span className="font-semibold text-foreground">{activeCompany.name}</span>
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Platform Filter */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 border border-border/50 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-muted-foreground ml-2" />
            {[
              { id: 'all', label: 'All Platforms' },
              { id: 'facebook', label: 'Facebook' },
              { id: 'youtube', label: 'YouTube' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  platform === p.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 border border-border/50 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground ml-2" />
            {[
              { label: '7D', presetKey: 'last_7_days' },
              { label: '30D', presetKey: 'last_30_days' },
              { label: 'This Month', presetKey: 'current_month' },
              { label: 'Last Month', presetKey: 'previous_month' }
            ].map(item => (
              <button
                key={item.presetKey}
                onClick={() => setPreset(item.presetKey as DateRangePreset)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  preset === item.presetKey
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPI Bar */}
      {loading ? (
        <div className="p-12 text-center bg-card/40 border border-border/40 rounded-2xl">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground font-medium">Loading analytics trends...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricsData?.summaryCards.slice(0, 4).map(card => (
              <div key={card.metricName} className="bg-card/80 border border-border/80 rounded-2xl p-4 shadow-sm space-y-1">
                <span className="text-xs font-bold text-muted-foreground">{card.label}</span>
                <div className="text-xl font-black text-foreground">{card.currentTotal.toLocaleString()} {card.unit || ''}</div>
                <div className="text-[11px] text-emerald-500 font-semibold">
                  {card.growth.isUnavailable ? 'No baseline' : `${card.growth.isPositive ? '+' : ''}${card.growth.percentageChange}% vs prev period`}
                </div>
              </div>
            ))}
          </div>

          {/* Area Chart: Views & Impressions Trend */}
          <div className="bg-card/80 border border-border/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Views &amp; Engagement Trends</h3>
                <p className="text-xs text-muted-foreground">Daily snapshot values aggregated over the selected timeframe.</p>
              </div>
            </div>

            {trendData.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground/60 space-y-2">
                <BarChart3 className="w-10 h-10 mx-auto opacity-50" />
                <p className="text-xs font-medium">No daily trend snapshots recorded for this range yet.</p>
              </div>
            ) : (
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="views" name="Views" stroke="#8b5cf6" fillOpacity={1} fill="url(#viewsGrad)" />
                    <Area type="monotone" dataKey="engagements" name="Engagements" stroke="#ec4899" fillOpacity={1} fill="url(#engGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
