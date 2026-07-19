import React from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart3, Target, Shield } from 'lucide-react'

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col justify-between">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      {/* Header navbar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 h-20 flex items-center justify-between border-b border-border/20">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-widest uppercase text-primary">
            Social Report Pro
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold hover:text-primary transition-colors text-muted-foreground"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-20 md:py-32 text-center flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/40 border border-border/60 rounded-full text-xs text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>Stage 1 Core Foundation Live</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none text-foreground">
          SaaS Social Media Analytics <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">
            & Reporting for Multi-Company
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Aggregated analytics, target setting, and automated client performance reports across multiple companies. Isolated, role-governed workspaces for marketing departments and agencies.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/register"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 group cursor-pointer"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="bg-muted/40 hover:bg-muted/80 text-foreground border border-border/60 font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Features row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 w-full text-left">
          <div className="bg-card border border-border/60 rounded-xl p-6 space-y-3">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg w-fit">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">Multi-Company Switcher</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Isolate platform connections, historical stats, and weekly/monthly performance reports by company. Switch instantly.
            </p>
          </div>

          <div className="bg-card border border-border/60 rounded-xl p-6 space-y-3">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg w-fit">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">Marketing KPI Goals</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Define weekly and monthly target performance indicators per platform connection and track metrics dynamically.
            </p>
          </div>

          <div className="bg-card border border-border/60 rounded-xl p-6 space-y-3">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg w-fit">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">Row Level Security</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enterprise-grade PostgreSQL isolation. Roles enforce distinct permissions for Owners, Admins, Managers, and Viewers.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/20 py-8 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Social Report Pro. All rights reserved.</p>
      </footer>
    </div>
  )
}
