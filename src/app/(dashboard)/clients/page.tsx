'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Building2, Plus, Filter, Search, ChevronRight, Activity, 
  FileText, Users, CheckCircle2, ShieldCheck, ExternalLink, Loader2
} from 'lucide-react'

export default function ClientDirectoryPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState<Array<Record<string, unknown>>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function fetchClients() {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('companies')
          .select(`
            id, name, slug, created_at,
            company_members (id, role),
            platform_connections (id, provider, connection_status),
            generated_reports (id, created_at)
          `)

        if (data) setCompanies(data as Array<Record<string, unknown>>)
      } catch (err: unknown) {
        console.error('Failed to load client directory:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [supabase])

  const filteredCompanies = companies.filter(c => {
    const nameMatch = String(c.name).toLowerCase().includes(searchQuery.toLowerCase())
    if (!nameMatch) return false

    if (filter === 'api') {
      const conns = (c.platform_connections || []) as Array<{ connection_status: string }>
      return conns.some(conn => conn.connection_status === 'connected')
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Client Directory</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Directory of managed client companies, platforms, connections, and report statuses.
          </p>
        </div>

        <Link
          href="/companies/new"
          className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Client Company
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border/60 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search client companies..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-muted/40 border border-border/60 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'api'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                filter === f
                  ? 'bg-primary/10 border border-primary text-primary'
                  : 'bg-muted/40 border border-border/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? 'All Clients' : 'API Connected'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="bg-card border border-border/60 rounded-2xl p-12 text-center space-y-3">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">No Client Companies Found</h3>
          <p className="text-xs text-muted-foreground">Add your first client company to manage reports and connections.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map(c => {
            const members = (c.company_members || []) as Array<unknown>
            const conns = (c.platform_connections || []) as Array<{ provider: string; connection_status: string }>
            const activeConns = conns.filter(conn => conn.connection_status === 'connected')
            const reports = (c.generated_reports || []) as Array<unknown>

            return (
              <div key={String(c.id)} className="bg-card border border-border/60 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-border transition-all shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                        {String(c.name).charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">{String(c.name)}</h3>
                        <p className="text-[10px] text-muted-foreground">{members.length} Members</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Active
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <span>API Connections:</span>
                      <span className="font-bold text-foreground">{activeConns.length} Connected</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Generated Reports:</span>
                      <span className="font-bold text-foreground">{reports.length} Reports</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                  <Link
                    href={`/dashboard?companyId=${c.id}`}
                    className="inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-3.5 py-2 rounded-xl transition-colors"
                  >
                    Open Dashboard <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/client/dashboard?companyId=${c.id}`}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    Portal <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
