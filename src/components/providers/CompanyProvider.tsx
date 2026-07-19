'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Company {
  id: string
  name: string
  slug: string
  logo_url: string | null
  industry: string | null
  country: string | null
  timezone: string
  week_starts_on: 'sunday' | 'monday'
  status: 'active' | 'archived'
}

interface CompanyContextType {
  companies: Company[]
  activeCompany: Company | null
  activeCompanyId: string | null
  setActiveCompanyId: (id: string) => void
  isLoading: boolean
  refreshCompanies: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const fetchCompanies = useCallback(async () => {
    try {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCompanies([])
        setIsLoading(false)
        return
      }

      // Fetch company members -> companies
      const { data: memberRecords, error: memberError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)

      if (memberError || !memberRecords || memberRecords.length === 0) {
        setCompanies([])
        setIsLoading(false)
        // If we are not on login/register/onboarding, redirect to onboarding
        if (!['/login', '/register', '/onboarding', '/forgot-password', '/reset-password', '/'].includes(pathname)) {
          router.push('/onboarding')
        }
        return
      }

      const companyIds = memberRecords.map(r => r.company_id)
      const { data: companyRecords, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .in('id', companyIds)

      if (companyError || !companyRecords) {
        console.error('Error fetching companies:', companyError)
        setCompanies([])
        setIsLoading(false)
        return
      }

      setCompanies(companyRecords as Company[])

      // Active companies are those with status === 'active'
      const activeRecords = companyRecords.filter(c => c.status === 'active')

      // Determine active company ID:
      // 1. From URL query param
      // 2. From localStorage
      // 3. First active company from DB
      const urlCompanyId = searchParams.get('companyId')
      const storedCompanyId = localStorage.getItem('activeCompanyId')
      
      let selectedId: string | null = null
      if (urlCompanyId && activeRecords.some(c => c.id === urlCompanyId)) {
        selectedId = urlCompanyId
      } else if (storedCompanyId && activeRecords.some(c => c.id === storedCompanyId)) {
        selectedId = storedCompanyId
      } else if (activeRecords.length > 0) {
        selectedId = activeRecords[0].id
      }

      if (selectedId) {
        setActiveCompanyIdState(selectedId)
        localStorage.setItem('activeCompanyId', selectedId)
      } else {
        // No active company exists, redirect to onboarding or company creation
        setActiveCompanyIdState(null)
        if (!['/login', '/register', '/onboarding', '/forgot-password', '/reset-password', '/'].includes(pathname)) {
          router.push('/onboarding')
        }
      }
    } catch (err) {
      console.error('Failed to initialize companies context:', err)
    } finally {
      setIsLoading(false)
    }
  }, [pathname, router, searchParams, supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCompanies()
  }, [fetchCompanies])

  const setActiveCompanyId = (id: string) => {
    if (companies.some(c => c.id === id)) {
      setActiveCompanyIdState(id)
      localStorage.setItem('activeCompanyId', id)
      
      // Update URL query parameter
      const params = new URLSearchParams(searchParams.toString())
      params.set('companyId', id)
      router.push(`${pathname}?${params.toString()}`)
    }
  }

  const activeCompany = companies.find(c => c.id === activeCompanyId) || null

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        activeCompanyId,
        setActiveCompanyId,
        isLoading,
        refreshCompanies: fetchCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}
