/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useEffect, useState } from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { fetchContentPerformanceData } from '@/features/sync/queries'
import {
  FileSpreadsheet,
  Search,
  ArrowUpDown,
  ExternalLink,
  Loader2,
  Facebook,
  Youtube,
  Instagram,
  Video
} from 'lucide-react'


interface FormattedContentItem {
  id: string
  provider: string
  providerContentId: string
  contentType: string
  title: string
  captionExcerpt: string
  permalink: string
  thumbnailUrl: string
  publishedAt: string
  durationSeconds?: number
  views: number
  reach: number
  impressions: number
  likes: number
  comments: number
  shares: number
  engagements: number
}

export default function ContentPerformancePage() {
  const { activeCompany } = useCompany()
  const [platform, setPlatform] = useState('all')
  const [contentType, setContentType] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)

  const [items, setItems] = useState<FormattedContentItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const companyId = activeCompany?.id

  useEffect(() => {
    if (!companyId) return
    let isSubscribed = true

    fetchContentPerformanceData(companyId, {
      platform,
      contentType,
      search,
      sortBy,
      page,
      pageSize: 20
    })
      .then(res => {
        if (isSubscribed) {
          setItems(res.items)
          setTotalCount(res.totalCount)
          setLoading(false)
        }
      })
      .catch(e => {
        console.error('Failed to load content performance:', e)
        if (isSubscribed) setLoading(false)
      })

    return () => {
      isSubscribed = false
    }
  }, [companyId, platform, contentType, search, sortBy, page])


  const renderPlatformIcon = (provider: string) => {
    switch (provider) {
      case 'facebook': return <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
      case 'youtube': return <Youtube className="w-3.5 h-3.5 text-[#FF0000]" />
      case 'instagram': return <Instagram className="w-3.5 h-3.5 text-[#E4405F]" />
      case 'tiktok': return <Video className="w-3.5 h-3.5 text-[#00F2FE]" />
      default: return <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
    }
  }

  if (!activeCompany) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Content Performance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed metric breakdown and ranking for published posts, reels, and videos across channels for <span className="font-semibold text-foreground">{activeCompany.name}</span>.
        </p>
      </div>

      {/* Control Toolbar */}
      <div className="bg-card/80 border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search content by title..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full bg-muted/40 border border-border/50 rounded-xl pl-9 pr-4 py-1.5 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Platform Select */}
          <select
            value={platform}
            onChange={(e) => { setPlatform(e.target.value); setPage(1) }}
            className="bg-muted/40 border border-border/50 text-xs font-semibold rounded-xl px-3 py-1.5 text-foreground cursor-pointer focus:outline-none"
          >
            <option value="all">All Platforms</option>
            <option value="facebook">Facebook</option>
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
          </select>

          {/* Sort Select */}
          <div className="flex items-center gap-1.5 bg-muted/40 border border-border/50 rounded-xl px-3 py-1.5 text-xs font-semibold">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-foreground cursor-pointer focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="views">Most Views</option>
              <option value="engagements">Most Engagements</option>
              <option value="reach">Highest Reach</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Table / List */}
      {loading ? (
        <div className="p-12 text-center bg-card/40 border border-border/40 rounded-2xl">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground font-medium">Loading content performance table...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-border/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center py-20 bg-muted/10">
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground/60 mb-3" />
          <h3 className="text-lg font-bold text-foreground">No Published Content Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Once platforms are connected and synced, your published items will automatically rank here.
          </p>
        </div>
      ) : (
        <div className="bg-card/80 border border-border/80 rounded-2xl overflow-hidden shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Content</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4 text-right">Views</th>
                  <th className="py-3 px-4 text-right">Reach</th>
                  <th className="py-3 px-4 text-right">Likes</th>
                  <th className="py-3 px-4 text-right">Comments</th>
                  <th className="py-3 px-4 text-right">Engagements</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-10 h-10 object-cover rounded-lg border border-border/60 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted/60 border border-border/60 shrink-0 flex items-center justify-center">
                            {renderPlatformIcon(item.provider)}
                          </div>
                        )}
                        <div className="truncate">
                          <h4 className="font-bold text-foreground truncate">{item.title}</h4>
                          <p className="text-[10px] text-muted-foreground truncate">{item.captionExcerpt || item.contentType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        {renderPlatformIcon(item.provider)}
                        <span>{item.provider}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-foreground">
                      {item.views.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-foreground">
                      {item.reach.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {item.likes.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {item.comments.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-primary">
                      {item.engagements.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={item.permalink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {items.length} of {totalCount} items</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border border-border/60 rounded-lg disabled:opacity-40 hover:bg-muted font-bold cursor-pointer"
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                disabled={page * 20 >= totalCount}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-border/60 rounded-lg disabled:opacity-40 hover:bg-muted font-bold cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
