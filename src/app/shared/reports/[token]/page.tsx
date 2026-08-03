'use client'

import React, { useEffect, useState, useCallback, use } from 'react'
import { getPublicShareReportAction } from '@/features/share-links/actions'
import { Download, Lock, AlertCircle, Loader2, Calendar, CheckCircle2 } from 'lucide-react'
import { SupportedLanguageCode, PdfMode } from '@/lib/i18n/languages'
import { getDictionary, translateStatementText } from '@/lib/i18n/translator'
import { LanguageSelector } from '@/components/reports/LanguageSelector'

interface PublicReportSharePageProps {
  params: Promise<{ token: string }>
}

export default function PublicReportSharePage({ params }: PublicReportSharePageProps) {
  const resolvedParams = use(params)
  const token = resolvedParams.token

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [lang, setLang] = useState<SupportedLanguageCode>('en')
  const [pdfMode, setPdfMode] = useState<PdfMode>('single')
  const [reportData, setReportData] = useState<{
    companyName: string
    companyLogoUrl: string | null
    reportTitle: string
    reportType: string
    periodStart: string
    periodEnd: string
    snapshot: Record<string, unknown>
    reportId: string
    shareLink: {
      allowPdfDownload: boolean
      allowExcelDownload: boolean
      expiresAt: string
    }
  } | null>(null)

  const fetchShareReport = useCallback(async (pwd?: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getPublicShareReportAction(token, pwd)
      if (res.requiresPassword) {
        setRequiresPassword(true)
      } else {
        setRequiresPassword(false)
        setReportData(res as unknown as typeof reportData)
      }
    } catch (err: unknown) {
      console.error('Share link load error:', err)
      setError((err as Error).message || 'Invalid or expired share link.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchShareReport()
  }, [fetchShareReport])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchShareReport(passwordInput)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border/80 rounded-2xl max-w-md w-full p-8 text-center space-y-4 shadow-xl">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Link Unavailable</h2>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <form onSubmit={handlePasswordSubmit} className="bg-card border border-border/80 rounded-2xl max-w-md w-full p-8 space-y-6 shadow-xl text-center">
          <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto text-primary">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Password Protected Report</h2>
            <p className="text-xs text-muted-foreground mt-1">Please enter the password provided by your marketing manager to view this report.</p>
          </div>

          <div>
            <input
              type="password"
              required
              placeholder="Enter report password..."
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              className="w-full bg-muted/40 border border-border/60 rounded-xl px-4 py-2.5 text-xs text-center focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-5 py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Unlock & View Report
          </button>
        </form>
      </div>
    )
  }

  if (!reportData) return null

  const overall = (reportData.snapshot?.overall || {}) as Record<string, { currentValue?: number }>

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Public Header */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              S
            </div>
            <span className="font-bold text-sm text-foreground">{reportData.companyName} <span className="text-[10px] text-muted-foreground">/ Performance Report</span></span>
          </div>

          <div className="flex items-center gap-2">
            {reportData.shareLink.allowPdfDownload && (
              <a
                href={`/api/reports/preview?reportId=${reportData.reportId}&format=pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-3.5 py-2 rounded-xl transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> PDF Download
              </a>
            )}
            {reportData.shareLink.allowExcelDownload && (
              <a
                href={`/api/reports/preview?reportId=${reportData.reportId}&format=excel`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Excel Download
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title Card */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full capitalize">
              {reportData.reportType} Performance Report
            </span>
            <span className="text-[10px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Secure Verified Report
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{reportData.reportTitle}</h1>
          
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
            <Calendar className="w-4 h-4 text-primary" />
            Reporting Period: {new Date(reportData.periodStart).toLocaleDateString()} – {new Date(reportData.periodEnd).toLocaleDateString()}
          </p>
        </div>

        {/* Language Selection */}
        <LanguageSelector
          selectedLanguage={lang}
          onChangeLanguage={setLang}
          pdfMode={pdfMode}
          onChangePdfMode={setPdfMode}
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-card border border-border/60 rounded-xl space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{getDictionary(lang).metrics.audienceTotal}</span>
            <span className="block text-2xl font-extrabold text-foreground">{Number(overall.audienceTotal?.currentValue || 0).toLocaleString()}</span>
          </div>
          <div className="p-4 bg-card border border-border/60 rounded-xl space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{getDictionary(lang).metrics.views}</span>
            <span className="block text-2xl font-extrabold text-foreground">{Number(overall.views?.currentValue || 0).toLocaleString()}</span>
          </div>
          <div className="p-4 bg-card border border-border/60 rounded-xl space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{getDictionary(lang).metrics.engagements}</span>
            <span className="block text-2xl font-extrabold text-foreground">{Number(overall.engagements?.currentValue || 0).toLocaleString()}</span>
          </div>
          <div className="p-4 bg-card border border-border/60 rounded-xl space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{getDictionary(lang).metrics.reach}</span>
            <span className="block text-2xl font-extrabold text-foreground">{Number(overall.reach?.currentValue || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Executive Summary */}
        {Boolean(reportData.snapshot?.executiveSummary) && (
          <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-3 shadow-sm">
            <h3 className="text-base font-bold text-foreground">{getDictionary(lang).executiveSummary}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {translateStatementText(String(reportData.snapshot.executiveSummary), lang)}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
