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

  // 1. Get user's first workspace
  const { data: memberRecord, error: memberError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  let workspaceId = memberRecord?.workspace_id

  // If no workspace, create one
  if (memberError || !workspaceId) {
    const wsName = `${user.email?.split('@')[0]}'s Workspace`
    const wsSlug = wsName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const { data: workspace, error: wsCreateError } = await supabase
      .from('workspaces')
      .insert({
        name: wsName,
        slug: wsSlug,
        created_by: user.id,
      })
      .select()
      .single()

    if (wsCreateError || !workspace) {
      return { error: wsCreateError?.message || 'Failed to create workspace.' }
    }

    workspaceId = workspace.id

    // Add member
    await supabase.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
    })
  }

  // 2. Insert company
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      workspace_id: workspaceId,
      name,
      slug,
      industry,
      country,
      timezone,
      week_starts_on: weekStartsOn,
      status: 'active',
      created_by: user.id,
    })
    .select()
    .single()

  if (companyError || !company) {
    return { error: companyError?.message || 'Failed to create company.' }
  }

  // 3. Add to company members as owner
  const { error: memberError2 } = await supabase
    .from('company_members')
    .insert({
      company_id: company.id,
      user_id: user.id,
      role: 'owner',
    })

  if (memberError2) {
    return { error: memberError2.message }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
