'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { fetchDashboardAnalyticsData, DashboardMetricsResult } from '@/features/sync/queries'
import { getDateRange } from '@/lib/analytics/date-ranges'
import { DateRangePreset } from '@/lib/analytics/types'
import { 
  Building, 
  Clock, 
  Globe,
  TrendingUp,
  Users,
  Eye,
  Heart,
  Loader2,
  Facebook,
  Youtube,
  Instagram,
  Video,
  RefreshCw,
  HelpCircle
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { activeCompany } = useCompany()
  const [preset, setPreset] = useState<DateRangePreset>('current_month')
  const [data, setData] = useState<DashboardMetricsResult | null>(null)
  const [loading, setLoading] = useState(true)

  const companyId = activeCompany?.id

  useEffect(() => {
    if (!companyId) return
    let isSubscribed = true
    const range = getDateRange(preset)

    fetchDashboardAnalyticsData(companyId, range)
      .then(res => {
        if (isSubscribed) {
          setData(res)
          setLoading(false)
        }
      })
      .catch(e => {
        console.error('Failed to load dashboard metrics:', e)
        if (isSubscribed) setLoading(false)
      })

    return () => {
      isSubscribed = false
    }
  }, [companyId, preset])



  if (!activeCompany) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <Building className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">No active company</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Please switch to an existing company or create a new one to view the dashboard.
          </p>
        </div>
        <Link 
          href="/onboarding"
          className="bg-primary text-primary-foreground font-medium rounded-lg text-sm px-4 py-2 hover:bg-primary/90 transition-colors"
        >
          Create Company
        </Link>
      </div>
    )
  }

  const renderIconForMetric = (name: string) => {
    switch (name) {
      case 'audience_total': return <Users className="w-5 h-5 text-primary" />
      case 'impressions': return <Eye className="w-5 h-5 text-blue-500" />
      case 'views': return <Video className="w-5 h-5 text-purple-500" />
      case 'engagements': return <Heart className="w-5 h-5 text-rose-500" />
      default: return <TrendingUp className="w-5 h-5 text-emerald-500" />
    }
  }

  const renderPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="w-4 h-4 text-[#1877F2]" />
      case 'youtube': return <Youtube className="w-4 h-4 text-[#FF0000]" />
      case 'instagram': return <Instagram className="w-4 h-4 text-[#E4405F]" />
      case 'tiktok': return <Video className="w-4 h-4 text-[#00F2FE]" />
      default: return <Globe className="w-4 h-4 text-primary" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historical analytics for <span className="font-semibold text-foreground">{activeCompany.name}</span>
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          {[
            { label: 'This Week', presetKey: 'current_week' },
            { label: 'This Month', presetKey: 'current_month' },
            { label: 'Last 30 Days', presetKey: 'last_30_days' },
            { label: 'Last Month', presetKey: 'previous_month' }
          ].map(item => (
            <button
              key={item.presetKey}
              onClick={() => {
                setPreset(item.presetKey as DateRangePreset)
                setLoading(true)
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                preset === item.presetKey
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="p-4 bg-card/80 border border-border/80 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">
              {data?.lastSyncAt
                ? `Last Synced: ${new Date(data.lastSyncAt).toLocaleString()}`
                : 'No historical analytics synced yet'}
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Click &quot;Sync Now&quot; on connected platform channels to ingest daily snapshot metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/connections?companyId=${activeCompany.id}`}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Connections
          </Link>
        </div>
      </div>

      {/* Metric Summary Cards */}
      {loading ? (
        <div className="p-12 text-center bg-card/40 border border-border/40 rounded-2xl">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground font-medium">Aggregating historical stored metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.summaryCards.slice(0, 4).map(card => {
            const growth = card.growth
            const isPositive = growth.isPositive
            return (
              <div
                key={card.metricName}
                className="bg-card/80 border border-border/80 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    {card.label}
                    {card.tooltipExplanation && (
                      <span title={card.tooltipExplanation} className="cursor-help">
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60" />
                      </span>
                    )}
                  </span>
                  <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                    {renderIconForMetric(card.metricName)}
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-black tracking-tight text-foreground">
                    {card.currentTotal.toLocaleString()} {card.unit || ''}
                  </div>

                  {card.metricName === 'impressions' && card.currentTotal === 0 ? (
                    <p className="text-[11px] text-amber-500 font-semibold mt-1">
                      Impressions unavailable for this Facebook Page due to Meta permission limitations.
                    </p>
                  ) : card.metricName === 'reach' && card.currentTotal === 0 ? (
                    <p className="text-[11px] text-amber-500 font-semibold mt-1">
                      Reach unavailable for this Facebook Page due to Meta permission limitations.
                    </p>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1">
                      {growth.isUnavailable ? (
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          No previous period baseline
                        </span>
                      ) : (
                        <span
                          className={`text-[11px] font-bold inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                            isPositive
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {growth.percentageChange}%
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">vs prev period</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Platform Summary Section */}
      <div className="bg-card/80 border border-border/80 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-foreground">Platform Metrics Overview</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.platformBreakdown.map(item => (
            <div key={item.platform} className="p-4 bg-muted/30 border border-border/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between capitalize font-bold text-xs text-foreground">
                <div className="flex items-center gap-1.5">
                  {renderPlatformIcon(item.platform)}
                  <span>{item.platform}</span>
                </div>
              </div>

              <div className="pt-1 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Audience:</span>
                  <span className="font-bold text-foreground">{item.audience.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Views:</span>
                  <span className="font-bold text-foreground">{item.views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Engagements:</span>
                  <span className="font-bold text-foreground">{item.engagements.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
