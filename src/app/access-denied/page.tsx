import React from 'react'
import Link from 'next/link'
import { ShieldAlert, LayoutDashboard } from 'lucide-react'

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border/80 rounded-2xl max-w-md w-full p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
        <div className="w-16 h-16 bg-destructive/10 border border-destructive/20 rounded-full flex items-center justify-center mx-auto text-destructive">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Access Denied</h1>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            You do not have permission to access this administration page. Your account role is configured for Client Portal read-only access.
          </p>
        </div>

        <div className="p-3 bg-muted/40 border border-border/40 rounded-xl text-left text-xs text-muted-foreground space-y-1">
          <span className="font-bold text-foreground block">Restricted Administration Feature</span>
          <p className="text-[11px]">Features such as platform API connections, file imports, manual data entries, system settings, and member management are restricted to agency staff.</p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/client/dashboard"
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4" /> Go to Client Portal
          </Link>
        </div>
      </div>
    </div>
  )
}
