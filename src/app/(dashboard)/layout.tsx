'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCompany } from '@/components/providers/CompanyProvider'
import { logout } from '@/features/auth/actions'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
  Link2,
  BarChart3,
  FileSpreadsheet,
  Target,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  Building,
  Menu,
  User,
  Sun,
  Moon,
} from 'lucide-react'

const NAVIGATION = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Connections', href: '/connections', icon: Link2 },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Content Performance', href: '/content-performance', icon: FileSpreadsheet },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { companies, activeCompany, activeCompanyId, setActiveCompanyId, isLoading } = useCompany()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])
  
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleCompanySwitch = (id: string) => {
    setActiveCompanyId(id)
    setSwitcherOpen(false)
  }

  const handleLogout = async () => {
    await logout()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-card border-r border-border/60 transition-transform duration-300 md:translate-x-0 md:static ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header with Switcher */}
        <div className="p-4 border-b border-border/60 relative">
          <button
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/80 border border-border/60 rounded-lg text-sm transition-colors text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <Building className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-semibold truncate text-foreground">
                {activeCompany ? activeCompany.name : 'Select Company'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
          </button>

          {/* Switcher Dropdown */}
          {switcherOpen && (
            <div className="absolute top-full left-4 right-4 z-50 mt-1 bg-card border border-border/80 rounded-lg shadow-2xl p-1.5 space-y-1">
              <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1">
                Switch Company
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {companies.filter(c => c.status === 'active').map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleCompanySwitch(company.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors text-left ${
                      company.id === activeCompanyId
                        ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                        : 'text-foreground hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span className="truncate">{company.name}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-border/60 pt-1.5 mt-1">
                <Link
                  href="/companies/new"
                  onClick={() => setSwitcherOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Company</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAVIGATION.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={activeCompany ? `${item.href}?companyId=${activeCompany.id}` : item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer / User Profile & Logout */}
        <div className="p-4 border-t border-border/60 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-left"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <header className="h-16 border-b border-border/60 bg-card/50 backdrop-blur-md flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest hidden md:inline">
              Platform
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Compact Theme Switcher */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors border border-border/40 cursor-pointer"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            {/* User Profile Badge */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
