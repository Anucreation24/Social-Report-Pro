'use client'

import React, { useEffect, useState } from 'react'
import { generateAiIntelligenceAction } from '@/features/ai/actions'
import { AIExecutiveIntelligenceReport, PriorityLevel } from '@/lib/ai/types'
import { 
  Sparkles, ShieldAlert, Award, ArrowUpRight, TrendingUp, Lightbulb, 
  CheckCircle2, AlertTriangle, Loader2, BarChart2, Calendar, Target, Zap
} from 'lucide-react'

interface AiInsightsWidgetProps {
  companyId: string
}

export default function AiInsightsWidget({ companyId }: AiInsightsWidgetProps) {
  const [report, setReport] = useState<AIExecutiveIntelligenceReport | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAiData() {
      if (!companyId) return
      setLoading(true)
      setError(null)
      try {
        const res = await generateAiIntelligenceAction(companyId, 'medium')
        if (res.success && res.data) {
          setReport(res.data)
        } else {
          setError(res.error || 'Unable to generate AI Executive Intelligence.')
        }
      } catch (err: unknown) {
        console.error('Failed to load AI widget data:', err)
        setError((err as Error).message || 'AI engine loading error.')
      } finally {
        setLoading(false)
      }
    }

    loadAiData()
  }, [companyId])

  if (loading) {
    return (
      <div className="p-8 bg-card border border-border/60 rounded-2xl flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold">Generating AI Executive Intelligence...</p>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="p-4 bg-muted/40 border border-border/50 rounded-2xl text-xs text-muted-foreground flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        <span>{error || 'AI Insights currently unavailable.'}</span>
      </div>
    )
  }

  const { performanceGrade, executiveKPIs, executiveSummary, recommendations, trendDetection, forecast, postingTimeIntelligence } = report

  const topRec = recommendations.find(r => r.priority === 'high') || recommendations[0]
  const oppRec = recommendations.find(r => r.category === 'Platform Optimization' || r.category === 'Growth') || recommendations[1]
  const warningDrop = trendDetection.suddenDrops[0] || (trendDetection.decreasingMetrics.length > 0 ? { metric: trendDetection.decreasingMetrics[0], explanation: `${trendDetection.decreasingMetrics[0]} requires audience attention.` } : null)

  const gradeColorMap: Record<string, string> = {
    'A+': 'from-emerald-500 to-teal-600 text-emerald-400 border-emerald-500/30',
    'A': 'from-blue-500 to-indigo-600 text-blue-400 border-blue-500/30',
    'B': 'from-sky-500 to-cyan-600 text-sky-400 border-sky-500/30',
    'C': 'from-amber-500 to-orange-600 text-amber-400 border-amber-500/30',
    'D': 'from-rose-500 to-red-600 text-rose-400 border-rose-500/30'
  }

  const getPriorityBadge = (p: PriorityLevel) => {
    if (p === 'high') return <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-extrabold uppercase">High Priority</span>
    if (p === 'medium') return <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-extrabold uppercase">Medium</span>
    return <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-extrabold uppercase">Low</span>
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Performance Grade */}
      <div className="bg-gradient-to-r from-primary/15 via-purple-500/10 to-blue-500/15 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Executive Intelligence
            </div>
            <h2 className="text-xl font-black tracking-tight text-foreground">
              {executiveSummary.bestPlatform} is Driving Top Social Growth
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {executiveSummary.overallNarrative}
            </p>
          </div>

          <div className={`shrink-0 p-5 rounded-2xl bg-card/80 backdrop-blur-md border ${gradeColorMap[performanceGrade.grade] || gradeColorMap['A']} text-center space-y-1 shadow-lg`}>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block">Overall Grade</span>
            <div className="text-4xl font-black tracking-tighter">{performanceGrade.grade}</div>
            <span className="text-[10px] font-bold block">{performanceGrade.score}/100 Score</span>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Health Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Growth Score', val: executiveKPIs.growthScore.score, status: executiveKPIs.growthScore.status, icon: TrendingUp },
          { label: 'Consistency', val: executiveKPIs.consistencyScore.score, status: executiveKPIs.consistencyScore.status, icon: Calendar },
          { label: 'Content Score', val: executiveKPIs.contentScore.score, status: executiveKPIs.contentScore.status, icon: Zap },
          { label: 'Audience Health', val: executiveKPIs.audienceHealth.score, status: executiveKPIs.audienceHealth.status, icon: Target },
          { label: 'Platform Health', val: executiveKPIs.platformHealth.score, status: executiveKPIs.platformHealth.status, icon: Award },
          { label: 'Overall Health', val: executiveKPIs.overallHealth.score, status: executiveKPIs.overallHealth.status, icon: CheckCircle2 }
        ].map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div key={idx} className="p-3.5 bg-card border border-border/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{kpi.label}</span>
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="text-lg font-black text-foreground">{kpi.val}<span className="text-xs text-muted-foreground font-normal">/100</span></div>
              <div className="text-[10px] font-bold capitalize text-emerald-500">
                {kpi.status.replace('_', ' ')}
              </div>
            </div>
          )
        })}
      </div>

      {/* 3. AI Intelligence Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Today's Recommendation */}
        {topRec && (
          <div className="p-5 bg-card border border-border/60 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Lightbulb className="w-4 h-4 text-amber-400" /> Today&apos;s Recommendation
                </span>
                {getPriorityBadge(topRec.priority)}
              </div>
              <h4 className="text-sm font-extrabold text-foreground">{topRec.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{topRec.action}</p>
            </div>
            <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground font-medium">
              <span className="font-bold text-foreground">Impact:</span> {topRec.impact}
            </div>
          </div>
        )}

        {/* Biggest Opportunity */}
        {oppRec && (
          <div className="p-5 bg-card border border-border/60 rounded-2xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                  <ArrowUpRight className="w-4 h-4" /> Biggest Opportunity
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase">Growth Engine</span>
              </div>
              <h4 className="text-sm font-extrabold text-foreground">{oppRec.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{oppRec.rationale}</p>
            </div>
            <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground font-medium">
              <span className="font-bold text-foreground">Action:</span> {oppRec.action}
            </div>
          </div>
        )}

        {/* Growth Forecast & Best Posting Time */}
        <div className="p-5 bg-card border border-border/60 rounded-2xl space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400">
                <BarChart2 className="w-4 h-4" /> Growth Forecast & Optimal Time
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-extrabold uppercase">{forecast.confidenceScore}% Confidence</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 bg-muted/40 rounded-xl border border-border/40">
                <span className="text-[10px] font-bold text-muted-foreground block">Next 30D Audience</span>
                <span className="text-base font-black text-foreground">+{forecast.nextMonthAudience.toLocaleString()}</span>
              </div>
              <div className="p-2.5 bg-muted/40 rounded-xl border border-border/40">
                <span className="text-[10px] font-bold text-muted-foreground block">Expected Views</span>
                <span className="text-base font-black text-foreground">{forecast.expectedViews.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground font-medium flex items-center justify-between">
            <span><span className="font-bold text-foreground">Best Posting Window:</span> {postingTimeIntelligence.bestDay} @ {postingTimeIntelligence.bestHour}</span>
          </div>
        </div>
      </div>

      {/* Warning Alerts (If any) */}
      {warningDrop && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h5 className="font-bold text-amber-400">Warning Alert: {warningDrop.metric}</h5>
            <p className="text-muted-foreground">{warningDrop.explanation}</p>
          </div>
        </div>
      )}
    </div>
  )
}
