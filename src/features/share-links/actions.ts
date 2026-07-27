'use server'

import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { verifyCompanyPermission } from '@/lib/permissions'

export interface CreateShareLinkInput {
  companyId: string
  reportId: string
  expiryDays?: number
  allowPdfDownload?: boolean
  allowExcelDownload?: boolean
  password?: string
  safeLabel?: string
}

export async function createReportShareLinkAction(input: CreateShareLinkInput) {
  const supabase = await createClient()

  // 1. Verify Manager/Admin/Owner permission
  const perm = await verifyCompanyPermission(input.companyId, ['owner', 'admin', 'marketing_manager'])
  if (!perm.authorized) {
    throw new Error('Unauthorized: Only Marketing Managers, Admins, or Owners can generate share links.')
  }
  const user = (await supabase.auth.getUser()).data.user!

  // 2. Generate secure random token (never stored raw in DB!)
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  const expiryDays = input.expiryDays || 7
  const expiresAt = new Date(Date.now() + expiryDays * 86400 * 1000).toISOString()

  let passwordHash: string | null = null
  if (input.password && input.password.trim() !== '') {
    passwordHash = crypto.createHash('sha256').update(input.password.trim()).digest('hex')
  }

  // 3. Store share link record
  const { data: shareRow, error } = await supabase
    .from('report_share_links')
    .insert({
      company_id: input.companyId,
      generated_report_id: input.reportId,
      token_hash: tokenHash,
      created_by: user.id,
      expires_at: expiresAt,
      allow_pdf_download: input.allowPdfDownload ?? true,
      allow_excel_download: input.allowExcelDownload ?? true,
      password_hash: passwordHash,
      status: 'active',
      safe_label: input.safeLabel || `Share Link (${expiryDays} Days)`
    })
    .select('id')
    .single()

  if (error || !shareRow) {
    throw new Error(`Failed to create report share link: ${error?.message || 'Database error'}`)
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shared/reports/${rawToken}`

  return {
    shareLinkId: shareRow.id,
    rawToken,
    shareUrl,
    expiresAt
  }
}

export async function getPublicShareReportAction(rawToken: string, providedPassword?: string) {
  const supabase = await createClient()
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  // 1. Fetch share link
  const { data: shareLink, error } = await supabase
    .from('report_share_links')
    .select('*')
    .eq('token_hash', tokenHash)
    .single()

  if (error || !shareLink) {
    throw new Error('Invalid or expired share link.')
  }

  // 2. Validate expiration and status
  if (shareLink.status !== 'active' || shareLink.revoked_at) {
    throw new Error('This report share link has been revoked.')
  }

  if (new Date(shareLink.expires_at) < new Date()) {
    await supabase.from('report_share_links').update({ status: 'expired' }).eq('id', shareLink.id)
    throw new Error('This report share link has expired.')
  }

  // 3. Password Verification
  if (shareLink.password_hash) {
    if (!providedPassword) {
      return { requiresPassword: true, shareLinkId: shareLink.id }
    }
    const inputHash = crypto.createHash('sha256').update(providedPassword.trim()).digest('hex')
    if (inputHash !== shareLink.password_hash) {
      throw new Error('Incorrect password.')
    }
  }

  // Update access stats
  await supabase
    .from('report_share_links')
    .update({
      access_count: (shareLink.access_count || 0) + 1,
      last_accessed_at: new Date().toISOString()
    })
    .eq('id', shareLink.id)

  // 4. Fetch Report Data & Company Info
  const { data: report } = await supabase
    .from('generated_reports')
    .select('*')
    .eq('id', shareLink.generated_report_id)
    .single()

  if (!report) throw new Error('Report data not found.')

  const { data: company } = await supabase
    .from('companies')
    .select('name, logo_url')
    .eq('id', shareLink.company_id)
    .single()

  return {
    requiresPassword: false,
    shareLink: {
      id: shareLink.id,
      allowPdfDownload: shareLink.allow_pdf_download,
      allowExcelDownload: shareLink.allow_excel_download,
      expiresAt: shareLink.expires_at
    },
    companyName: company?.name || 'Client',
    companyLogoUrl: company?.logo_url || null,
    reportTitle: report.report_title,
    reportType: report.report_type,
    periodStart: report.period_start,
    periodEnd: report.period_end,
    snapshot: report.report_snapshot,
    reportId: report.id
  }
}

export async function revokeReportShareLinkAction(shareLinkId: string) {
  const supabase = await createClient()

  const { data: link } = await supabase
    .from('report_share_links')
    .select('company_id')
    .eq('id', shareLinkId)
    .single()

  if (!link) throw new Error('Share link not found')

  const perm = await verifyCompanyPermission(link.company_id, ['owner', 'admin', 'marketing_manager'])
  if (!perm.authorized) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('report_share_links')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString()
    })
    .eq('id', shareLinkId)

  if (error) throw new Error(`Failed to revoke share link: ${error.message}`)
  return { success: true }
}
