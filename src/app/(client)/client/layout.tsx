'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCompany } from '@/components/providers/CompanyProvider'
import { 
  LayoutDashboard, BarChart3, Film, FileText, User, 
  LogOut, Shield, Bell, CheckCircle2, ChevronDown
} from 'lucide-react'

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { activeCompany, companies, setActiveCompanyId } = useCompany()

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserEmail(user.email || null)
      setLoading(false)
    }
    checkAuth()
  }, [supabase, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { label: 'Overview', href: '/client/dashboard', icon: LayoutDashboard },
    { label: 'Analytics', href: '/client/analytics', icon: BarChart3 },
    { label: 'Content', href: '/client/content', icon: Film },
    { label: 'Reports', href: '/client/reports', icon: FileText },
    { label: 'Profile', href: '/client/profile', icon: User }
  ]

  if (loading) return null

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Client Header */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/client/dashboard" className="flex items-center gap-2 font-black text-lg tracking-tight text-foreground">
              <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
                S
              </div>
              <span>Social Report Pro <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full ml-1">Client Portal</span></span>
            </Link>

            {/* Company Selector (Only shown if client belongs to multiple companies) */}
            {companies.length > 1 && (
              <div className="relative">
                <select
                  value={activeCompany?.id || ''}
                  onChange={e => {
                    setActiveCompanyId(e.target.value)
                  }}
                  className="bg-muted/50 border border-border/60 rounded-xl text-xs font-bold px-3 py-1.5 focus:outline-none focus:border-primary text-foreground"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            {activeCompany && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5" /> {activeCompany.name}
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center justify-around border-t border-border/40 py-2 bg-card">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 text-[10px] font-bold p-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Client Footer */}
      <footer className="border-t border-border/40 bg-card py-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Social Report Pro Client Portal. All analytics verified with source transparency.</p>
      </footer>
    </div>
  )
}
