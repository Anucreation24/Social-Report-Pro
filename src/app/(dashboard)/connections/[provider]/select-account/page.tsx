'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getAvailableAccountsAction, selectSocialAccountAction } from '@/features/connections/actions'
import { SelectableSocialAccount } from '@/lib/connectors/types'
import { ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface SelectAccountPageProps {
  params: Promise<{ provider: string }>
}

export default function SelectAccountPage({ params }: SelectAccountPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const connectionId = searchParams.get('connectionId')
  const { provider } = use(params)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<SelectableSocialAccount[]>([])

  useEffect(() => {
    if (!connectionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('Missing connectionId query parameter.')
      setLoading(false)
      return
    }

    async function loadAccounts() {
      try {
        setLoading(true)
        const res = await getAvailableAccountsAction(connectionId!)
        if (res.error) {
          setError(res.error)
        } else if (res.accounts) {
          setAccounts(res.accounts)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch available accounts.')
      } finally {
        setLoading(false)
      }
    }

    loadAccounts()
  }, [connectionId])

  const handleSelect = async (account: SelectableSocialAccount) => {
    if (!connectionId) return
    try {
      setSaving(account.id)
      setError(null)
      const res = await selectSocialAccountAction(connectionId, account)
      if (res.error) {
        setError(res.error)
      } else {
        router.push('/connections?success=true')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to select social account.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Link 
          href="/connections" 
          className="p-2 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight capitalize">{provider} Account Selection</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Select a primary profile/channel to link to your active company.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">An error occurred</h4>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-card border border-border/60 rounded-xl p-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Discovering available profiles and channels...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-card border border-border/60 rounded-xl p-12 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
          <h3 className="font-bold text-foreground">No accounts found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            We couldn&apos;t find any eligible accounts or pages linked to this credentials session. Verify your permissions on {provider}.
          </p>
          <Link 
            href="/connections" 
            className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Back to Connections
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Discovered Pages/Channels</h3>
          <div className="grid grid-cols-1 gap-3">
            {accounts.map((account) => (
              <div 
                key={account.id} 
                className="bg-card border border-border/60 hover:border-border rounded-xl p-5 flex items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-4">
                  {account.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={account.profileImageUrl} 
                      alt={account.name} 
                      className="w-12 h-12 rounded-full object-cover bg-muted border border-border/60"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-lg">
                      {account.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-foreground">{account.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {account.username ? `@${account.username.replace('@', '')}` : 'No username'} • {account.accountType || 'Account'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleSelect(account)}
                  disabled={saving !== null}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {saving === account.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Select Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
