'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { createClient } from '@/lib/supabase/client'
import { Film, Loader2, ExternalLink, Heart, Eye, MessageSquare, Share2 } from 'lucide-react'

export default function ClientContentPage() {
  const { activeCompany } = useCompany()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [contentItems, setContentItems] = useState<Array<Record<string, unknown>>>([])

  const loadData = useCallback(async () => {
    if (!activeCompany) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('content_items')
        .select(`
          id, title, caption, provider, published_at, permalink,
          content_metrics (metric_name, metric_value)
        `)
        .eq('company_id', activeCompany.id)
        .order('published_at', { ascending: false })

      if (data) setContentItems(data as Array<Record<string, unknown>>)
    } catch (err: unknown) {
      console.error('Failed to load client content:', err)
    } finally {
      setLoading(false)
    }
  }, [activeCompany, supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  if (!activeCompany) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Content Performance Library</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Individual post statistics and engagement breakdown for {activeCompany.name}.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : contentItems.length === 0 ? (
        <div className="bg-card border border-border/60 rounded-2xl p-12 text-center space-y-3">
          <Film className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">No Published Content Recorded</h3>
          <p className="text-xs text-muted-foreground">No post analytics items have been ingested for this company yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {contentItems.map(item => {
            const metrics = (item.content_metrics || []) as Array<{ metric_name: string; metric_value: number }>
            const views = metrics.find(m => m.metric_name === 'views')?.metric_value || 0
            const likes = metrics.find(m => m.metric_name === 'likes')?.metric_value || 0
            const comments = metrics.find(m => m.metric_name === 'comments')?.metric_value || 0
            const shares = metrics.find(m => m.metric_name === 'shares')?.metric_value || 0

            return (
              <div key={String(item.id)} className="bg-card border border-border/60 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">
                      {String(item.provider)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {new Date(String(item.published_at)).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-foreground line-clamp-2">{String(item.title || 'Untitled Content')}</h3>
                  {Boolean(item.caption) && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{String(item.caption)}</p>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 text-center pt-3 border-t border-border/40 text-[11px] font-semibold text-muted-foreground">
                  <div>
                    <Eye className="w-3.5 h-3.5 mx-auto text-purple-400 mb-0.5" />
                    <span className="block text-foreground font-bold">{views}</span>
                  </div>
                  <div>
                    <Heart className="w-3.5 h-3.5 mx-auto text-pink-500 mb-0.5" />
                    <span className="block text-foreground font-bold">{likes}</span>
                  </div>
                  <div>
                    <MessageSquare className="w-3.5 h-3.5 mx-auto text-blue-400 mb-0.5" />
                    <span className="block text-foreground font-bold">{comments}</span>
                  </div>
                  <div>
                    <Share2 className="w-3.5 h-3.5 mx-auto text-emerald-400 mb-0.5" />
                    <span className="block text-foreground font-bold">{shares}</span>
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
