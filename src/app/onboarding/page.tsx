'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createCompany } from '@/features/companies/actions'

const onboardingSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().min(1, 'Industry is required'),
  country: z.string().min(1, 'Country is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  weekStartsOn: z.enum(['sunday', 'monday']),
})

type OnboardingFormValues = z.infer<typeof onboardingSchema>

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

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: '',
      industry: INDUSTRIES[0],
      country: 'Sri Lanka',
      timezone: 'Asia/Colombo',
      weekStartsOn: 'monday',
    },
  })

  const selectedWeekStart = watch('weekStartsOn')

  const onSubmit = async (values: OnboardingFormValues) => {
    setError(null)
    setIsLoading(true)

    const formData = new FormData()
    formData.append('name', values.name)
    formData.append('industry', values.industry)
    formData.append('country', values.country)
    formData.append('timezone', values.timezone)
    formData.append('weekStartsOn', values.weekStartsOn)

    try {
      const res = await createCompany(formData)
      if (res?.error) {
        setError(res.error)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-xl">
        <div className="flex flex-col items-center mb-8 text-center">
          <span className="text-xl font-bold tracking-wider uppercase text-primary">
            Social Report Pro
          </span>
          <h1 className="text-3xl font-extrabold mt-3 tracking-tight">Set up your company</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Create your first company profile to start connecting platforms and generating reports.
          </p>
        </div>

        <div className="bg-muted/30 backdrop-blur-md border border-border/60 rounded-xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Company Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Company Name
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="e.g. Thennakoon Tours"
                disabled={isLoading}
                className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Industry */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Timezone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Week Starts On
                </label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setValue('weekStartsOn', 'sunday')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      selectedWeekStart === 'sunday'
                        ? 'bg-primary border-primary text-primary-foreground'
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
                        ? 'bg-primary border-primary text-primary-foreground'
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
              className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-sm py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                'Create Company & Open Dashboard'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
