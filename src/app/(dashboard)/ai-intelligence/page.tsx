'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { generateAiIntelligenceAction, saveAiSnapshotAction, getAiHistoryAction } from '@/features/ai/actions'
import { AIExecutiveIntelligenceReport, SummaryLength } from '@/lib/ai/types'
import { 
  Sparkles, Clock, CheckCircle2, 
  Save, Loader2, AlertCircle, History, Filter, Eye, RefreshCw
} from 'lucide-react'

export default function AiIntelligencePage() {
  const { activeCompany } = useCompany()

  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium')
  const [report, setReport] = useState<AIExecutiveIntelligenceReport | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // History state
  const [history, setHistory] = useState<Record<string, unknown>[]>([])
  const [historyLoading, setHistoryLoading] = useState<boolean>(true)

  const companyId = activeCompany?.id

  const loadReport = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    setError(null)
    setSaveSuccess(null)
    try {
      const res = await generateAiIntelligenceAction(companyId, summaryLength)
      if (res.success && res.data) {
        setReport(res.data)
      } else {
        setError(res.error || 'Failed to generate AI report.')
      }
    } catch (err: unknown) {
      console.error('AI report load error:', err)
      setError((err as Error).message || 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }, [companyId, summaryLength])

  const loadHistory = useCallback(async () => {
    if (!companyId) return
    setHistoryLoading(true)
    try {
      const res = await getAiHistoryAction(companyId)
      if (res.success) {
        setHistory(res.data)
      }
    } catch (err: unknown) {
      console.error('History load error:', err)
    } finally {
      setHistoryLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory()
  }, [loadReport, loadHistory])

  const handleSaveSnapshot = async () => {
    if (!companyId || !report) return
    setSaving(true)
    setSaveSuccess(null)
    try {
      const res = await saveAiSnapshotAction(companyId, report)
      if (res.success) {
        setSaveSuccess(`Snapshot saved successfully (ID: ${res.snapshotId?.slice(0, 8)}).`)
        loadHistory()
      } else {
        setError(res.error || 'Failed to save AI report snapshot.')
      }
    } catch (err: unknown) {
      console.error('Save error:', err)
      setError((err as Error).message || 'Failed to save snapshot.')
    } finally {
      setSaving(false)
    }
  }

  if (!activeCompany) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground font-semibold">Loading Workspace Context...</p>
      </div>
    )
  }

  const gradeColorMap: Record<string, string> = {
    'A+': 'from-emerald-500/20 to-teal-600/20 text-emerald-400 border-emerald-500/30',
    'A': 'from-blue-500/20 to-indigo-600/20 text-blue-400 border-blue-500/30',
    'B': 'from-sky-500/20 to-cyan-600/20 text-sky-400 border-sky-500/30',
    'C': 'from-amber-500/20 to-orange-600/20 text-amber-400 border-amber-500/30',
    'D': 'from-rose-500/20 to-red-600/20 text-rose-400 border-rose-500/30'
  }

  const filteredRecommendations = (report?.recommendations || []).filter(r => 
    priorityFilter === 'all' || r.priority === priorityFilter
  )

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Stage 5 Intelligence Engine
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">AI Executive Intelligence</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Deterministic analytics, scoring, content evaluation, and recommendations for <span className="font-semibold text-foreground">{activeCompany.name}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Length Toggle */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 border border-border/50 rounded-xl">
            {(['short', 'medium', 'detailed'] as SummaryLength[]).map(l => (
              <button
                key={l}
                onClick={() => setSummaryLength(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  summaryLength === l
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={loadReport}
            disabled={loading}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/60 transition-colors cursor-pointer"
            title="Re-run Engine"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleSaveSnapshot}
            disabled={saving || !report}
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save AI Snapshot
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-24 bg-card border border-border/60 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <div className="text-center">
            <h3 className="text-sm font-bold text-foreground">Computing Executive AI Intelligence...</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Evaluating analytics_snapshots and content_metrics.</p>
          </div>
        </div>
      ) : report && (
        <>
          {/* Executive Overview & Performance Grade */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 p-6 bg-card border border-border/60 rounded-2xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Executive Summary ({report.summaryLength})</span>
                <span className="text-[11px] text-muted-foreground font-mono">Generated: {new Date(report.generatedAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-sm text-foreground font-medium leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/40 whitespace-pre-line">
                {report.executiveSummary.overallNarrative}
              </p>

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Key Growth Bulletins</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {report.executiveSummary.keyHighlights.map((hl, idx) => (
                    <div key={idx} className="p-3 bg-muted/40 rounded-xl border border-border/40 text-xs flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Grade Box */}
            <div className={`p-6 rounded-2xl bg-gradient-to-br ${gradeColorMap[report.performanceGrade.grade] || gradeColorMap['A']} border flex flex-col justify-between space-y-4 shadow-sm`}>
              <div className="space-y-2 text-center">
                <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground block">Performance Grade</span>
                <div className="text-6xl font-black tracking-tighter">{report.performanceGrade.grade}</div>
                <div className="text-xs font-bold">{report.performanceGrade.score} / 100 Index Score</div>
              </div>

              <div className="space-y-2 text-xs pt-4 border-t border-border/40">
                <span className="font-extrabold text-foreground block uppercase text-[10px]">Top Strength:</span>
                <p className="text-muted-foreground">{report.performanceGrade.strengths[0] || 'Steady cross-platform publishing.'}</p>
                <span className="font-extrabold text-foreground block uppercase text-[10px] pt-1">Primary Growth Area:</span>
                <p className="text-muted-foreground">{report.performanceGrade.growthAreas[0] || 'Increase video upload volume.'}</p>
              </div>
            </div>
          </div>

          {/* Platform Scoring Engine Section */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">Platform Performance Scores (0–100)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.platformScores.map(ps => (
                <div key={ps.platform} className="p-5 bg-muted/30 border border-border/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold capitalize text-foreground">{ps.platform}</span>
                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-xs font-black rounded-lg">
                      {ps.score} / 100
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    {ps.explanation.map((exp, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-muted-foreground">
                        <span className="text-primary font-bold">•</span>
                        <span>{exp}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Growth</span>
                      <span className="font-bold text-foreground">{ps.metricsSummary.growthPct}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Eng. Rate</span>
                      <span className="font-bold text-foreground">{ps.metricsSummary.engagementRatePct}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Posts</span>
                      <span className="font-bold text-foreground">{ps.metricsSummary.postsCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Intelligence & Posting Time */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top & Worst Content */}
            <div className="lg:col-span-2 bg-card border border-border/60 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-foreground">Content Intelligence Highlights</h3>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-emerald-500 uppercase tracking-wider text-[10px] mb-2">Top Performing Posts</h4>
                  <div className="space-y-2">
                    {report.contentIntelligence.topPosts.slice(0, 3).map(p => (
                      <div key={p.id} className="p-3 bg-muted/40 border border-border/40 rounded-xl space-y-1">
                        <div className="flex items-center justify-between font-bold text-foreground">
                          <span className="truncate max-w-xs">{p.title}</span>
                          <span className="capitalize text-primary text-[10px]">{p.platform}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px]">{p.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-rose-500 uppercase tracking-wider text-[10px] mb-2">Lowest Performing Posts</h4>
                  <div className="space-y-2">
                    {report.contentIntelligence.worstPosts.slice(0, 2).map(p => (
                      <div key={p.id} className="p-3 bg-muted/40 border border-border/40 rounded-xl space-y-1">
                        <div className="flex items-center justify-between font-bold text-foreground">
                          <span className="truncate max-w-xs">{p.title}</span>
                          <span className="capitalize text-muted-foreground text-[10px]">{p.platform}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px]">{p.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Posting Time Intelligence Card */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-primary flex items-center gap-1 mb-2">
                  <Clock className="w-4 h-4" /> Posting Time Intelligence
                </span>
                <h3 className="text-base font-extrabold text-foreground">Optimal Publishing Windows</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {report.postingTimeIntelligence.explanation}
                </p>

                <div className="space-y-3 mt-4 text-xs">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-400">Best Publishing Time</span>
                    <div className="font-black text-sm text-foreground">
                      {report.postingTimeIntelligence.bestDay} @ {report.postingTimeIntelligence.bestHour}
                    </div>
                  </div>

                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-rose-400">Low Interaction Time</span>
                    <div className="font-bold text-sm text-foreground">
                      {report.postingTimeIntelligence.worstDay} @ {report.postingTimeIntelligence.worstHour}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Confidence Rating</span>
                <span className="font-bold uppercase text-primary">{report.postingTimeIntelligence.confidence}</span>
              </div>
            </div>
          </div>

          {/* Actionable Recommendations List */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Prioritized Actionable Recommendations</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Categorized strategic directives generated from cross-platform metrics.</p>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-1 bg-muted/40 p-1 border border-border/50 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-muted-foreground ml-2" />
                {['all', 'high', 'medium', 'low'].map(pr => (
                  <button
                    key={pr}
                    onClick={() => setPriorityFilter(pr)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      priorityFilter === pr
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {pr}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecommendations.map(rec => (
                <div key={rec.id} className="p-4 bg-muted/30 border border-border/50 rounded-xl space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary uppercase">{rec.category}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md ${
                        rec.priority === 'high' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        rec.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {rec.priority} Priority
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-foreground">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{rec.action}</p>
                  </div>

                  <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                    <span className="font-bold text-foreground">Rationale:</span> {rec.rationale}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical AI Report Snapshots Audit Table */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <h3 className="text-base font-bold text-foreground">AI Intelligence Snapshot History ({history.length})</h3>
            </div>

            {historyLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading snapshot history...</div>
            ) : history.length === 0 ? (
              <p className="text-xs text-muted-foreground">No saved AI intelligence snapshots recorded yet.</p>
            ) : (
              <div className="overflow-x-auto border border-border/40 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border/40 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Generated Date</th>
                      <th className="p-3">Length</th>
                      <th className="p-3">Grade</th>
                      <th className="p-3">Period</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium">
                    {history.map((h, idx) => {
                      const pGradeObj = (h.performance_grade || {}) as Record<string, string>
                      return (
                        <tr key={String(h.id || idx)} className="hover:bg-muted/20">
                          <td className="p-3 font-mono">{new Date(String(h.generated_at)).toLocaleString()}</td>
                          <td className="p-3 capitalize">{String(h.summary_length || 'medium')}</td>
                          <td className="p-3 font-bold text-primary">{pGradeObj.grade || 'A'}</td>
                          <td className="p-3 text-muted-foreground">{String(h.period_start)} to {String(h.period_end)}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={loadReport}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
