'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().min(1, 'Industry is required'),
  country: z.string().min(1, 'Country is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  weekStartsOn: z.enum(['sunday', 'monday']),
})

export async function createCompany(formData: FormData) {
  const name = formData.get('name') as string
  const industry = formData.get('industry') as string
  const country = formData.get('country') as string
  const timezone = formData.get('timezone') as string
  const weekStartsOn = formData.get('weekStartsOn') as string

  const validation = companySchema.safeParse({
    name,
    industry,
    country,
    timezone,
    weekStartsOn,
  })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unauthorized user session.' }
  }

  const wsName = `${user.email?.split('@')[0]}'s Workspace`
  const wsSlug = wsName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  // Call the transaction-safe SQL onboarding RPC function
  const { data: onboardingData, error: rpcError } = await supabase.rpc('handle_onboarding', {
    ws_name: wsName,
    ws_slug: wsSlug,
    company_name: name,
    company_slug: slug,
    company_industry: industry,
    company_country: country,
    company_timezone: timezone,
    company_week_starts_on: weekStartsOn
  })

  if (rpcError || !onboardingData) {
    return { error: rpcError?.message || 'Failed to complete onboarding transaction.' }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
