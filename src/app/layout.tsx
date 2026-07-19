import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CompanyProvider } from '@/components/providers/CompanyProvider'
import React, { Suspense } from 'react'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Social Report Pro — Multi-Company Social Analytics & Reporting SaaS',
  description: 'Connect your business social media accounts, track performance metrics, establish marketing goals, and generate professional marketing reports.',
}

import { ThemeProvider } from '@/components/providers/ThemeProvider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <CompanyProvider>
              {children}
            </CompanyProvider>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  )
}
