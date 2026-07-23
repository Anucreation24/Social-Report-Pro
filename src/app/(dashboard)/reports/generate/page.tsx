'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCompany } from '@/components/providers/CompanyProvider'
import { ReportType, PlatformType, GeneratedReportSnapshot } from '@/lib/reports/types'
import { buildReportSnapshot } from '@/lib/reports/snapshot-engine'
import { generateReportAction } from '@/features/reports/actions'
import { ReportPreview } from '@/components/reports/ReportPreview'
import {
  Calendar, Check, CheckCircle2, ChevronRight, FileSpreadsheet, FileText,
  Filter, Layers, Loader2, Sparkles, User, AlertCircle, ArrowLeft, Download
} from 'lucide-react'
import Link from 'next/link'

export default function ReportGeneratePage() {
  const router = useRouter()
  const { activeCompany } = useCompany()
  const companyId = activeCompany?.id

  // Form State
  const [step, setStep] = useState<number>(1)
  const [reportType, setReportType] = useState<ReportType>('monthly')
  const [reportTitle, setReportTitle] = useState<string>(
    activeCompany ? `MONTHLY Social Performance Report — ${activeCompany.name}` : ''
  )
  const [periodStart, setPeriodStart] = useState<string>('')
  const [periodEnd, setPeriodEnd] = useState<string>('')
  const [preparedBy, setPreparedBy] = useState<string>('Marketing Department')
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(['facebook', 'youtube'])
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'header', 'executive_summary', 'overall_performance', 'platform_comparison',
    'top_content', 'recommendations', 'data_availability', 'footer'
  ])
  const [execSummaryNotes, setExecSummaryNotes] = useState<string>('')
  const [marketingNotes, setMarketingNotes] = useState<string>('')
  const [recommendationsNotes, setRecommendationsNotes] = useState<string>('')

  // Preview & Generation state
  const [previewSnapshot, setPreviewSnapshot] = useState<GeneratedReportSnapshot | null>(null)
  const [previewLoading, setPreviewLoading] = useState<boolean>(false)
  const [generating, setGenerating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedResult, setGeneratedResult] = useState<{
    reportId: string
    pdfSignedUrl: string
    excelSignedUrl: string
  } | null>(null)

  // Handle platform toggle
  const togglePlatform = (p: PlatformType) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  // Handle step preview loading
  const handleProceedToPreview = async () => {
    if (!companyId) return
    setError(null)
    setPreviewLoading(true)
    setStep(6)

    try {
      // Create lightweight preview client snapshot via server action or client API fetch
      const res = await fetch(`/api/reports/preview?companyId=${companyId}&reportType=${reportType}&platforms=${selectedPlatforms.join(',')}`)
      if (res.ok) {
        const snap = await res.json()
        setPreviewSnapshot(snap)
      } else {
        // Fallback preview notification
        setPreviewSnapshot(null)
      }
    } catch (e) {
      console.warn('Live preview API warning:', e)
    } finally {
      setPreviewLoading(false)
    }
  }

  // Handle Final Report Generation
  const handleGenerateFinalReport = async () => {
    if (!companyId) return
    setError(null)
    setGenerating(true)

    try {
      const res = await generateReportAction({
        companyId,
        reportType,
        reportTitle,
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
        includedPlatforms: selectedPlatforms,
        includedSections: selectedSections,
        preparedBy,
        executiveSummaryNotes: execSummaryNotes,
        marketingNotes,
        recommendationsNotes
      })

      if (res.success) {
        setGeneratedResult({
          reportId: res.reportId,
          pdfSignedUrl: res.pdfSignedUrl,
          excelSignedUrl: res.excelSignedUrl
        })
      }
    } catch (err: unknown) {
      console.error('Report generation error:', err)
      setError((err as Error).message || 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  if (!activeCompany) return null

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Report History
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Report Generator</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a custom, professional PDF and Excel performance report for <span className="font-semibold text-foreground">{activeCompany.name}</span>
          </p>
        </div>
      </div>

      {/* Step Wizard Progress Bar */}
      <div className="grid grid-cols-6 gap-2 bg-muted/40 p-1.5 border border-border/50 rounded-2xl text-xs font-bold">
        {[
          { id: 1, label: '1. Type' },
          { id: 2, label: '2. Period' },
          { id: 3, label: '3. Platforms' },
          { id: 4, label: '4. Sections' },
          { id: 5, label: '5. Notes' },
          { id: 6, label: '6. Preview & Export' }
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`py-2 px-3 rounded-xl transition-all text-center cursor-pointer ${
              step === s.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : step > s.id
                ? 'bg-card text-foreground border border-border/40'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Report Type */}
      {step === 1 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground">Step 1: Select Report Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setReportType('weekly')}
              className={`p-6 border rounded-2xl cursor-pointer transition-all space-y-3 ${
                reportType === 'weekly'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border/60 hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-foreground">Weekly Performance Report</span>
                {reportType === 'weekly' && <CheckCircle2 className="w-5 h-5 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Concise 7-day tactical performance snapshot. Compares current week against previous equivalent week based on company week-start configuration.
              </p>
            </div>

            <div
              onClick={() => setReportType('monthly')}
              className={`p-6 border rounded-2xl cursor-pointer transition-all space-y-3 ${
                reportType === 'monthly'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border/60 hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-foreground">Monthly Performance Report</span>
                {reportType === 'monthly' && <CheckCircle2 className="w-5 h-5 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Comprehensive full calendar month strategic performance report. Includes platform breakdowns, top content rankings, and period comparisons.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              Next: Select Period
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Period */}
      {step === 2 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground">Step 2: Select Reporting Period & Details</h3>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Report Title</label>
              <input
                type="text"
                value={reportTitle}
                onChange={e => setReportTitle(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Prepared By</label>
              <input
                type="text"
                value={preparedBy}
                onChange={e => setPreparedBy(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Custom Period Start (Optional)</label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={e => setPeriodStart(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Custom Period End (Optional)</label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={e => setPeriodEnd(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              If dates are left blank, the report automatically calculates the latest complete {reportType} period in {activeCompany.timezone || 'Asia/Colombo'} timezone.
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t border-border/40">
            <button
              onClick={() => setStep(1)}
              className="bg-muted hover:bg-muted/80 text-foreground text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              Next: Select Platforms
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Platforms */}
      {step === 3 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground">Step 3: Select Included Social Channels</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'facebook', name: 'Facebook Page', badge: 'Connected', desc: 'Ingests Page followers, video views, post interactions & reactions' },
              { id: 'youtube', name: 'YouTube Channel', badge: 'Connected', desc: 'Ingests subscriber count, video views, watch time & video metrics' },
              { id: 'instagram', name: 'Instagram', badge: 'Not Connected', desc: 'Professional account consolidates image & reel performance' },
              { id: 'tiktok', name: 'TikTok', badge: 'Not Connected', desc: 'Short-form video impressions, shares & follower growth' }
            ].map(p => {
              const isSelected = selectedPlatforms.includes(p.id as PlatformType)
              return (
                <div
                  key={p.id}
                  onClick={() => togglePlatform(p.id as PlatformType)}
                  className={`p-5 border rounded-2xl cursor-pointer transition-all space-y-3 ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border/60 hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{p.name}</span>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-muted-foreground/30" />
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                    p.badge === 'Connected' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-muted text-muted-foreground'
                  }`}>
                    {p.badge}
                  </span>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
              )
            })}
          </div>

          <div className="flex justify-between pt-4 border-t border-border/40">
            <button
              onClick={() => setStep(2)}
              className="bg-muted hover:bg-muted/80 text-foreground text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              Next: Select Sections
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Sections */}
      {step === 4 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground">Step 4: Select Report Sections</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {[
              { id: 'header', label: 'Report Cover & Header (Required)', required: true },
              { id: 'overall_performance', label: 'Overall KPI Summary Cards (Required)', required: true },
              { id: 'executive_summary', label: 'Executive Summary Statements', required: false },
              { id: 'platform_comparison', label: 'Platform Comparison Table', required: false },
              { id: 'top_content', label: 'Top Performing Content', required: false },
              { id: 'lowest_content', label: 'Content Requiring Review', required: false },
              { id: 'recommendations', label: 'Strategic Marketing Recommendations', required: false },
              { id: 'data_availability', label: 'Data Availability & Disclaimers (Required)', required: true }
            ].map(sec => (
              <label key={sec.id} className="flex items-center gap-2.5 p-3 bg-muted/30 border border-border/40 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  disabled={sec.required}
                  checked={selectedSections.includes(sec.id)}
                  onChange={e => {
                    if (e.target.checked) setSelectedSections([...selectedSections, sec.id])
                    else setSelectedSections(selectedSections.filter(x => x !== sec.id))
                  }}
                  className="rounded text-primary focus:ring-primary/20"
                />
                <span className="font-semibold text-foreground">{sec.label}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-border/40">
            <button
              onClick={() => setStep(3)}
              className="bg-muted hover:bg-muted/80 text-foreground text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep(5)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              Next: Executive Notes
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Executive Notes */}
      {step === 5 && (
        <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground">Step 5: Executive Summary & Notes</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Executive Summary Notes (Optional)</label>
              <textarea
                rows={3}
                value={execSummaryNotes}
                onChange={e => setExecSummaryNotes(e.target.value)}
                placeholder="Add custom high-level executive summary observations for stakeholders..."
                className="w-full bg-background border border-border rounded-xl p-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Marketing Notes & Commentary (Optional)</label>
              <textarea
                rows={3}
                value={marketingNotes}
                onChange={e => setMarketingNotes(e.target.value)}
                placeholder="Add marketing strategy commentary..."
                className="w-full bg-background border border-border rounded-xl p-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Custom Recommendations (Optional)</label>
              <textarea
                rows={3}
                value={recommendationsNotes}
                onChange={e => setRecommendationsNotes(e.target.value)}
                placeholder="Add tailored action items for next period..."
                className="w-full bg-background border border-border rounded-xl p-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-border/40">
            <button
              onClick={() => setStep(4)}
              className="bg-muted hover:bg-muted/80 text-foreground text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleProceedToPreview}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              Preview & Export Report
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Preview & Export */}
      {step === 6 && (
        <div className="space-y-6">
          <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Step 6: Report Preview & Generation</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review your report preview below. Once finalized, click &quot;Generate PDF & Excel Exports&quot; to compile immutable files.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(5)}
                className="bg-muted hover:bg-muted/80 text-foreground text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Edit Notes
              </button>

              <button
                disabled={generating}
                onClick={handleGenerateFinalReport}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Compiling PDF & Excel...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate PDF & Excel Exports
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Export Result Modal / Banner */}
          {generatedResult && (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Report Successfully Compiled & Saved!</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your report snapshot has been immutably saved to Report History. Download your PDF or Excel export below:
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={generatedResult.pdfSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Download PDF Report
                </a>

                <a
                  href={generatedResult.excelSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Excel Workbook
                </a>

                <Link
                  href={`/reports/${generatedResult.reportId}`}
                  className="bg-card hover:bg-muted border border-border/80 text-foreground text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  View Report Details
                </Link>
              </div>
            </div>
          )}

          {/* Document Preview */}
          {previewLoading ? (
            <div className="p-16 text-center bg-card border border-border/60 rounded-2xl space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground font-medium">Building live report preview...</p>
            </div>
          ) : previewSnapshot ? (
            <ReportPreview snapshot={previewSnapshot} />
          ) : (
            <div className="p-12 text-center bg-card border border-border/60 rounded-2xl">
              <p className="text-xs text-muted-foreground">Click &quot;Generate PDF & Excel Exports&quot; to finish generating the report.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
