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
  FileSpreadsheet,
  Edit3,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { triggerManualSyncAction } from '@/features/sync/actions'

interface ProviderConfig {
  isConfigured: boolean
  keys: Record<string, boolean>
}

interface ConfigStatus {
  facebook: ProviderConfig
  instagram: ProviderConfig
  youtube: ProviderConfig
  tiktok: ProviderConfig
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
    description: 'Page insights and post engagement statistics via API or file import.',
    icon: Facebook,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    insightsUrl: 'https://business.facebook.com/latest/insights'
  },
  instagram: {
    name: 'Instagram Professional',
    description: 'Professional business/creator metrics via API or manual data entry.',
    icon: Instagram,
    color: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    insightsUrl: 'https://www.instagram.com/accounts/insights/'
  },
  youtube: {
    name: 'YouTube Channel',
    description: 'Track channel performance, watch time, and subscriber metrics.',
    icon: Youtube,
    color: 'text-red-500 bg-red-500/10 border-red-500/20',
    insightsUrl: 'https://studio.youtube.com/'
  },
  tiktok: {
    name: 'TikTok Profile',
    description: 'Video views, audience growth, and engagement statistics.',
    icon: Video,
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    insightsUrl: 'https://www.tiktok.com/analytics'
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
  const [importedBatches, setImportedBatches] = useState<Array<{ platform: string; source_type: string }>>([])
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'marketing_manager' | 'viewer' | null>(null)
  
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [modalProvider, setModalProvider] = useState<keyof typeof PROVIDER_INFO | null>(null)
  const [manageModalProvider, setManageModalProvider] = useState<keyof typeof PROVIDER_INFO | null>(null)

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

      // 5. Fetch imported batches to determine data sources
      const { data: batchData } = await supabase
        .from('data_import_batches')
        .select('platform, source_type')
        .eq('company_id', activeCompany.id)
        .eq('status', 'completed')

      if (batchData) {
        setImportedBatches(batchData)
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

  const determineDataMode = (key: keyof typeof PROVIDER_INFO) => {
    const conn = connections.find((c) => c.provider === key && c.connection_status === 'connected')
    const hasImport = importedBatches.some(b => b.platform === key && (b.source_type === 'csv_import' || b.source_type === 'excel_import'))
    const hasManual = importedBatches.some(b => b.platform === key && b.source_type === 'manual_entry')

    if (conn && (hasImport || hasManual)) return 'mixed'
    if (conn) return 'api'
    if (hasImport) return 'import'
    if (hasManual) return 'manual'
    return 'none'
  }

  const getStatusBadge = (dataMode: string) => {
    switch (dataMode) {
      case 'api':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Live API Connected
          </span>
        )
      case 'import':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
            <FileSpreadsheet className="w-3 h-3" /> File Import
          </span>
        )
      case 'manual':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
            <Edit3 className="w-3 h-3" /> Manual Entry
          </span>
        )
      case 'mixed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
            <RefreshCw className="w-3 h-3" /> Mixed Sources
          </span>
        )
      case 'none':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border/40 px-2 py-0.5 rounded-full">
            Not Configured
          </span>
        )
    }
  }

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

  const handleSyncNow = async (connId: string, providerName: string) => {
    setSyncingId(connId)
    setActionError(null)
    setActionSuccess(null)

    try {
      const res = await triggerManualSyncAction(connId, 30)
      if (res.error) {
        setActionError(`Sync failed for ${providerName}: ${res.error}`)
      } else if (res.status === 'partially_completed' || res.warningMessage) {
        setActionError(`Sync partially completed for ${providerName}: ${res.warningMessage || 'Some metrics require additional provider permissions.'}`)
        loadData()
      } else {
        setActionSuccess(`Successfully synced ${providerName}! Ingested ${res.recordsCreated} metrics & ${res.contentItemsImported} content items.`)
        loadData()
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Sync execution failed.')
    } finally {
      setSyncingId(null)
    }
  }

  if (!activeCompany) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Select a company first.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Platform Data & Connections</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage data sources for {activeCompany.name} using Official APIs, CSV/Excel imports, or Manual KPI entry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/imports"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/60 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-400" /> Import History
          </Link>
          <Link
            href="/connections/sync-history"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/60 transition-colors"
          >
            <Activity className="w-4 h-4 text-primary" /> View Sync History
          </Link>
        </div>
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
            const isConfigured = configs ? configs[key].isConfigured : false
            
            const conn = connections.find((c) => c.provider === key && c.connection_status !== 'disconnected')
            const socialAcc = conn ? socialAccounts.find((sa) => sa.platform_connection_id === conn.id) : null
            const dataMode = determineDataMode(key)

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
                      {getStatusBadge(dataMode)}
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
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                  <button
                    onClick={() => setManageModalProvider(key)}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/60 cursor-pointer transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-primary" /> Add / Manage Data
                  </button>

                  <div className="flex items-center gap-1.5">
                    {conn && (
                      <>
                        <button
                          disabled={isViewer || syncingId !== null || processingId !== null}
                          onClick={() => handleSyncNow(conn.id, info.name)}
                          className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer transition-colors"
                        >
                          {syncingId === conn.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          Sync API
                        </button>

                        <button
                          disabled={isViewer || processingId !== null}
                          onClick={() => handleDisconnect(conn.id, info.name)}
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                          title="Disconnect API"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Manage Data Method Modal */}
      {manageModalProvider && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${PROVIDER_INFO[manageModalProvider].color}`}>
                  {React.createElement(PROVIDER_INFO[manageModalProvider].icon, { className: "w-5 h-5" })}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Add {PROVIDER_INFO[manageModalProvider].name} Data
                  </h3>
                  <p className="text-xs text-muted-foreground">Select how you want to ingest metrics for {activeCompany.name}.</p>
                </div>
              </div>
              <button
                onClick={() => setManageModalProvider(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-1 hover:bg-muted rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Option 1: Official API */}
              <div className="p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-colors flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Connect with Official API
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Automated daily OAuth sync directly from platform servers.</p>
                </div>
                <Link
                  href={isViewer ? '#' : `/api/oauth/${manageModalProvider}/start?companyId=${activeCompany.id}`}
                  onClick={(e) => {
                    if (isViewer) e.preventDefault()
                    setManageModalProvider(null)
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  Connect API
                </Link>
              </div>

              {/* Option 2: Import CSV / Excel */}
              <div className="p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-colors flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-purple-400" /> Import CSV / Excel
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Upload exported platform reports with intelligent column mapping.</p>
                </div>
                <Link
                  href={`/imports/new?platform=${manageModalProvider}`}
                  onClick={() => setManageModalProvider(null)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  Upload File
                </Link>
              </div>

              {/* Option 3: Manual Entry */}
              <div className="p-3.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-colors flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-blue-400" /> Enter Metrics Manually
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Enter high-level account KPIs or bulk content performance records.</p>
                </div>
                <Link
                  href={`/manual-entry/new?platform=${manageModalProvider}`}
                  onClick={() => setManageModalProvider(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  Enter Manually
                </Link>
              </div>

              {/* Option 4: Open Platform Dashboard */}
              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" /> Open Platform Dashboard
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Open official analytics page in a new tab to export data.</p>
                </div>
                <a
                  href={PROVIDER_INFO[manageModalProvider].insightsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 border border-border/60 hover:bg-muted text-foreground text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  Open Portal <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Guided Instructions */}
            <div className="bg-muted/40 border border-border/40 rounded-xl p-3.5 space-y-2 text-xs">
              <h5 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                <HelpCircle className="w-4 h-4 text-primary" /> Guided Import Steps
              </h5>
              <ol className="list-decimal list-inside text-[11px] text-muted-foreground space-y-1 pl-1">
                <li>Click <strong>Open Portal</strong> to view official dashboard insights.</li>
                <li>Select your reporting period and export as CSV or XLSX.</li>
                <li>Return here and click <strong>Upload File</strong>.</li>
                <li>Map column headers to Social Report Pro metrics.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Configure Provider Modal */}
      {modalProvider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden z-50">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">
                  Configure {PROVIDER_INFO[modalProvider].name}
                </h3>
                <button
                  onClick={() => setModalProvider(null)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer p-1.5 hover:bg-muted/50 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Configure environment variables in your server <code className="px-1 py-0.5 bg-muted rounded font-mono text-[10px]">.env.local</code> file.
              </p>

              <div className="space-y-2.5 pt-2">
                {configs && configs[modalProvider] && Object.entries(configs[modalProvider].keys).map(([keyName, isPresent]) => (
                  <div key={keyName} className="flex items-center justify-between p-2.5 bg-muted/40 border border-border/40 rounded-xl">
                    <span className="font-mono text-xs font-semibold text-foreground">{keyName}</span>
                    {isPresent ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
                        <AlertCircle className="w-3.5 h-3.5" /> Missing
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setModalProvider(null)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
