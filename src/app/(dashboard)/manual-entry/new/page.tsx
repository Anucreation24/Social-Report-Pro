'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCompany } from '@/components/providers/CompanyProvider'
import { saveManualKPIEntryAction, saveManualContentEntryAction, ManualContentItem } from '@/features/manual-entry/actions'
import { 
  Edit3, ArrowLeft, Loader2, AlertCircle, CheckCircle2, 
  Plus, Trash2, Copy, FileText, Send, Calendar
} from 'lucide-react'

type PlatformType = 'facebook' | 'instagram' | 'youtube' | 'tiktok'
type GranularityType = 'daily' | 'weekly' | 'monthly' | 'lifetime'

const PLATFORMS: Array<{ id: PlatformType; name: string }> = [
  { id: 'facebook', name: 'Facebook' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'tiktok', name: 'TikTok' }
]

export default function ManualEntryPage() {
  const { activeCompany } = useCompany()
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialPlatform = (searchParams.get('platform') as PlatformType) || 'facebook'

  const [activeTab, setActiveTab] = useState<'kpi' | 'content'>('kpi')
  const [platform, setPlatform] = useState<PlatformType>(initialPlatform)

  // KPI Form State
  const [snapshotDate, setSnapshotDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [granularity, setGranularity] = useState<GranularityType>('monthly')
  const [audienceTotal, setAudienceTotal] = useState<string>('')
  const [audienceGained, setAudienceGained] = useState<string>('')
  const [audienceLost, setAudienceLost] = useState<string>('')
  const [reach, setReach] = useState<string>('')
  const [impressions, setImpressions] = useState<string>('')
  const [views, setViews] = useState<string>('')
  const [engagements, setEngagements] = useState<string>('')
  const [likes, setLikes] = useState<string>('')
  const [comments, setComments] = useState<string>('')
  const [shares, setShares] = useState<string>('')
  const [saves, setSaves] = useState<string>('')
  const [clicks, setClicks] = useState<string>('')
  const [profileViews, setProfileViews] = useState<string>('')
  const [watchTimeMinutes, setWatchTimeMinutes] = useState<string>('')
  const [contentPublished, setContentPublished] = useState<string>('')
  const [kpiNotes, setKpiNotes] = useState<string>('')

  // Bulk Content State
  const [contentItems, setContentItems] = useState<ManualContentItem[]>([
    {
      id: '1',
      title: 'July Special Announcement Post',
      contentType: 'post',
      publishedAt: new Date().toISOString().split('T')[0],
      views: 1500,
      likes: 120,
      comments: 15,
      shares: 8
    }
  ])

  // General state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const parseNullableNum = (val: string): number | null => {
    if (!val || val.trim() === '') return null
    const num = parseFloat(val.replace(/,/g, ''))
    return isNaN(num) ? null : num
  }

  const handleSaveKPI = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCompany) return

    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await saveManualKPIEntryAction({
        companyId: activeCompany.id,
        platform,
        snapshotDate,
        granularity,
        audienceTotal: parseNullableNum(audienceTotal),
        audienceGained: parseNullableNum(audienceGained),
        audienceLost: parseNullableNum(audienceLost),
        reach: parseNullableNum(reach),
        impressions: parseNullableNum(impressions),
        views: parseNullableNum(views),
        engagements: parseNullableNum(engagements),
        likes: parseNullableNum(likes),
        comments: parseNullableNum(comments),
        shares: parseNullableNum(shares),
        saves: parseNullableNum(saves),
        clicks: parseNullableNum(clicks),
        profileViews: parseNullableNum(profileViews),
        watchTimeSeconds: watchTimeMinutes ? (parseNullableNum(watchTimeMinutes) || 0) * 60 : null,
        contentPublished: parseNullableNum(contentPublished),
        notes: kpiNotes
      })

      setSuccessMsg(`Successfully saved ${res.count} manual KPI metrics for ${platform.toUpperCase()}!`)
    } catch (err: unknown) {
      console.error('KPI save error:', err)
      setError((err as Error).message || 'Failed to save manual KPI entries.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddContentRow = () => {
    setContentItems(prev => [
      ...prev,
      {
        id: String(Date.now()),
        title: '',
        contentType: 'post',
        publishedAt: new Date().toISOString().split('T')[0],
        views: null,
        likes: null,
        comments: null
      }
    ])
  }

  const handleDuplicateContentRow = (idx: number) => {
    const target = contentItems[idx]
    if (!target) return
    const cloned = { ...target, id: String(Date.now()), title: `${target.title} (Copy)` }
    const updated = [...contentItems]
    updated.splice(idx + 1, 0, cloned)
    setContentItems(updated)
  }

  const handleDeleteContentRow = (idx: number) => {
    if (contentItems.length <= 1) return
    setContentItems(prev => prev.filter((_, i) => i !== idx))
  }

  const handleUpdateContentField = (idx: number, field: keyof ManualContentItem, value: unknown) => {
    setContentItems(prev =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    )
  }

  const handleSaveContentItems = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCompany) return

    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await saveManualContentEntryAction({
        companyId: activeCompany.id,
        platform,
        items: contentItems
      })

      setSuccessMsg(`Successfully saved ${res.count} manual content performance records for ${platform.toUpperCase()}!`)
    } catch (err: unknown) {
      console.error('Content save error:', err)
      setError((err as Error).message || 'Failed to save manual content records.')
    } finally {
      setLoading(false)
    }
  }

  if (!activeCompany) return null

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/connections" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Connections & Data
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Manual KPI & Content Entry</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manually enter high-level account performance KPIs or bulk content metrics for {activeCompany.name}.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Error</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Success</h4>
            <p className="mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-2">
        <button
          onClick={() => setActiveTab('kpi')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'kpi'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          Account KPI Entry Form
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'content'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          Bulk Content Performance Entry
        </button>
      </div>

      {/* Target Platform Selector */}
      <div className="bg-card border border-border/60 rounded-xl p-4 flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">Target Platform:</span>
        <div className="flex items-center gap-2">
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlatform(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                platform === p.id
                  ? 'bg-primary/10 border border-primary text-primary'
                  : 'bg-muted/40 border border-border/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Account KPI Entry Form */}
      {activeTab === 'kpi' && (
        <form onSubmit={handleSaveKPI} className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-border/40 pb-5">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Snapshot / Data Date</label>
              <input
                type="date"
                required
                value={snapshotDate}
                onChange={e => setSnapshotDate(e.target.value)}
                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">Data Granularity</label>
              <select
                value={granularity}
                onChange={e => setGranularity(e.target.value as GranularityType)}
                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="daily">Daily Snapshot</option>
                <option value="weekly">Weekly Rollup</option>
                <option value="monthly">Monthly Aggregate</option>
                <option value="lifetime">Lifetime Total</option>
              </select>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Account Metrics (Leave blank if unavailable)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Total Audience (Followers)</label>
                <input
                  type="text"
                  placeholder="e.g. 12,500"
                  value={audienceTotal}
                  onChange={e => setAudienceTotal(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Audience Gained</label>
                <input
                  type="text"
                  placeholder="e.g. 250"
                  value={audienceGained}
                  onChange={e => setAudienceGained(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Audience Lost</label>
                <input
                  type="text"
                  placeholder="e.g. 40"
                  value={audienceLost}
                  onChange={e => setAudienceLost(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Total Reach</label>
                <input
                  type="text"
                  placeholder="e.g. 45,000"
                  value={reach}
                  onChange={e => setReach(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Total Impressions</label>
                <input
                  type="text"
                  placeholder="e.g. 68,000"
                  value={impressions}
                  onChange={e => setImpressions(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Total Video / Post Views</label>
                <input
                  type="text"
                  placeholder="e.g. 18,400"
                  value={views}
                  onChange={e => setViews(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Total Engagements</label>
                <input
                  type="text"
                  placeholder="e.g. 3,200"
                  value={engagements}
                  onChange={e => setEngagements(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Likes / Reactions</label>
                <input
                  type="text"
                  placeholder="e.g. 2,100"
                  value={likes}
                  onChange={e => setLikes(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Comments</label>
                <input
                  type="text"
                  placeholder="e.g. 450"
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Shares / Reposts</label>
                <input
                  type="text"
                  placeholder="e.g. 180"
                  value={shares}
                  onChange={e => setShares(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Saves / Bookmarks</label>
                <input
                  type="text"
                  placeholder="e.g. 320"
                  value={saves}
                  onChange={e => setSaves(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Clicks / Link Clicks</label>
                <input
                  type="text"
                  placeholder="e.g. 540"
                  value={clicks}
                  onChange={e => setClicks(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Profile / Channel Views</label>
                <input
                  type="text"
                  placeholder="e.g. 890"
                  value={profileViews}
                  onChange={e => setProfileViews(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Watch Time (Minutes)</label>
                <input
                  type="text"
                  placeholder="e.g. 12,400"
                  value={watchTimeMinutes}
                  onChange={e => setWatchTimeMinutes(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Content Published (Count)</label>
                <input
                  type="text"
                  placeholder="e.g. 12"
                  value={contentPublished}
                  onChange={e => setContentPublished(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">Data Reference / Audit Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Manual entry from client monthly PDF report export provided on July 25"
              value={kpiNotes}
              onChange={e => setKpiNotes(e.target.value)}
              className="w-full bg-muted/40 border border-border/60 rounded-xl p-3 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-border/40">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl disabled:opacity-50 cursor-pointer transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Entry...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Save Manual KPI Entry
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Bulk Content Entry */}
      {activeTab === 'content' && (
        <form onSubmit={handleSaveContentItems} className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bulk Content Records ({contentItems.length} items)</h4>
            <button
              type="button"
              onClick={handleAddContentRow}
              className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Post Row
            </button>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {contentItems.map((item, idx) => (
              <div key={item.id || idx} className="p-4 bg-muted/30 border border-border/40 rounded-xl space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-primary">Item #{idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDuplicateContentRow(idx)}
                      className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="Duplicate row"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {contentItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteContentRow(idx)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Delete row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-foreground mb-1">Post Title / Headline *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Summer Campaign Teaser Video"
                      value={item.title}
                      onChange={e => handleUpdateContentField(idx, 'title', e.target.value)}
                      className="w-full bg-background border border-border/60 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">Content Type</label>
                    <select
                      value={item.contentType}
                      onChange={e => handleUpdateContentField(idx, 'contentType', e.target.value)}
                      className="w-full bg-background border border-border/60 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary"
                    >
                      <option value="post">Post / Image</option>
                      <option value="reel">Reel / Short Video</option>
                      <option value="video">Long Video</option>
                      <option value="story">Story</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">Published Date *</label>
                    <input
                      type="date"
                      required
                      value={item.publishedAt}
                      onChange={e => handleUpdateContentField(idx, 'publishedAt', e.target.value)}
                      className="w-full bg-background border border-border/60 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">Views</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={item.views ?? ''}
                      onChange={e => handleUpdateContentField(idx, 'views', parseNullableNum(e.target.value))}
                      className="w-full bg-background border border-border/60 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">Likes</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={item.likes ?? ''}
                      onChange={e => handleUpdateContentField(idx, 'likes', parseNullableNum(e.target.value))}
                      className="w-full bg-background border border-border/60 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">Comments</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={item.comments ?? ''}
                      onChange={e => handleUpdateContentField(idx, 'comments', parseNullableNum(e.target.value))}
                      className="w-full bg-background border border-border/60 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">Shares</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={item.shares ?? ''}
                      onChange={e => handleUpdateContentField(idx, 'shares', parseNullableNum(e.target.value))}
                      className="w-full bg-background border border-border/60 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-border/40">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl disabled:opacity-50 cursor-pointer transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Items...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Save Content Items
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
