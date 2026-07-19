'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { createClient } from '@/lib/supabase/client'
import { disconnectConnectionAction, validateConnectionAction } from '@/features/connections/actions'
import { 
  Facebook, 
  Youtube, 
  Video, 
  Instagram, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  RefreshCw, 
  Settings, 
  Activity,
  Calendar,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface ConfigStatus {
  facebook: boolean
  instagram: boolean
  youtube: boolean
  tiktok: boolean
}

interface DBConnection {
  id: string
  provider: string
  provider_account_name: string
  provider_account_id: string
  connection_status: string
  granted_scopes: string[]
  token_expires_at: string | null
  last_validated_at: string | null
  last_error_message_safe: string | null
}

interface DBSocialAccount {
  platform_connection_id: string
  name: string
  username: string
  profile_image_url: string
  account_url: string
}

const PROVIDER_INFO = {
  facebook: {
    name: 'Facebook Page',
    description: 'Read-only page insights and post engagement statistics.',
    icon: Facebook,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  },
  instagram: {
    name: 'Instagram Professional',
    description: 'Access professional business/creator account metrics.',
    icon: Instagram,
    color: 'text-pink-500 bg-pink-500/10 border-pink-500/20'
  },
  youtube: {
    name: 'YouTube Channel',
    description: 'Track channel performance, watch time, and subscriber counts.',
    icon: Youtube,
    color: 'text-red-500 bg-red-500/10 border-red-500/20'
  },
  tiktok: {
    name: 'TikTok Profile',
    description: 'Video performance and audience demographics indicators.',
    icon: Video,
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
  }
} as const

export default function ConnectionsPage() {
  const { activeCompany } = useCompany()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [configs, setConfigs] = useState<ConfigStatus | null>(null)
  const [connections, setConnections] = useState<DBConnection[]>([])
  const [socialAccounts, setSocialAccounts] = useState<DBSocialAccount[]>([])
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'marketing_manager' | 'viewer' | null>(null)
  
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const isViewer = userRole === 'viewer'

  const loadData = useCallback(async () => {
    if (!activeCompany) return
    try {
      setLoading(true)
      setActionError(null)

      // 1. Fetch user role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: member } = await supabase
          .from('company_members')
          .select('role')
          .eq('company_id', activeCompany.id)
          .eq('user_id', user.id)
          .single()
        if (member) {
          setUserRole(member.role as 'owner' | 'admin' | 'marketing_manager' | 'viewer')
        }
      }

      // 2. Fetch provider environment configurations
      const configRes = await fetch('/api/oauth/config')
      if (configRes.ok) {
        const configData = await configRes.json()
        setConfigs(configData)
      }

      // 3. Fetch active company connections
      const { data: connData } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('company_id', activeCompany.id)

      if (connData) {
        setConnections(connData)
      }

      // 4. Fetch linked social accounts
      const { data: accData } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('company_id', activeCompany.id)
        .eq('is_selected', true)

      if (accData) {
        setSocialAccounts(accData)
      }
    } catch (err: unknown) {
      console.error('Failed to load connections:', err)
      setActionError('Failed to load company connection settings.')
    } finally {
      setLoading(false)
    }
  }, [activeCompany, supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  // Handle URL alert messages
  useEffect(() => {
    const successMsg = searchParams.get('success')
    const errorMsg = searchParams.get('error')

    if (successMsg) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActionSuccess('Integration connection saved successfully!')
    }
    if (errorMsg) {
      setActionError(decodeURIComponent(errorMsg))
    }
  }, [searchParams])

  const handleDisconnect = async (connId: string, provider: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}? Historical analytics reports will not be deleted, but no new data can be synchronized.`)) return

    try {
      setProcessingId(connId)
      setActionError(null)
      setActionSuccess(null)
      const res = await disconnectConnectionAction(connId)

      if (res.error) {
        setActionError(res.error)
      } else {
        setActionSuccess('Platform disconnected successfully.')
        await loadData()
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Disconnect operation failed.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleValidate = async (connId: string) => {
    try {
      setProcessingId(connId)
      setActionError(null)
      setActionSuccess(null)
      const res = await validateConnectionAction(connId)

      if (res.error) {
        setActionError(res.error)
      } else if (res.status === 'valid') {
        setActionSuccess('Connection status is healthy!')
        await loadData()
      } else {
        setActionError(`Connection health check failed: ${res.message || 'Expired credentials'}`)
        await loadData()
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Validation request failed.')
    } finally {
      setProcessingId(null)
    }
  }

  if (!activeCompany) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Select a company first.</div>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Connected
          </span>
        )
      case 'awaiting_account_selection':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full">
            <Settings className="w-3 h-3 animate-spin" /> Link Pending
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" /> Expired
          </span>
        )
      case 'permission_required':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full">
            <ShieldAlert className="w-3 h-3" /> Scope Warning
          </span>
        )
      case 'revoked':
      case 'disconnected':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border/40 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" /> Disconnected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Platform Connections</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Authorize integrations, configure scopes, and link selected channels for {activeCompany.name}.
        </p>
      </div>

      {actionError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Error</h4>
            <p className="mt-0.5">{actionError}</p>
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Success</h4>
            <p className="mt-0.5">{actionSuccess}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(Object.keys(PROVIDER_INFO) as Array<keyof typeof PROVIDER_INFO>).map((key) => {
            const info = PROVIDER_INFO[key]
            const Icon = info.icon
            const isConfigured = configs ? configs[key] : false
            
            const conn = connections.find((c) => c.provider === key && c.connection_status !== 'disconnected')
            const socialAcc = conn ? socialAccounts.find((sa) => sa.platform_connection_id === conn.id) : null

            return (
              <div 
                key={key}
                className="bg-card border border-border/60 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-border transition-all"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg border ${info.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{info.name}</h3>
                        <p className="text-[10px] text-muted-foreground max-w-[200px] mt-0.5">{info.description}</p>
                      </div>
                    </div>
                    <div>
                      {conn ? getStatusBadge(conn.connection_status) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          Not Connected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Connected profile details panel */}
                  {conn && (
                    <div className="bg-muted/40 border border-border/40 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center gap-3">
                        {socialAcc?.profile_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={socialAcc.profile_image_url} 
                            alt={socialAcc.name} 
                            className="w-10 h-10 rounded-full object-cover border border-border/60"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                            {conn.provider_account_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-foreground">{conn.provider_account_name}</h4>
                          {socialAcc?.username && (
                            <p className="text-[10px] text-muted-foreground">@{socialAcc.username.replace('@', '')}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground pt-1.5 border-t border-border/40">
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{conn.granted_scopes.length} Permissions</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {conn.token_expires_at ? `Expires: ${new Date(conn.token_expires_at).toLocaleDateString()}` : 'No Expiry'}
                          </span>
                        </div>
                        {conn.last_validated_at && (
                          <div className="col-span-2 flex items-center gap-1">
                            <Activity className="w-3.5 h-3.5" />
                            <span>Checked: {new Date(conn.last_validated_at).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!conn && !isConfigured && (
                    <div className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Provider configuration is required before this account can be connected.</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground">
                    {!isConfigured ? 'Disabled' : conn ? 'Actions Available' : 'Ready'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {conn ? (
                      <>
                        <button
                          disabled={isViewer || processingId !== null}
                          onClick={() => handleValidate(conn.id)}
                          title="Validate health"
                          className="p-1.5 border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 rounded-lg cursor-pointer transition-colors"
                        >
                          {processingId === conn.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </button>
                        
                        {conn.connection_status === 'awaiting_account_selection' && (
                          <Link
                            href={`/connections/${key}/select-account?connectionId=${conn.id}`}
                            className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                          >
                            <Settings className="w-3.5 h-3.5" /> Link Profile
                          </Link>
                        )}

                        <button
                          disabled={isViewer || processingId !== null}
                          onClick={() => handleDisconnect(conn.id, info.name)}
                          className="inline-flex items-center gap-1 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground disabled:opacity-50 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Disconnect
                        </button>
                      </>
                    ) : (
                      <Link
                        href={!isConfigured || isViewer ? '#' : `/api/oauth/${key}/start?companyId=${activeCompany.id}`}
                        aria-disabled={!isConfigured || isViewer}
                        onClick={(e) => {
                          if (!isConfigured || isViewer) e.preventDefault()
                        }}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                          !isConfigured || isViewer
                            ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border/40'
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer'
                        }`}
                      >
                        Connect
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
