'use client'

import React from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { FileText } from 'lucide-react'

export default function ReportsPage() {
  const { activeCompany } = useCompany()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Weekly & Monthly Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate, preview, and download custom marketing performance reports for {activeCompany?.name || 'your company'}
        </p>
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-8 flex flex-col items-center justify-center text-center py-20 bg-muted/10">
        <FileText className="w-12 h-12 text-muted-foreground/60 mb-3" />
        <h3 className="text-lg font-bold text-foreground">No Reports Generated</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          Once data is available, you will be able to compile professional PDF and Excel exports.
        </p>
      </div>
    </div>
  )
}
