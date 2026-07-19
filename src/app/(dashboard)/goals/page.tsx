'use client'

import React from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { Target } from 'lucide-react'

export default function GoalsPage() {
  const { activeCompany } = useCompany()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Marketing KPI Goals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Establish and monitor performance targets for {activeCompany?.name || 'your company'}
        </p>
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-8 flex flex-col items-center justify-center text-center py-20 bg-muted/10">
        <Target className="w-12 h-12 text-muted-foreground/60 mb-3" />
        <h3 className="text-lg font-bold text-foreground">No Active Goals</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          Define weekly or monthly targets (like followers gained or reach target values) to see goal progress.
        </p>
      </div>
    </div>
  )
}
