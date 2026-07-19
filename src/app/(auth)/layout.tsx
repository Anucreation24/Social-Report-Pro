import React from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 py-12 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      {/* Main card wrapper */}
      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <span className="text-xl font-bold tracking-wider uppercase text-primary">
            Social Report Pro
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            Multi-Company Social Analytics & Reporting
          </span>
        </div>
        <div className="w-full bg-muted/30 backdrop-blur-md border border-border/60 rounded-xl p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  )
}
