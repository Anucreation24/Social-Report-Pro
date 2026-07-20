'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createAdditionalCompanyAction } from '@/features/companies/actions'
import { useCompany } from '@/components/providers/CompanyProvider'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().min(1, 'Industry is required'),
  country: z.string().min(1, 'Country is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  weekStartsOn: z.enum(['sunday', 'monday']),
})

type CompanyFormValues = z.infer<typeof companySchema>

const INDUSTRIES = [
  'Travel & Tourism',
  'Marketing Agency',
  'E-commerce & Retail',
  'Technology & SaaS',
  'Health & Wellness',
  'Entertainment & Media',
  'Real Estate',
  'Education',
  'Other',
]

const TIMEZONES = [
  { name: 'UTC (GMT+00:00)', value: 'UTC' },
  { name: 'New York (GMT-05:00)', value: 'America/New_York' },
  { name: 'London (GMT+00:00)', value: 'Europe/London' },
  { name: 'Tokyo (GMT+09:00)', value: 'Asia/Tokyo' },
  { name: 'Sydney (GMT+11:00)', value: 'Australia/Sydney' },
  { name: 'Colombo (GMT+05:30)', value: 'Asia/Colombo' },
]

export default function NewCompanyPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { refreshCompanies } = useCompany()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      industry: INDUSTRIES[0],
      country: 'Sri Lanka',
      timezone: 'Asia/Colombo',
      weekStartsOn: 'monday',
    },
  })

  const selectedWeekStart = watch('weekStartsOn')

  const onSubmit = async (values: CompanyFormValues) => {
    setError(null)
    setIsLoading(true)

    const formData = new FormData()
    formData.append('name', values.name)
    formData.append('industry', values.industry)
    formData.append('country', values.country)
    formData.append('timezone', values.timezone)
    formData.append('weekStartsOn', values.weekStartsOn)

    try {
      const res = await createAdditionalCompanyAction(formData)
      if (res?.error) {
        setError(res.error)
      } else if (res?.success && res.companyId) {
        // Refresh context and navigate to dashboard with the new company selected
        await refreshCompanies()
        localStorage.setItem('activeCompanyId', res.companyId)
        try {
          const p = router.push(`/dashboard?companyId=${res.companyId}`) as unknown
          if (p && typeof (p as Promise<unknown>).catch === 'function') {
            (p as Promise<unknown>).catch(() => {})
          }
        } catch {
          // Ignore
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors border border-border/40"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Create Additional Company</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add a new company profile under your current tenant workspace.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Company Name
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="e.g. Thennakoon Tours (Pvt) Ltd"
              disabled={isLoading}
              className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Industry */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Industry
              </label>
              <select
                {...register('industry')}
                disabled={isLoading}
                className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
              {errors.industry && (
                <p className="text-xs text-destructive">{errors.industry.message}</p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Country
              </label>
              <input
                {...register('country')}
                type="text"
                placeholder="e.g. Sri Lanka"
                disabled={isLoading}
                className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              {errors.country && (
                <p className="text-xs text-destructive">{errors.country.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Timezone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Timezone
              </label>
              <select
                {...register('timezone')}
                disabled={isLoading}
                className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.name}
                  </option>
                ))}
              </select>
              {errors.timezone && (
                <p className="text-xs text-destructive">{errors.timezone.message}</p>
              )}
            </div>

            {/* Week Starts On */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Week Starts On
              </label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setValue('weekStartsOn', 'sunday')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    selectedWeekStart === 'sunday'
                      ? 'bg-primary border-primary text-primary-foreground font-bold shadow-sm'
                      : 'bg-background border-border/60 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  Sunday
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setValue('weekStartsOn', 'monday')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    selectedWeekStart === 'monday'
                      ? 'bg-primary border-primary text-primary-foreground font-bold shadow-sm'
                      : 'bg-background border-border/60 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  Monday
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-sm py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 flex items-center justify-center cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create Additional Company'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
