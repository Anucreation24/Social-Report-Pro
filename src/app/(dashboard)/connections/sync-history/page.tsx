'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { fetchSyncJobsHistory } from '@/features/sync/queries'
import { triggerManualSyncAction } from '@/features/sync/actions'
import { createClient } from '@/lib/supabase/client'
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  Facebook,
  Youtube,
  Instagram,
  Video
} from 'lucide-react'
import Link from 'next/link'

interface SyncJobRecord {
  id: string
  platform_connection_id?: string | null
  provider: string
  job_type: string
  status: string
  started_at: string | null
  completed_at: string | null
  attempt_count: number
  error_category: string | null
  safe_error_message: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export default function SyncHistoryPage() {
  const { activeCompany } = useCompany()
  const [jobs, setJobs] = useState<SyncJobRecord[]>([])
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'marketing_manager' | 'viewer' | null>(null)
  const [loading, setLoading] = useState(true)
  const [retriggerId, setRetriggerId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const isViewer = userRole === 'viewer'
  const companyId = activeCompany?.id

  useEffect(() => {
    if (!companyId) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('company_members')
          .select('role')
          .eq('company_id', companyId)
          .eq('user_id', user.id)
          .single()
          .then(({ data: member }) => {
            if (member) setUserRole(member.role as 'owner' | 'admin' | 'marketing_manager' | 'viewer')
          })
      }
    })
  }, [companyId])

  const loadHistory = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const data = await fetchSyncJobsHistory(companyId, 50)
      setJobs(data as unknown as SyncJobRecord[])
    } catch (e: unknown) {
      console.error('Failed to load sync history:', e)
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    if (!companyId) return
    let isSubscribed = true

    fetchSyncJobsHistory(companyId, 50)
      .then(data => {
        if (isSubscribed) {
          setJobs(data as unknown as SyncJobRecord[])
          setLoading(false)
        }
      })
      .catch(e => {
        console.error('Failed to load sync history:', e)
        if (isSubscribed) setLoading(false)
      })

    return () => {
      isSubscribed = false
    }
  }, [companyId])


  const handleRetrigger = async (connId: string, provider: string) => {
    if (!connId) return
    setRetriggerId(connId)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await triggerManualSyncAction(connId, 30)
      if (res.error) {
        setErrorMsg(`Sync re-trigger failed: ${res.error}`)
      } else {
        setSuccessMsg(`Sync re-triggered for ${provider}! Ingested ${res.recordsCreated} metric points.`)
        loadHistory()
      }
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Re-trigger failed.')
    } finally {
      setRetriggerId(null)
    }
  }

  const renderProviderIcon = (provider: string) => {
    switch (provider) {
      case 'facebook': return <Facebook className="w-4 h-4 text-[#1877F2]" />
      case 'youtube': return <Youtube className="w-4 h-4 text-[#FF0000]" />
      case 'instagram': return <Instagram className="w-4 h-4 text-[#E4405F]" />
      case 'tiktok': return <Video className="w-4 h-4 text-[#00F2FE]" />
      default: return <Activity className="w-4 h-4 text-primary" />
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        )
      case 'partially_completed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" /> Partial
          </span>
        )
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
            <Loader2 className="w-3 h-3 animate-spin" /> Running
          </span>
        )
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        )
    }
  }

  if (!activeCompany) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/connections"
            className="p-2 border border-border/60 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Sync History</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Audit log of all manual and scheduled data ingestion runs for {activeCompany.name}.
            </p>
          </div>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/60 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Log
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center bg-card/60 border border-border/60 rounded-2xl">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground font-medium">Loading sync audit history...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center bg-card/60 border border-border/60 rounded-2xl space-y-3">
          <Clock className="w-8 h-8 text-muted-foreground/50 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No Sync Jobs Recorded</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            You have not triggered any analytics sync runs for this company yet. Click &quot;Sync Now&quot; on the Connections page to ingest historical metrics.
          </p>
        </div>
      ) : (
        <div className="bg-card/80 border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Started At</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {jobs.map(job => (
                  <tr key={job.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-semibold">
                      <div className="flex items-center gap-2 capitalize">
                        {renderProviderIcon(job.provider)}
                        <span>{job.provider}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize font-medium text-muted-foreground">
                      {job.job_type}
                    </td>
                    <td className="py-3 px-4">
                      {renderStatusBadge(job.status)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {job.started_at ? new Date(job.started_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                      {job.safe_error_message ? (
                        <span className="text-rose-400 font-medium">{job.safe_error_message}</span>
                      ) : (
                        <span>
                          {job.metadata?.recordsCreated !== undefined
                            ? `${job.metadata.recordsCreated} metrics saved`
                            : 'Executed cleanly'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {job.platform_connection_id && (
                        <button
                          disabled={isViewer || retriggerId === job.platform_connection_id}
                          onClick={() => handleRetrigger(job.platform_connection_id!, job.provider)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/40 disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          {retriggerId === job.platform_connection_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          <span>Re-sync</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
