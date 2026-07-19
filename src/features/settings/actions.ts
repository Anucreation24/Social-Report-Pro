'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { verifyCompanyPermission } from '@/lib/permissions'
import { logAuditAction } from '@/lib/audit'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  avatarUrl: z.string().url('Invalid avatar URL').or(z.literal('')),
  timezone: z.string().min(1, 'Timezone is required'),
})

const companySettingsSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  logoUrl: z.string().url('Invalid logo URL').or(z.literal('')),
  industry: z.string().min(1, 'Industry is required'),
  country: z.string().min(1, 'Country is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  weekStartsOn: z.enum(['sunday', 'monday']),
})

const reportPreferencesSchema = z.object({
  defaultReportType: z.enum(['weekly', 'monthly']),
  preparedByDefault: z.string().min(1, 'Prepared by default text is required'),
  defaultPlatforms: z.array(z.string()),
  defaultSections: z.array(z.string()),
  dateFormat: z.string(),
  numberFormat: z.string(),
})

const notificationPreferencesSchema = z.object({
  connectionWarnings: z.boolean(),
  tokenExpiryWarnings: z.boolean(),
  syncFailureNotifications: z.boolean(),
  reportCompletionNotifications: z.boolean(),
  goalAchievementNotifications: z.boolean(),
  teamInvitationNotifications: z.boolean(),
})

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unauthorized user session.' }
  }

  const fullName = formData.get('fullName') as string
  const avatarUrl = formData.get('avatarUrl') as string
  const timezone = formData.get('timezone') as string

  const validation = profileSchema.safeParse({ fullName, avatarUrl, timezone })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      avatar_url: avatarUrl || null,
      timezone: timezone,
    })
    .eq('id', user.id)

  if (profileError) {
    return { error: profileError.message }
  }

  // Update or insert user preferences
  const { error: prefError } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      personal_timezone: timezone,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (prefError) {
    console.error('Failed to update user preferences:', prefError.message)
  }

  await logAuditAction({
    action: 'profile_updated',
    entityType: 'profile',
    entityId: user.id,
    summary: `Profile updated by user: ${fullName}`,
    metadata: { fullName, avatarUrl, timezone },
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function updateCompanySettings(companyId: string, formData: FormData) {
  const permission = await verifyCompanyPermission(companyId, ['owner', 'admin'])
  if (!permission.authorized) {
    return { error: permission.error || 'Access denied.' }
  }

  const name = formData.get('name') as string
  const logoUrl = formData.get('logoUrl') as string
  const industry = formData.get('industry') as string
  const country = formData.get('country') as string
  const timezone = formData.get('timezone') as string
  const weekStartsOn = formData.get('weekStartsOn') as string

  const validation = companySettingsSchema.safeParse({
    name,
    logoUrl,
    industry,
    country,
    timezone,
    weekStartsOn,
  })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from('companies')
    .update({
      name,
      logo_url: logoUrl || null,
      industry,
      country,
      timezone,
      week_starts_on: weekStartsOn,
    })
    .eq('id', companyId)

  if (updateError) {
    return { error: updateError.message }
  }

  await logAuditAction({
    companyId,
    action: 'company_updated',
    entityType: 'company',
    entityId: companyId,
    summary: `Company settings updated: ${name}`,
    metadata: { name, logoUrl, industry, country, timezone, weekStartsOn },
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function updateReportPreferences(companyId: string, data: Record<string, unknown>) {
  const permission = await verifyCompanyPermission(companyId, ['owner', 'admin', 'marketing_manager'])
  if (!permission.authorized) {
    return { error: permission.error || 'Access denied.' }
  }

  const validation = reportPreferencesSchema.safeParse(data)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error: prefError } = await supabase
    .from('company_preferences')
    .upsert({
      company_id: companyId,
      settings: data,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id' })

  if (prefError) {
    return { error: prefError.message }
  }

  await logAuditAction({
    companyId,
    action: 'report_preferences_updated',
    entityType: 'company_preferences',
    entityId: companyId,
    summary: 'Report preferences updated successfully.',
    metadata: data,
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function updateNotificationPreferences(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unauthorized user session.' }
  }

  const validation = notificationPreferencesSchema.safeParse(data)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const { error: prefError } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      notification_settings: data,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (prefError) {
    return { error: prefError.message }
  }

  await logAuditAction({
    action: 'notification_preferences_updated',
    entityType: 'user_preferences',
    entityId: user.id,
    summary: 'Notification preferences updated successfully.',
    metadata: data,
  })

  revalidatePath('/settings')
  return { success: true }
}

export async function archiveCompany(companyId: string) {
  const permission = await verifyCompanyPermission(companyId, ['owner'])
  if (!permission.authorized) {
    return { error: permission.error || 'Only owners can archive companies.' }
  }

  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from('companies')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
    })
    .eq('id', companyId)

  if (updateError) {
    return { error: updateError.message }
  }

  await logAuditAction({
    companyId,
    action: 'company_archived',
    entityType: 'company',
    entityId: companyId,
    summary: 'Company archived successfully.',
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function restoreCompany(companyId: string) {
  const permission = await verifyCompanyPermission(companyId, ['owner'])
  if (!permission.authorized) {
    return { error: permission.error || 'Only owners can restore companies.' }
  }

  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from('companies')
    .update({
      status: 'active',
      archived_at: null,
    })
    .eq('id', companyId)

  if (updateError) {
    return { error: updateError.message }
  }

  await logAuditAction({
    companyId,
    action: 'company_restored',
    entityType: 'company',
    entityId: companyId,
    summary: 'Company restored successfully.',
  })

  revalidatePath('/dashboard')
  return { success: true }
}
