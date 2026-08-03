import { SupabaseClient } from '@supabase/supabase-js'
import { siteConfig } from '@/lib/site-config'

export interface ResolvedBranding {
  agencyName: string
  agencyLogoUrl?: string | null
  companyLogoUrl?: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  footerText: string
  supportEmail?: string | null
  websiteUrl?: string | null
  portalWelcomeMessage?: string | null
  source: 'company' | 'agency' | 'default'
}

export const SYSTEM_FALLBACK_BRANDING: ResolvedBranding = {
  agencyName: 'Social Report Pro',
  agencyLogoUrl: null,
  companyLogoUrl: null,
  primaryColor: '#4F46E5',
  secondaryColor: '#06B6D4',
  accentColor: '#10B981',
  footerText: 'Powered by Social Report Pro Analytics Engine',
  supportEmail: siteConfig.supportEmail,
  websiteUrl: 'https://social-report-pro.vercel.app',
  portalWelcomeMessage: 'Welcome to your Social Report Pro Client Analytics Portal.',
  source: 'default'
}

/**
 * Validates 6-digit hex color format (#RRGGBB).
 */
export function isValidHexColor(color?: string): boolean {
  if (!color) return false
  return /^#([A-Fa-f0-9]{6})$/.test(color.trim())
}

/**
 * Resolves active branding applying priority hierarchy:
 * 1. Company Specific Branding
 * 2. Agency Default Branding
 * 3. System Fallback Branding
 */
export async function getResolvedBranding(
  supabase: SupabaseClient,
  companyId?: string
): Promise<ResolvedBranding> {
  // 1. Check Company Specific Branding
  if (companyId) {
    const { data: compBrand } = await supabase
      .from('branding_settings')
      .select('*')
      .eq('company_id', companyId)
      .single()

    if (compBrand) {
      return {
        agencyName: compBrand.agency_name || SYSTEM_FALLBACK_BRANDING.agencyName,
        agencyLogoUrl: compBrand.agency_logo_url || null,
        companyLogoUrl: compBrand.company_logo_url || null,
        primaryColor: isValidHexColor(compBrand.primary_color) ? compBrand.primary_color : SYSTEM_FALLBACK_BRANDING.primaryColor,
        secondaryColor: isValidHexColor(compBrand.secondary_color) ? compBrand.secondary_color : SYSTEM_FALLBACK_BRANDING.secondaryColor,
        accentColor: isValidHexColor(compBrand.accent_color) ? compBrand.accent_color : SYSTEM_FALLBACK_BRANDING.accentColor,
        footerText: compBrand.footer_text || SYSTEM_FALLBACK_BRANDING.footerText,
        supportEmail: compBrand.support_email || SYSTEM_FALLBACK_BRANDING.supportEmail,
        websiteUrl: compBrand.website_url || SYSTEM_FALLBACK_BRANDING.websiteUrl,
        portalWelcomeMessage: compBrand.portal_welcome_message || SYSTEM_FALLBACK_BRANDING.portalWelcomeMessage,
        source: 'company'
      }
    }
  }

  // 2. Check Agency Default Branding
  const { data: agencyBrand } = await supabase
    .from('branding_settings')
    .select('*')
    .is('company_id', null)
    .single()

  if (agencyBrand) {
    return {
      agencyName: agencyBrand.agency_name || SYSTEM_FALLBACK_BRANDING.agencyName,
      agencyLogoUrl: agencyBrand.agency_logo_url || null,
      companyLogoUrl: agencyBrand.company_logo_url || null,
      primaryColor: isValidHexColor(agencyBrand.primary_color) ? agencyBrand.primary_color : SYSTEM_FALLBACK_BRANDING.primaryColor,
      secondaryColor: isValidHexColor(agencyBrand.secondary_color) ? agencyBrand.secondary_color : SYSTEM_FALLBACK_BRANDING.secondaryColor,
      accentColor: isValidHexColor(agencyBrand.accent_color) ? agencyBrand.accent_color : SYSTEM_FALLBACK_BRANDING.accentColor,
      footerText: agencyBrand.footer_text || SYSTEM_FALLBACK_BRANDING.footerText,
      supportEmail: agencyBrand.support_email || SYSTEM_FALLBACK_BRANDING.supportEmail,
      websiteUrl: agencyBrand.website_url || SYSTEM_FALLBACK_BRANDING.websiteUrl,
      portalWelcomeMessage: agencyBrand.portal_welcome_message || SYSTEM_FALLBACK_BRANDING.portalWelcomeMessage,
      source: 'agency'
    }
  }

  // 3. System Fallback
  return SYSTEM_FALLBACK_BRANDING
}
