'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useCompany } from '@/components/providers/CompanyProvider'
import { uploadAndParseImportFileAction, confirmImportBatchAction, createImportProfileFromBatchAction } from '@/features/imports/actions'
import { FieldMapping, NormalizedField } from '@/lib/imports/column-mapping'
import { TEMPLATE_DEFINITIONS } from '@/lib/imports/templates'
import { 
  ArrowLeft, UploadCloud, Loader2, AlertCircle, CheckCircle2, 
  Download, FileText, ChevronRight, Sparkles, Save, Shield, Calendar, Info, X
} from 'lucide-react'

type PlatformType = 'facebook' | 'instagram' | 'youtube' | 'tiktok'
type ImportCategory = 'account_summary' | 'daily_overview' | 'content_performance' | 'video_performance' | 'audience_growth' | 'generic_metrics'

const PLATFORM_OPTIONS: Array<{ id: PlatformType; name: string }> = [
  { id: 'facebook', name: 'Facebook' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'tiktok', name: 'TikTok' }
]

const NORMALIZED_FIELD_OPTIONS: Array<{ id: NormalizedField; label: string }> = [
  { id: 'date', label: 'Date (Snapshot Date)' },
  { id: 'audience_total', label: 'Audience Total (Followers/Subscribers)' },
  { id: 'audience_gained', label: 'Audience Gained' },
  { id: 'audience_lost', label: 'Audience Lost' },
  { id: 'reach', label: 'Reach' },
  { id: 'impressions', label: 'Impressions' },
  { id: 'views', label: 'Views (Video Views / Page Views)' },
  { id: 'engagements', label: 'Engagements' },
  { id: 'likes', label: 'Likes' },
  { id: 'comments', label: 'Comments' },
  { id: 'shares', label: 'Shares' },
  { id: 'saves', label: 'Saves' },
  { id: 'clicks', label: 'Clicks' },
  { id: 'profile_views', label: 'Profile Views' },
  { id: 'watch_time_seconds', label: 'Watch Time (Seconds)' },
  { id: 'content_id', label: 'Content ID (Post / Video ID)' },
  { id: 'title', label: 'Content Title' },
  { id: 'caption', label: 'Caption Excerpt' },
  { id: 'published_at', label: 'Published At' },
  { id: 'content_type', label: 'Content Type' },
  { id: 'permalink', label: 'Permalink URL' },
  { id: 'ignore', label: '-- Ignore Column --' }
]

export default function UniversalImportPage() {
  const { activeCompany } = useCompany()

  // Step Control (1 to 5)
  const [step, setStep] = useState<number>(1)
  const [platform, setPlatform] = useState<PlatformType>('tiktok')
  const [importType, setImportType] = useState<ImportCategory>('daily_overview')
  const [dateFormatPref] = useState<'auto' | 'DMY' | 'MDY'>('auto')
  const [selectedYear, setSelectedYear] = useState<number>(2026)

  // Templates Modal State
  const [showTemplatesModal, setShowTemplatesModal] = useState<boolean>(false)

  // Upload & Detection State
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  const [parsingError, setParsingError] = useState<string | null>(null)

  // Parsed Result State
  const [parsedData, setParsedData] = useState<{
    batchId: string
    fileName: string
    fileSignature?: string
    headers: string[]
    totalRows: number
    sampleRows: Record<string, unknown>[]
    detectedPlatformInfo?: {
      detectedPlatform: string
      confidence: number
      confidenceLevel: string
      matchedSignals: string[]
      requiresConfirmation: boolean
    }
    detectedReportTypeInfo?: {
      detectedReportType: string
      confidence: number
      matchedReason: string
    }
    matchedProfile?: {
      id: string
      profile_name: string
      mapping_config: FieldMapping[]
    } | null
    detectedMappings: FieldMapping[]
  } | null>(null)

  // Mapping state
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [profileName, setProfileName] = useState<string>('')
  const [savingProfile, setSavingProfile] = useState<boolean>(false)
  const [profileSaved, setProfileSaved] = useState<boolean>(false)

  // Import Execution State
  const [confirming, setConfirming] = useState<boolean>(false)
  const [importResult, setImportResult] = useState<{
    batchId: string
    status: string
    totalRows: number
    importedRows: number
    validRows: number
    invalidRows: number
    warningRows: number
  } | null>(null)

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !activeCompany) return

    setUploading(true)
    setParsingError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('companyId', activeCompany.id)

      const result = await uploadAndParseImportFileAction(formData)
      setParsedData(result as unknown as typeof parsedData)
      setPlatform((result.platform as PlatformType) || 'tiktok')
      setImportType((result.importType as ImportCategory) || 'daily_overview')
      setMappings(result.detectedMappings)
      setStep(2)
    } catch (err: unknown) {
      console.error('Upload parse error:', err)
      setParsingError((err as Error).message || 'Failed to upload and parse file.')
    } finally {
      setUploading(false)
    }
  }

  const handleMappingChange = (fileColumn: string, newField: NormalizedField) => {
    setMappings(prev =>
      prev.map(m =>
        m.fileColumn === fileColumn
          ? { ...m, mappedField: newField, confidence: 'high', autoMapped: false }
          : m
      )
    )
  }

  const handleSaveImportProfile = async () => {
    if (!parsedData || !activeCompany || !profileName.trim()) return
    setSavingProfile(true)
    try {
      await createImportProfileFromBatchAction(
        activeCompany.id,
        platform,
        profileName.trim(),
        importType,
        parsedData.fileSignature || 'sig',
        parsedData.headers,
        mappings,
        dateFormatPref
      )
      setProfileSaved(true)
    } catch (err: unknown) {
      console.error('Save profile error:', err)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleExecuteImport = async () => {
    if (!parsedData || !activeCompany) return

    setConfirming(true)
    setParsingError(null)

    try {
      const res = await confirmImportBatchAction({
        batchId: parsedData.batchId,
        companyId: activeCompany.id,
        platform,
        importType,
        mappings,
        rawRows: parsedData.sampleRows,
        dateFormatPreference: dateFormatPref,
        selectedYear
      })

      setImportResult(res)
      setStep(5)
    } catch (err: unknown) {
      console.error('Import execution error:', err)
      setParsingError((err as Error).message || 'Failed to execute import.')
    } finally {
      setConfirming(false)
    }
  }

  // Detect if raw sample rows have dates missing year (e.g. "October 1")
  const isDateMissingYear = React.useMemo(() => {
    if (!parsedData || !parsedData.sampleRows || parsedData.sampleRows.length === 0) return false
    const dateMapping = mappings.find(m => m.mappedField === 'date')
    if (!dateMapping) return false
    const sampleVal = String(parsedData.sampleRows[0][dateMapping.fileColumn] || '')
    return /^([A-Za-z]+)\s+(\d{1,2})$/.test(sampleVal) || /^(\d{1,2})\s+([A-Za-z]+)$/.test(sampleVal)
  }, [parsedData, mappings])

  // Compute derived & unavailable metrics for preview
  const previewMetricsSummary = React.useMemo(() => {
    if (!mappings || mappings.length === 0) return { mapped: [], derived: [], unavailable: [] }
    const mappedFields = new Set<NormalizedField>(mappings.map(m => m.mappedField).filter(f => f !== 'ignore'))
    
    const isEngagementsMapped = mappedFields.has('engagements')
    const hasLikes = mappedFields.has('likes')
    const hasComments = mappedFields.has('comments')
    const hasShares = mappedFields.has('shares')

    const derived: string[] = []
    if (!isEngagementsMapped && (hasLikes || hasComments || hasShares)) {
      derived.push('Engagements = Likes + Comments + Shares')
    }

    const allStandardAccountMetrics: NormalizedField[] = ['audience_total', 'reach', 'impressions', 'views', 'engagements', 'likes', 'comments', 'shares', 'profile_views']
    const unavailable = allStandardAccountMetrics.filter(m => !mappedFields.has(m) && !(m === 'engagements' && derived.length > 0))

    return {
      mapped: Array.from(mappedFields),
      derived,
      unavailable
    }
  }, [mappings])

  if (!activeCompany) return null

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/connections" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Platform Connections
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Universal Data Import Wizard</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Upload any social media CSV/XLSX export with automatic platform detection, report type detection, and reusable import profiles for {activeCompany.name}.
          </p>
        </div>
      </div>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold border-b border-border/50 pb-4">
        <div className={`p-2 rounded-lg border ${step === 1 ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border/40 text-muted-foreground'}`}>
          1. Upload File
        </div>
        <div className={`p-2 rounded-lg border ${step === 2 ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border/40 text-muted-foreground'}`}>
          2. Platform & Type
        </div>
        <div className={`p-2 rounded-lg border ${step === 3 ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border/40 text-muted-foreground'}`}>
          3. Column Mapping
        </div>
        <div className={`p-2 rounded-lg border ${step === 4 ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border/40 text-muted-foreground'}`}>
          4. Validation & Preview
        </div>
        <div className={`p-2 rounded-lg border ${step === 5 ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-muted/30 border-border/40 text-muted-foreground'}`}>
          5. Result Summary
        </div>
      </div>

      {parsingError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Import Error</h4>
            <p className="mt-0.5">{parsingError}</p>
          </div>
        </div>
      )}

      {/* STEP 1: Universal File Upload */}
      {step === 1 && (
        <form onSubmit={handleFileUpload} className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Select or Drop Export File</h3>
            <button
              type="button"
              onClick={() => setShowTemplatesModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download Import Templates
            </button>
          </div>

          <div className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-10 text-center bg-muted/20 transition-all">
            <UploadCloud className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">Upload TikTok, Meta, YouTube, or Instagram Export</p>
            <p className="text-xs text-muted-foreground mt-1">Supports TikTok Overview.csv, Facebook & YouTube exports (.csv, .xlsx up to 10 MB)</p>

            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="mt-4 block mx-auto text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />

            {file && (
              <div className="mt-4 p-3 bg-muted/50 border border-border/40 rounded-xl inline-flex items-center gap-2 text-xs font-semibold text-foreground">
                <FileText className="w-4 h-4 text-primary" />
                <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-border/40">
            <button
              type="submit"
              disabled={!file || uploading}
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-6 py-2.5 rounded-xl disabled:opacity-50 cursor-pointer transition-colors shadow-sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Auto-Detecting Platform & Signals...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Auto-Detect & Process File <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Platform & Report Type Confirmation */}
      {step === 2 && parsedData && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Platform Signal Detector Results
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                (parsedData.detectedPlatformInfo?.confidence || 0) >= 0.8
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}>
                {Math.round((parsedData.detectedPlatformInfo?.confidence || 0.85) * 100)}% Confidence ({parsedData.detectedPlatformInfo?.confidenceLevel || 'High'})
              </span>
            </div>
            <p className="text-xs text-foreground font-medium">
              Detected Platform: <strong className="capitalize text-primary">{parsedData.detectedPlatformInfo?.detectedPlatform || platform}</strong> | Report Category: <strong className="capitalize text-primary">{String(parsedData.detectedReportTypeInfo?.detectedReportType || importType).replace('_', ' ')}</strong>
            </p>
          </div>

          {parsedData.matchedProfile && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs rounded-xl flex items-start gap-3">
              <Shield className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold">Saved Import Profile Matched!</h4>
                <p className="mt-0.5">Applied saved mapping profile: <strong>{String(parsedData.matchedProfile.profile_name)}</strong></p>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <h3 className="text-base font-bold text-foreground">Confirm Target Platform</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PLATFORM_OPTIONS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    platform === p.id
                      ? 'bg-primary/10 border-primary text-primary font-bold'
                      : 'bg-muted/30 border-border/60 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <span className="capitalize text-xs">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border/40">
            <h3 className="text-base font-bold text-foreground">Confirm Report Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 ${
                importType === 'daily_overview' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border/60 text-muted-foreground'
              }`}>
                <input
                  type="radio"
                  name="importType"
                  value="daily_overview"
                  checked={importType === 'daily_overview'}
                  onChange={() => setImportType('daily_overview')}
                />
                <span className="text-xs font-bold text-foreground">Daily Overview (TikTok Overview.csv / Video & Profile Views)</span>
              </label>

              <label className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 ${
                importType === 'account_summary' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border/60 text-muted-foreground'
              }`}>
                <input
                  type="radio"
                  name="importType"
                  value="account_summary"
                  checked={importType === 'account_summary'}
                  onChange={() => setImportType('account_summary')}
                />
                <span className="text-xs font-bold text-foreground">Account Summary (Followers, Reach, Total Views)</span>
              </label>

              <label className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 ${
                importType === 'content_performance' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border/60 text-muted-foreground'
              }`}>
                <input
                  type="radio"
                  name="importType"
                  value="content_performance"
                  checked={importType === 'content_performance'}
                  onChange={() => setImportType('content_performance')}
                />
                <span className="text-xs font-bold text-foreground">Content Performance (Individual Post Metrics)</span>
              </label>

              <label className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 ${
                importType === 'video_performance' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border/60 text-muted-foreground'
              }`}>
                <input
                  type="radio"
                  name="importType"
                  value="video_performance"
                  checked={importType === 'video_performance'}
                  onChange={() => setImportType('video_performance')}
                />
                <span className="text-xs font-bold text-foreground">Video Performance (Watch Time & Video Metrics)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/40">
            <button
              onClick={() => setStep(1)}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-secondary text-secondary-foreground border border-border/60 hover:bg-secondary/80"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              Next: Column Mapping <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Column Mapping Editor */}
      {step === 3 && parsedData && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Review Column Mappings</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verify headers for <strong>{parsedData.fileName}</strong> ({parsedData.totalRows} rows).
            </p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {mappings.map(m => (
              <div key={m.fileColumn} className="p-3 bg-muted/30 border border-border/40 rounded-xl flex items-center justify-between gap-4">
                <div className="min-w-[200px]">
                  <span className="font-mono text-xs font-bold text-foreground">{m.fileColumn}</span>
                </div>

                <div className="flex-1 max-w-sm">
                  <select
                    value={m.mappedField}
                    onChange={e => handleMappingChange(m.fileColumn, e.target.value as NormalizedField)}
                    className="w-full bg-background border border-border/60 rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                  >
                    {NORMALIZED_FIELD_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-muted/40 border border-border/40 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Save className="w-4 h-4 text-primary" /> Save as Reusable Import Profile
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Profile Name (e.g. TikTok Daily Overview Export)"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                className="flex-1 bg-background border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleSaveImportProfile}
                disabled={savingProfile || profileSaved || !profileName.trim()}
                className="inline-flex items-center gap-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold text-xs px-4 py-1.5 rounded-xl border border-border/60 disabled:opacity-50 cursor-pointer"
              >
                {profileSaved ? 'Profile Saved!' : 'Save Profile'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/40">
            <button
              onClick={() => setStep(2)}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-secondary text-secondary-foreground border border-border/60 hover:bg-secondary/80"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              Next: Validation & Preview <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Validation & Preview */}
      {step === 4 && parsedData && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Data Validation & Preview</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review normalized metrics for <strong>{platform.toUpperCase()}</strong> ({importType.replace('_', ' ')}) before database commit.
            </p>
          </div>

          {/* Missing Year Confirmation Alert */}
          {isDateMissingYear && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Detected date format: MMMM D (Missing Year)</span>
              </div>
              <p className="text-xs text-foreground/80">
                Source date entries do not contain a year (e.g. &quot;October 1&quot;). Please confirm reporting year:
              </p>
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs font-bold text-foreground">Selected Year:</label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="bg-background border border-border/60 rounded-lg px-3 py-1 text-xs font-bold text-foreground"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                  <option value={2023}>2023</option>
                </select>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  (Preview Normalized Date: {selectedYear}-10-01)
                </span>
              </div>
            </div>
          )}

          {/* Derived & Unavailable Metrics Banner */}
          <div className="p-4 bg-muted/40 border border-border/40 rounded-xl space-y-2 text-xs">
            {previewMetricsSummary.derived.length > 0 && (
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Derived Metric: {previewMetricsSummary.derived.join(', ')}</span>
              </div>
            )}
            {previewMetricsSummary.unavailable.length > 0 && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                <div>
                  <span className="font-bold text-foreground">Unavailable Metrics: </span>
                  <span className="capitalize">{previewMetricsSummary.unavailable.map(m => m.replace('_', ' ')).join(', ')}</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">
                    Displayed as <strong>&quot;Not provided in source file&quot;</strong> (preserved as NULL, not zero).
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto max-h-72 border border-border/40 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border/40">
                <tr>
                  <th className="p-2.5">#</th>
                  {mappings.filter(m => m.mappedField !== 'ignore').map(m => (
                    <th key={m.fileColumn} className="p-2.5">{m.mappedField}</th>
                  ))}
                  {previewMetricsSummary.derived.length > 0 && <th className="p-2.5 text-purple-400">engagements (derived)</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {parsedData.sampleRows.map((row, idx) => {
                  const likes = Number(row['Likes'] ?? row['likes'] ?? 0)
                  const comments = Number(row['Comments'] ?? row['comments'] ?? 0)
                  const shares = Number(row['Shares'] ?? row['shares'] ?? 0)
                  const derivedEng = likes + comments + shares

                  return (
                    <tr key={idx} className="hover:bg-muted/20">
                      <td className="p-2.5 font-bold text-muted-foreground">{idx + 1}</td>
                      {mappings.filter(m => m.mappedField !== 'ignore').map(m => (
                        <td key={m.fileColumn} className="p-2.5 font-mono text-[11px]">
                          {String(row[m.fileColumn] ?? '-')}
                        </td>
                      ))}
                      {previewMetricsSummary.derived.length > 0 && (
                        <td className="p-2.5 font-mono text-[11px] text-purple-400 font-bold">
                          {derivedEng}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/40">
            <button
              onClick={() => setStep(3)}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-secondary text-secondary-foreground border border-border/60 hover:bg-secondary/80"
            >
              Back
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={confirming}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl disabled:opacity-50 cursor-pointer transition-colors shadow-sm"
            >
              {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Confirm & Import
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Result Summary */}
      {step === 5 && importResult && (
        <div className="bg-card border border-border/60 rounded-2xl p-8 text-center space-y-6">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-2xl font-extrabold tracking-tight text-foreground">Import Batch Completed!</h3>
            <p className="text-xs text-muted-foreground mt-1">Successfully ingested {importResult.importedRows} rows into Social Report Pro database.</p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4 border-t border-border/40">
            <Link href="/dashboard" className="bg-primary text-primary-foreground font-bold text-xs px-5 py-2.5 rounded-xl">
              Dashboard
            </Link>
            <Link href="/analytics" className="bg-secondary text-secondary-foreground font-bold text-xs px-5 py-2.5 rounded-xl border border-border/60">
              Analytics
            </Link>
          </div>
        </div>
      )}

      {/* Download Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" /> Download Import Templates
              </h3>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-muted-foreground">Select a platform and report format template to download:</p>

              {/* TikTok */}
              <div className="p-3.5 bg-muted/40 border border-border/40 rounded-xl space-y-2">
                <span className="font-bold text-foreground flex items-center gap-1.5 text-sm">🎵 TikTok Templates</span>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="/api/templates/download?template=tiktok_daily_overview&format=csv&sample=true"
                    download
                    className="p-2.5 bg-background border border-border/60 rounded-lg hover:border-primary font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>Daily Overview (.csv)</span>
                    <Download className="w-3.5 h-3.5 text-primary" />
                  </a>
                  <a
                    href="/api/templates/download?template=tiktok_video_performance&format=csv&sample=true"
                    download
                    className="p-2.5 bg-background border border-border/60 rounded-lg hover:border-primary font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>Video Performance (.csv)</span>
                    <Download className="w-3.5 h-3.5 text-primary" />
                  </a>
                </div>
              </div>

              {/* Facebook */}
              <div className="p-3.5 bg-muted/40 border border-border/40 rounded-xl space-y-2">
                <span className="font-bold text-foreground flex items-center gap-1.5 text-sm">📘 Facebook Templates</span>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="/api/templates/download?template=facebook_account_summary&format=csv&sample=true"
                    download
                    className="p-2.5 bg-background border border-border/60 rounded-lg hover:border-primary font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>Account Summary (.csv)</span>
                    <Download className="w-3.5 h-3.5 text-primary" />
                  </a>
                  <a
                    href="/api/templates/download?template=facebook_content_performance&format=csv&sample=true"
                    download
                    className="p-2.5 bg-background border border-border/60 rounded-lg hover:border-primary font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>Content Performance (.csv)</span>
                    <Download className="w-3.5 h-3.5 text-primary" />
                  </a>
                </div>
              </div>

              {/* Instagram */}
              <div className="p-3.5 bg-muted/40 border border-border/40 rounded-xl space-y-2">
                <span className="font-bold text-foreground flex items-center gap-1.5 text-sm">📸 Instagram Templates</span>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="/api/templates/download?template=instagram_account_summary&format=csv&sample=true"
                    download
                    className="p-2.5 bg-background border border-border/60 rounded-lg hover:border-primary font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>Account Summary (.csv)</span>
                    <Download className="w-3.5 h-3.5 text-primary" />
                  </a>
                  <a
                    href="/api/templates/download?template=instagram_content_performance&format=csv&sample=true"
                    download
                    className="p-2.5 bg-background border border-border/60 rounded-lg hover:border-primary font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>Content Performance (.csv)</span>
                    <Download className="w-3.5 h-3.5 text-primary" />
                  </a>
                </div>
              </div>

              {/* YouTube */}
              <div className="p-3.5 bg-muted/40 border border-border/40 rounded-xl space-y-2">
                <span className="font-bold text-foreground flex items-center gap-1.5 text-sm">▶️ YouTube Templates</span>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="/api/templates/download?template=youtube_channel_summary&format=csv&sample=true"
                    download
                    className="p-2.5 bg-background border border-border/60 rounded-lg hover:border-primary font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>Channel Summary (.csv)</span>
                    <Download className="w-3.5 h-3.5 text-primary" />
                  </a>
                  <a
                    href="/api/templates/download?template=youtube_video_performance&format=csv&sample=true"
                    download
                    className="p-2.5 bg-background border border-border/60 rounded-lg hover:border-primary font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>Video Performance (.csv)</span>
                    <Download className="w-3.5 h-3.5 text-primary" />
                  </a>
                </div>
              </div>

              {/* Generic */}
              <div className="p-3.5 bg-muted/40 border border-border/40 rounded-xl space-y-2">
                <span className="font-bold text-foreground flex items-center gap-1.5 text-sm">📊 Generic Templates</span>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="/api/templates/download?template=generic_account_metrics&format=csv&sample=true"
                    download
                    className="p-2.5 bg-background border border-border/60 rounded-lg hover:border-primary font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>Account Metrics (.csv)</span>
                    <Download className="w-3.5 h-3.5 text-primary" />
                  </a>
                  <a
                    href="/api/templates/download?template=generic_content_metrics&format=csv&sample=true"
                    download
                    className="p-2.5 bg-background border border-border/60 rounded-lg hover:border-primary font-semibold text-foreground flex items-center justify-between"
                  >
                    <span>Content Metrics (.csv)</span>
                    <Download className="w-3.5 h-3.5 text-primary" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border/60">
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="bg-secondary text-secondary-foreground font-bold text-xs px-4 py-2 rounded-xl border border-border/60"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
