'use client'

import React, { useState } from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { 
  Building, 
  Globe, 
  Calendar, 
  Clock, 
  ArrowUpRight, 
  Link2,
  TrendingUp,
  Users,
  Eye,
  Heart
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { activeCompany } = useCompany()
  const [dateRange, setDateRange] = useState('This Month')

  if (!activeCompany) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <Building className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">No active company</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Please switch to an existing company or create a new one to view the dashboard.
          </p>
        </div>
        <Link 
          href="/onboarding"
          className="bg-primary text-primary-foreground font-medium rounded-lg text-sm px-4 py-2 hover:bg-primary/90 transition-colors"
        >
          Create Company
        </Link>
      </div>
    )
  }

  // Demo stats for seeded or new accounts to make it feel alive but clearly marked
  const stats = [
    { name: 'Total Audience', value: '0', change: '0%', label: 'followers', icon: Users },
    { name: 'Total Impressions', value: '0', change: '0%', label: 'views', icon: Eye },
    { name: 'Total Engagements', value: '0', change: '0%', label: 'likes & comments', icon: Heart },
    { name: 'Engagement Rate', value: '0.0%', change: '0%', label: 'average', icon: TrendingUp },
  ]

  return (
    <div className="space-y-8">
      {/* Upper header segment */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyzing performance for <span className="font-semibold text-foreground">{activeCompany.name}</span>
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          {['This Week', 'This Month', 'Last Month', 'Custom'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                dateRange === range
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Demo Data Alert Banner */}
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
              Getting Started
            </span>
            <h4 className="text-sm font-bold text-foreground">Connect platform connections to fetch live social analytics</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Social Report Pro aggregates historical data from Facebook, Instagram, YouTube, and TikTok to create professional weekly and monthly marketing reports.
          </p>
        </div>
        <Link
          href={`/connections?companyId=${activeCompany.id}`}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Link2 className="w-3.5 h-3.5" />
          Connect Accounts
        </Link>
      </div>

      {/* Grid Cards stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.name} 
              className="bg-card border border-border/60 rounded-xl p-5 hover:border-border transition-colors relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.name}
                </span>
                <div className="p-2 bg-muted/40 border border-border/50 rounded-lg">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <div className="text-3xl font-extrabold tracking-tight">
                  {stat.value}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground font-medium">
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    vs previous {stat.label}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Company settings summary card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="bg-card border border-border/60 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold">Company Profile</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Settings configurations and parameters</p>
          </div>
          
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <span className="text-muted-foreground flex items-center gap-2">
                <Building className="w-4 h-4 text-muted-foreground" />
                Industry
              </span>
              <span className="font-semibold text-foreground">{activeCompany.industry || 'Not set'}</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <span className="text-muted-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                Country
              </span>
              <span className="font-semibold text-foreground">{activeCompany.country || 'Not set'}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Timezone
              </span>
              <span className="font-semibold text-foreground">{activeCompany.timezone || 'UTC'}</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Week Starts
              </span>
              <span className="font-semibold text-foreground capitalize">{activeCompany.week_starts_on}</span>
            </div>
          </div>
        </div>

        {/* Analytics status placeholder */}
        <div className="lg:col-span-2 bg-card border border-border/60 rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold">Performance Analytics</h3>
            <p className="text-xs text-muted-foreground">Historical charts and aggregate trend details</p>
          </div>

          <div className="h-48 border border-dashed border-border/80 rounded-xl flex flex-col items-center justify-center text-center p-4 my-4 bg-muted/10">
            <TrendingUp className="w-8 h-8 text-muted-foreground/60 mb-2" />
            <span className="text-sm font-semibold text-foreground">No historical data available</span>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Once you connect a platform, we will automatically ingest daily metrics and show charts here.
            </p>
          </div>

          <div className="flex justify-end pt-2 border-t border-border/40">
            <Link
              href={`/connections?companyId=${activeCompany.id}`}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              Configure Platforms <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
