'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Clock, Mail, List, ChevronRight, ArrowUp, Printer } from 'lucide-react'
import { siteConfig } from '@/lib/site-config'

export interface TocItem {
  id: string
  title: string
}

interface LegalPageLayoutProps {
  title: string
  description: string
  lastUpdated?: string
  toc: TocItem[]
  children: React.ReactNode
}

export function LegalPageLayout({
  title,
  description,
  lastUpdated = siteConfig.lastUpdated,
  toc,
  children
}: LegalPageLayoutProps) {
  const [mobileTocOpen, setMobileTocOpen] = useState(false)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors bg-muted/30 hover:bg-muted/60 px-3 py-1.5 rounded-lg border border-border/40"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <span className="hidden sm:inline-block text-border/60">|</span>
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-widest text-primary">
              {siteConfig.productName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted/50 px-2.5 py-1.5 rounded-lg border border-border/40 transition-colors"
              title="Print document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Title Section */}
      <section className="bg-gradient-to-b from-muted/30 to-background border-b border-border/40 py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>Legal Documentation & Developer Compliance</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            {description}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground border-t border-border/30 max-w-fit">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Last Updated: <strong className="text-foreground">{lastUpdated}</strong></span>
            </div>
            <span>•</span>
            <div>
              <span>Legal Entity: <strong className="text-foreground">{siteConfig.companyName}</strong> ({siteConfig.country})</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Table of Contents Toggle */}
      <div className="lg:hidden sticky top-16 z-30 bg-card border-b border-border/40 px-4 py-2.5 print:hidden">
        <button
          onClick={() => setMobileTocOpen(!mobileTocOpen)}
          className="w-full flex items-center justify-between text-xs font-semibold text-foreground"
        >
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-primary" />
            <span>Table of Contents ({toc.length} Sections)</span>
          </div>
          <ChevronRight className={`w-4 h-4 transition-transform ${mobileTocOpen ? 'rotate-90' : ''}`} />
        </button>

        {mobileTocOpen && (
          <nav className="mt-3 pt-3 border-t border-border/40 max-h-60 overflow-y-auto space-y-1">
            {toc.map((item, idx) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setMobileTocOpen(false)}
                className="block text-xs text-muted-foreground hover:text-primary py-1 px-2 rounded hover:bg-muted/40 transition-colors"
              >
                {idx + 1}. {item.title}
              </a>
            ))}
          </nav>
        )}
      </div>

      {/* Main Content Area with Desktop Sidebar */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sticky Table of Contents Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 print:hidden">
          <div className="sticky top-24 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-thin">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <List className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Table of Contents</h2>
            </div>
            <nav className="space-y-1">
              {toc.map((item, idx) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="group flex items-start gap-2 text-xs text-muted-foreground hover:text-primary py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors leading-relaxed"
                >
                  <span className="text-primary font-mono text-[10px] min-w-5 pt-0.5">{idx + 1}.</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">{item.title}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Legal Document Article Body */}
        <article className="lg:col-span-3 space-y-10 prose prose-slate dark:prose-invert max-w-none text-foreground">
          {children}

          {/* Footer Navigation & Back to top */}
          <div className="pt-8 border-t border-border/40 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground print:hidden">
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              <span>•</span>
              <Link href="/data-deletion" className="hover:text-primary transition-colors">Data Deletion</Link>
            </div>

            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted/50 px-3 py-1.5 rounded-lg border border-border/40 transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Back to Top</span>
            </button>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 bg-card/40 text-center text-xs text-muted-foreground print:hidden">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} {siteConfig.companyName}. All rights reserved.</p>
          <p className="text-[11px] text-muted-foreground/80">
            {siteConfig.productName} ({siteConfig.name}) is an independent social media analytics platform.
          </p>
        </div>
      </footer>
    </div>
  )
}
