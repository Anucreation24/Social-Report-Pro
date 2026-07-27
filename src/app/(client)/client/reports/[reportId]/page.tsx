'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, Download, FileText, CheckCircle2, AlertCircle, MessageSquare, 
  Send, Loader2, Calendar, User, ShieldCheck, Check, CornerDownRight
} from 'lucide-react'

interface ClientReportDetailPageProps {
  params: Promise<{ reportId: string }>
}

export default function ClientReportDetailPage({ params }: ClientReportDetailPageProps) {
  const resolvedParams = use(params)
  const reportId = resolvedParams.reportId
  const supabase = createClient()

  const [report, setReport] = useState<Record<string, unknown> | null>(null)
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null)
  const [comments, setComments] = useState<Array<Record<string, unknown>>>([])
  const [reviewStatus, setReviewStatus] = useState<string>('pending')
  const [loading, setLoading] = useState(true)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [revisionNote, setRevisionNote] = useState('')
  const [showRevisionModal, setShowRevisionModal] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)

      // 1. Fetch Report
      const { data: rep } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (rep) {
        setReport(rep)
        setSnapshot(rep.report_snapshot as Record<string, unknown>)

        // 2. Fetch Review Status
        const { data: rev } = await supabase
          .from('client_report_reviews')
          .select('*')
          .eq('generated_report_id', reportId)
          .order('created_at', { ascending: false })
          .limit(1)

        if (rev && rev.length > 0) {
          setReviewStatus(rev[0].status)
        }

        // 3. Fetch Client-Visible Comments ONLY (is_internal = false)
        const { data: comms } = await supabase
          .from('client_report_comments')
          .select('*')
          .eq('generated_report_id', reportId)
          .eq('is_internal', false)
          .order('created_at', { ascending: true })

        if (comms) setComments(comms)
      }
      setLoading(false)
    }

    loadData()
  }, [reportId, supabase])

  const handleApproveReport = async () => {
    if (!report) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('client_report_reviews').insert({
        company_id: report.company_id,
        generated_report_id: report.id,
        status: 'approved',
        client_comment: 'Approved by client',
        reviewed_by: user?.id || null,
        reviewed_at: new Date().toISOString()
      })

      setReviewStatus('approved')
      setActionSuccess('Report approved successfully! Thank you for your review.')
    } catch (err: unknown) {
      console.error('Failed to approve report:', err)
    }
  }

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!report || !revisionNote) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('client_report_reviews').insert({
        company_id: report.company_id,
        generated_report_id: report.id,
        status: 'revision_requested',
        client_comment: revisionNote,
        reviewed_by: user?.id || null,
        reviewed_at: new Date().toISOString()
      })

      // Also post as client visible comment
      await supabase.from('client_report_comments').insert({
        company_id: report.company_id,
        generated_report_id: report.id,
        is_internal: false,
        comment_text: `Revision Request: ${revisionNote}`,
        author_id: user?.id || null,
        author_name: 'Client Reviewer',
        author_role: 'client_viewer'
      })

      setReviewStatus('revision_requested')
      setShowRevisionModal(false)
      setRevisionNote('')
      setActionSuccess('Revision request submitted to marketing team.')
    } catch (err: unknown) {
      console.error('Failed to request revision:', err)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!report || !newComment.trim()) return

    setSubmittingComment(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: comm } = await supabase.from('client_report_comments').insert({
        company_id: report.company_id,
        generated_report_id: report.id,
        is_internal: false, // client visible
        comment_text: newComment.trim(),
        author_id: user?.id || null,
        author_name: 'Client User',
        author_role: 'client_viewer'
      }).select().single()

      if (comm) {
        setComments(prev => [...prev, comm])
        setNewComment('')
      }
    } catch (err: unknown) {
      console.error('Failed to add comment:', err)
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!report || !snapshot) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Report not found.
      </div>
    )
  }

  const overall = (snapshot.overall || {}) as Record<string, { currentValue?: number }>

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link href="/client/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Reports Library
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{String(report.report_title)}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Period: {new Date(String(report.period_start)).toLocaleDateString()} – {new Date(String(report.period_end)).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {Boolean(report.pdf_storage_path) && (
            <a
              href={`/api/reports/preview?reportId=${report.id}&format=pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Download PDF
            </a>
          )}
          {Boolean(report.excel_storage_path) && (
            <a
              href={`/api/reports/preview?reportId=${report.id}&format=excel`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Excel
            </a>
          )}
        </div>
      </div>

      {Boolean(actionSuccess) && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Success</h4>
            <p className="mt-0.5">{actionSuccess}</p>
          </div>
        </div>
      )}

      {/* Client Approval & Review Banner */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Client Review Status</span>
          <h3 className="text-base font-bold text-foreground mt-0.5 flex items-center gap-2">
            {reviewStatus === 'approved' ? (
              <span className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 text-xs">
                <CheckCircle2 className="w-4 h-4" /> Report Approved
              </span>
            ) : reviewStatus === 'revision_requested' ? (
              <span className="inline-flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 text-xs">
                <AlertCircle className="w-4 h-4" /> Revision Requested
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 text-xs">
                <ShieldCheck className="w-4 h-4" /> Pending Client Approval
              </span>
            )}
          </h3>
        </div>

        {reviewStatus !== 'approved' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleApproveReport}
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" /> Approve Report
            </button>
            <button
              onClick={() => setShowRevisionModal(true)}
              className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Request Revision
            </button>
          </div>
        )}
      </div>

      {/* Main KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border/60 rounded-xl space-y-1">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Followers</span>
          <span className="block text-2xl font-extrabold text-foreground">{Number(overall.audienceTotal?.currentValue || 0).toLocaleString()}</span>
        </div>
        <div className="p-4 bg-card border border-border/60 rounded-xl space-y-1">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Views</span>
          <span className="block text-2xl font-extrabold text-foreground">{Number(overall.views?.currentValue || 0).toLocaleString()}</span>
        </div>
        <div className="p-4 bg-card border border-border/60 rounded-xl space-y-1">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Engagements</span>
          <span className="block text-2xl font-extrabold text-foreground">{Number(overall.engagements?.currentValue || 0).toLocaleString()}</span>
        </div>
        <div className="p-4 bg-card border border-border/60 rounded-xl space-y-1">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Reach</span>
          <span className="block text-2xl font-extrabold text-foreground">{Number(overall.reach?.currentValue || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Executive Summary */}
      {Boolean(snapshot.executiveSummary) && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-3">
          <h3 className="text-base font-bold text-foreground">Executive Summary</h3>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
            {String(snapshot.executiveSummary)}
          </p>
        </div>
      )}

      {/* Strategic Recommendations */}
      {Boolean(snapshot.recommendations) && (
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-3">
          <h3 className="text-base font-bold text-foreground">Strategic Recommendations</h3>
          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1.5 pl-1">
            {(snapshot.recommendations as string[]).map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Client-Visible Notes & Comments */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" /> Report Notes & Discussion ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <p className="text-xs text-muted-foreground">No notes posted yet. Add a note or question below.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {comments.map(c => (
              <div key={String(c.id)} className="p-3 bg-muted/30 border border-border/40 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{String(c.author_name || 'User')}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(String(c.created_at)).toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">{String(c.comment_text)}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            placeholder="Write a note or question for your marketing manager..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="flex-1 bg-muted/40 border border-border/60 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={submittingComment || !newComment.trim()}
            className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 py-2 rounded-xl disabled:opacity-50 transition-colors"
          >
            {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
          </button>
        </form>
      </div>

      {/* Revision Request Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRequestRevision} className="bg-card border border-border/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-foreground">Request Report Revision</h3>
            <p className="text-xs text-muted-foreground">Describe what changes or additional notes you would like the marketing team to revise.</p>
            <textarea
              required
              rows={4}
              placeholder="e.g. Please update the executive summary to highlight the YouTube subscriber milestone..."
              value={revisionNote}
              onChange={e => setRevisionNote(e.target.value)}
              className="w-full bg-muted/40 border border-border/60 rounded-xl p-3 text-xs focus:outline-none focus:border-primary"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-xs font-bold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
              >
                Submit Revision Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
