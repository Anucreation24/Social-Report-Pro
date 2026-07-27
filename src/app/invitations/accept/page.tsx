'use client'

import React, { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { acceptInvitationAction } from '@/features/invitations/actions'
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react'

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const handleAccept = async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await acceptInvitationAction(token)
      setSuccess(true)
      setTimeout(() => {
        if (res.role === 'client_viewer') {
          router.push('/client/dashboard')
        } else {
          router.push('/dashboard')
        }
      }, 2000)
    } catch (err: unknown) {
      console.error('Accept invitation error:', err)
      setError((err as Error).message || 'Failed to accept invitation.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border/80 rounded-2xl max-w-md w-full p-8 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Invalid Invitation Link</h2>
          <p className="text-xs text-muted-foreground">The invitation link is missing a required security token.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border/80 rounded-2xl max-w-md w-full p-8 text-center space-y-6 shadow-xl">
        <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto text-primary">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Accept Invitation</h1>
          <p className="text-xs text-muted-foreground mt-1">
            You have been invited to access a client portfolio in Social Report Pro.
          </p>
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

        {success ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">Invitation Accepted!</h4>
              <p className="mt-0.5">Redirecting to your dashboard...</p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-5 py-3 rounded-xl disabled:opacity-50 cursor-pointer transition-colors shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Join Company & View Dashboard
          </button>
        )}
      </div>
    </div>
  )
}
