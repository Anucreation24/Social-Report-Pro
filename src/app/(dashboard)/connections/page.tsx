'use client'

import React from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { Plus, Facebook, Youtube, Video, Instagram } from 'lucide-react'

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook Page', icon: Facebook, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { id: 'instagram', name: 'Instagram Professional', icon: Instagram, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
  { id: 'youtube', name: 'YouTube Channel', icon: Youtube, color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  { id: 'tiktok', name: 'TikTok Creator/Business', icon: Video, color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
]

export default function ConnectionsPage() {
  const { activeCompany } = useCompany()

  if (!activeCompany) {
    return <div className="text-center py-10 text-muted-foreground">Select a company first.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Platform Connections</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage integrations and connections for {activeCompany.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon
          return (
            <div 
              key={platform.id}
              className="bg-card border border-border/60 rounded-xl p-6 flex flex-col justify-between space-y-4 hover:border-border transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg border ${platform.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{platform.name}</h3>
                  <span className="text-xs text-muted-foreground">Disconnected</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <span className="text-xs text-muted-foreground">Requires API authorization</span>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  Connect
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
