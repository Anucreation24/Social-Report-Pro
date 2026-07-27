'use server'

import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { verifyCompanyPermission } from '@/lib/permissions'

export interface CreateInvitationInput {
  companyId: string
  email: string
  role: 'client_viewer' | 'viewer' | 'marketing_manager' | 'admin' | 'owner'
  welcomeNote?: string
  expiryHours?: number
}

export async function createCompanyInvitationAction(input: CreateInvitationInput) {
  const supabase = await createClient()

  // 1. Verify admin or owner permission
  const perm = await verifyCompanyPermission(input.companyId, ['owner', 'admin'])
  if (!perm.authorized) {
    throw new Error('Unauthorized: Only Owners or Admins can invite team or client users.')
  }
  const user = (await supabase.auth.getUser()).data.user!

  // 2. Generate secure random token & hash
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  const expiryHours = input.expiryHours || 72
  const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000).toISOString()

  // 3. Store invitation record
  const { data: invRow, error } = await supabase
    .from('company_invitations')
    .insert({
      company_id: input.companyId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      token_hash: tokenHash,
      invited_by: user.id,
      welcome_note: input.welcomeNote || null,
      status: 'pending',
      expires_at: expiresAt
    })
    .select('id')
    .single()

  if (error || !invRow) {
    throw new Error(`Failed to create invitation: ${error?.message || 'Database error'}`)
  }

  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invitations/accept?token=${rawToken}`

  return {
    invitationId: invRow.id,
    rawToken,
    acceptUrl,
    expiresAt
  }
}

export async function getCompanyInvitationsAction(companyId: string) {
  const supabase = await createClient()
  const perm = await verifyCompanyPermission(companyId, ['owner', 'admin'])
  if (!perm.authorized) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('company_invitations')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch invitations: ${error.message}`)
  return data || []
}

export async function acceptInvitationAction(rawToken: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated: Please log in or create an account first.')

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  // Fetch invitation
  const { data: inv, error } = await supabase
    .from('company_invitations')
    .select('*')
    .eq('token_hash', tokenHash)
    .single()

  if (error || !inv) throw new Error('Invalid or expired invitation link.')

  if (inv.status !== 'pending') throw new Error(`This invitation has already been ${inv.status}.`)

  if (new Date(inv.expires_at) < new Date()) {
    await supabase.from('company_invitations').update({ status: 'expired' }).eq('id', inv.id)
    throw new Error('This invitation link has expired.')
  }

  // Insert or update company member
  const { error: memberError } = await supabase
    .from('company_members')
    .upsert({
      company_id: inv.company_id,
      user_id: user.id,
      role: inv.role
    }, { onConflict: 'company_id,user_id' })

  if (memberError) throw new Error(`Failed to join company: ${memberError.message}`)

  // Mark invitation accepted
  await supabase
    .from('company_invitations')
    .update({ status: 'accepted' })
    .eq('id', inv.id)

  return {
    success: true,
    companyId: inv.company_id,
    role: inv.role
  }
}

export async function revokeInvitationAction(invitationId: string) {
  const supabase = await createClient()
  const { data: inv } = await supabase
    .from('company_invitations')
    .select('company_id')
    .eq('id', invitationId)
    .single()

  if (!inv) throw new Error('Invitation not found')
  const perm = await verifyCompanyPermission(inv.company_id, ['owner', 'admin'])
  if (!perm.authorized) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('company_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId)

  if (error) throw new Error(`Failed to revoke invitation: ${error.message}`)
  return { success: true }
}
