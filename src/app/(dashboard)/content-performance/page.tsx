'use client'

import React from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { FileSpreadsheet } from 'lucide-react'

export default function ContentPerformancePage() {
  const { activeCompany } = useCompany()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Content Performance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed metrics for posts, reels, videos, and shorts for {activeCompany?.name || 'your company'}
        </p>
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-8 flex flex-col items-center justify-center text-center py-20 bg-muted/10">
        <FileSpreadsheet className="w-12 h-12 text-muted-foreground/60 mb-3" />
        <h3 className="text-lg font-bold text-foreground">No Published Content Tracked</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          Once platforms are connected, your published items will automatically sync and rank here.
        </p>
      </div>
    </div>
  )
}
