'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCompany } from '@/components/providers/CompanyProvider'
import { uploadAndParseImportFileAction, confirmImportBatchAction } from '@/features/imports/actions'
import { FieldMapping, NormalizedField } from '@/lib/imports/column-mapping'
import { TEMPLATE_DEFINITIONS } from '@/lib/imports/templates'
import { 
  FileSpreadsheet, ArrowLeft, UploadCloud, Loader2, AlertCircle, CheckCircle2, 
  HelpCircle, Download, FileText, ChevronRight, RefreshCw, AlertTriangle, XCircle
} from 'lucide-react'

type PlatformType = 'facebook' | 'instagram' | 'youtube' | 'tiktok'
type ImportType = 'account_summary' | 'content_performance'

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
  { id: 'views', label: 'Views' },
  { id: 'engagements', label: 'Engagements' },
  { id: 'likes', label: 'Likes' },
  { id: 'comments', label: 'Comments' },
  { id: 'shares', label: 'Shares' },
  { id: 'saves', label: 'Saves' },
  { id: 'clicks', label: 'Clicks' },
  { id: 'profile_views', label: 'Profile Views' },
  { id: 'watch_time_seconds', label: 'Watch Time (Seconds)' },
  { id: 'content_id', label: 'Content ID (Post ID)' },
  { id: 'title', label: 'Content Title' },
  { id: 'caption', label: 'Caption Excerpt' },
  { id: 'published_at', label: 'Published At' },
  { id: 'content_type', label: 'Content Type' },
  { id: 'permalink', label: 'Permalink URL' },
  { id: 'ignore', label: '-- Ignore Column --' }
]

export default function NewImportPage() {
  const { activeCompany } = useCompany()
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialPlatform = (searchParams.get('platform') as PlatformType) || 'facebook'

  // Step Control (1 to 6)
  const [step, setStep] = useState<number>(1)
  const [platform, setPlatform] = useState<PlatformType>(initialPlatform)
  const [importType, setImportType] = useState<ImportType>('account_summary')
  const [periodStart, setPeriodStart] = useState<string>('')
  const [periodEnd, setPeriodEnd] = useState<string>('')
  const [dateFormatPref, setDateFormatPref] = useState<'auto' | 'DMY' | 'MDY'>('auto')

  // Upload & Parser state
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  const [parsingError, setParsingError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<{
    batchId: string
    fileName: string
    fileSizeBytes: number
    checksum: string
    isDuplicateFile: boolean
    existingBatch?: Record<string, unknown>
    headers: string[]
    detectedMappings: FieldMapping[]
    sampleRows: Record<string, unknown>[]
    totalRows: number
  } | null>(null)

  // Mappings State
  const [mappings, setMappings] = useState<FieldMapping[]>([])
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

  useEffect(() => {
    if (parsedData?.detectedMappings) {
      setMappings(parsedData.detectedMappings)
    }
  }, [parsedData])

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !activeCompany) return

    setUploading(true)
    setParsingError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('companyId', activeCompany.id)
      formData.append('platform', platform)
      formData.append('importType', importType)
      if (periodStart) formData.append('periodStart', periodStart)
      if (periodEnd) formData.append('periodEnd', periodEnd)

      const result = await uploadAndParseImportFileAction(formData)
      setParsedData(result)
      setStep(3) // Advance to Column Mapping
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
        rawRows: parsedData.sampleRows, // sample rows or full parsed data
        dateFormatPreference: dateFormatPref
      })

      setImportResult(res)
      setStep(5) // Advance to Summary Result
    } catch (err: unknown) {
      console.error('Import confirmation error:', err)
      setParsingError((err as Error).message || 'Failed to execute import.')
    } finally {
      setConfirming(false)
    }
  }

  const templateKey = `${platform}_${importType}`

  if (!activeCompany) return null

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/connections" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Connections & Data
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Import Analytics File</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Upload CSV or XLSX reports for {activeCompany.name} with column mapping and deduplication.
          </p>
        </div>
      </div>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold border-b border-border/50 pb-4">
        <div className={`p-2 rounded-lg border ${step === 1 ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border/40 text-muted-foreground'}`}>
          1. Platform & Type
        </div>
        <div className={`p-2 rounded-lg border ${step === 2 ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border/40 text-muted-foreground'}`}>
          2. File Upload
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
            <h4 className="font-bold">Import Warning / Error</h4>
            <p className="mt-0.5">{parsingError}</p>
          </div>
        </div>
      )}

      {/* STEP 1: Platform & Import Type Selection */}
      {step === 1 && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-foreground">Select Target Platform</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PLATFORM_OPTIONS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    platform === p.id
                      ? 'bg-primary/10 border-primary text-primary font-bold'
                      : 'bg-muted/30 border-border/60 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <span className="capitalize text-sm">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/40">
            <h3 className="text-base font-bold text-foreground">Select Import Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                importType === 'account_summary' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border/60 text-muted-foreground'
              }`}>
                <input
                  type="radio"
                  name="importType"
                  value="account_summary"
                  checked={importType === 'account_summary'}
                  onChange={() => setImportType('account_summary')}
                  className="mt-1"
                />
                <div>
                  <h4 className="font-bold text-sm text-foreground">Account Summary Metrics</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">High-level page metrics (Followers, Reach, Impressions, Total Views, Engagements).</p>
                </div>
              </label>

              <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                importType === 'content_performance' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border/60 text-muted-foreground'
              }`}>
                <input
                  type="radio"
                  name="importType"
                  value="content_performance"
                  checked={importType === 'content_performance'}
                  onChange={() => setImportType('content_performance')}
                  className="mt-1"
                />
                <div>
                  <h4 className="font-bold text-sm text-foreground">Content Performance (Posts/Videos)</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Individual post analytics (Post Title, Views, Likes, Comments, Shares, Saves, Watch Time).</p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/40">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Reporting Period Start (Optional)</label>
              <input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Reporting Period End (Optional)</label>
              <input
                type="date"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              Next: Upload File <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Upload File & Template Downloads */}
      {step === 2 && (
        <form onSubmit={handleFileUpload} className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Upload CSV or XLSX File</h3>
            {TEMPLATE_DEFINITIONS[templateKey] && (
              <div className="flex items-center gap-2">
                <a
                  href={`/api/templates/download?template=${templateKey}&format=csv&sample=true`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
                  download
                >
                  <Download className="w-3.5 h-3.5" /> CSV Template
                </a>
                <a
                  href={`/api/templates/download?template=${templateKey}&format=xlsx&sample=true`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
                  download
                >
                  <Download className="w-3.5 h-3.5" /> Excel Template
                </a>
              </div>
            )}
          </div>

          <div className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-8 text-center bg-muted/20 transition-all">
            <UploadCloud className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-xs font-bold text-foreground">Drag and drop your file here, or click to browse</p>
            <p className="text-[11px] text-muted-foreground mt-1">Supports .csv or .xlsx up to 10 MB</p>

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

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-secondary text-secondary-foreground border border-border/60 hover:bg-secondary/80 cursor-pointer"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-5 py-2.5 rounded-xl disabled:opacity-50 cursor-pointer transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading & Parsing...
                </>
              ) : (
                <>
                  Parse File & Map Columns <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Column Mapping Editor */}
      {step === 3 && parsedData && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
          {parsedData.isDuplicateFile && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold">Duplicate File Detected</h4>
                <p className="mt-0.5">
                  This file appears to match an existing import batch (<strong>{String(parsedData.existingBatch?.originalFileName || 'Imported File')}</strong> imported on {new Date(String(parsedData.existingBatch?.importedAt || '')).toLocaleDateString()}).
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-base font-bold text-foreground">Map File Columns to Metrics</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review auto-detected metric mappings for <strong>{parsedData.fileName}</strong> ({parsedData.totalRows} rows).
            </p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {mappings.map(m => (
              <div key={m.fileColumn} className="p-3 bg-muted/30 border border-border/40 rounded-xl flex items-center justify-between gap-4">
                <div className="min-w-[200px]">
                  <span className="font-mono text-xs font-bold text-foreground">{m.fileColumn}</span>
                  <span className="block text-[10px] text-muted-foreground">Header in source file</span>
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

                <div>
                  {m.confidence === 'high' ? (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Auto High Match
                    </span>
                  ) : m.confidence === 'medium' ? (
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      Medium Match
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border/40 px-2 py-0.5 rounded-full">
                      Ignored
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/40">
            <button
              onClick={() => setStep(2)}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-secondary text-secondary-foreground border border-border/60 hover:bg-secondary/80 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              Next: Preview Data <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Validation & Preview */}
      {step === 4 && parsedData && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Data Preview & Validation</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review sample parsed records before confirming database insertion.
            </p>
          </div>

          {/* Date format preference selector */}
          <div className="p-3 bg-muted/40 border border-border/40 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-primary" /> Date Format Resolution:
            </span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <input
                  type="radio"
                  name="datePref"
                  value="auto"
                  checked={dateFormatPref === 'auto'}
                  onChange={() => setDateFormatPref('auto')}
                /> Auto (ISO/Standard)
              </label>
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <input
                  type="radio"
                  name="datePref"
                  value="DMY"
                  checked={dateFormatPref === 'DMY'}
                  onChange={() => setDateFormatPref('DMY')}
                /> DD/MM/YYYY
              </label>
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <input
                  type="radio"
                  name="datePref"
                  value="MDY"
                  checked={dateFormatPref === 'MDY'}
                  onChange={() => setDateFormatPref('MDY')}
                /> MM/DD/YYYY
              </label>
            </div>
          </div>

          <div className="overflow-x-auto max-h-72 border border-border/40 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border/40">
                <tr>
                  <th className="p-2.5">#</th>
                  {mappings.filter(m => m.mappedField !== 'ignore').map(m => (
                    <th key={m.fileColumn} className="p-2.5">{m.mappedField}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {parsedData.sampleRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="p-2.5 font-bold text-muted-foreground">{idx + 1}</td>
                    {mappings.filter(m => m.mappedField !== 'ignore').map(m => (
                      <td key={m.fileColumn} className="p-2.5 font-mono text-[11px]">
                        {String(row[m.fileColumn] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/40">
            <button
              onClick={() => setStep(3)}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-secondary text-secondary-foreground border border-border/60 hover:bg-secondary/80 cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={confirming}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl disabled:opacity-50 cursor-pointer transition-colors"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Import Batch...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Confirm & Execute Import
                </>
              )}
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
            <p className="text-xs text-muted-foreground mt-1">
              Successfully processed and saved metrics into Social Report Pro database.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="p-4 bg-muted/30 border border-border/40 rounded-xl text-center">
              <span className="block text-xl font-extrabold text-foreground">{importResult.totalRows}</span>
              <span className="text-[10px] text-muted-foreground font-semibold">Total Rows</span>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
              <span className="block text-xl font-extrabold text-emerald-500">{importResult.importedRows}</span>
              <span className="text-[10px] text-emerald-500 font-semibold">Imported Records</span>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
              <span className="block text-xl font-extrabold text-amber-500">{importResult.warningRows}</span>
              <span className="text-[10px] text-amber-500 font-semibold">Warnings</span>
            </div>
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center">
              <span className="block text-xl font-extrabold text-destructive">{importResult.invalidRows}</span>
              <span className="text-[10px] text-destructive font-semibold">Invalid Rows</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4 border-t border-border/40">
            <Link
              href="/dashboard"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              View Dashboard
            </Link>
            <Link
              href="/analytics"
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold text-xs px-5 py-2.5 rounded-xl border border-border/60 transition-colors"
            >
              View Analytics
            </Link>
            <Link
              href="/reports/generate"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors"
            >
              Generate Report
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
