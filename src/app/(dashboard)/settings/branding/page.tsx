'use client'

import React, { useEffect, useState } from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { createClient } from '@/lib/supabase/client'
import { getResolvedBranding, isValidHexColor } from '@/lib/branding/branding-engine'
import { Palette, CheckCircle2, AlertCircle, Loader2, Save, Eye } from 'lucide-react'

export default function BrandingSettingsPage() {
  const { activeCompany } = useCompany()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [agencyName, setAgencyName] = useState('')
  const [agencyLogoUrl, setAgencyLogoUrl] = useState('')
  const [companyLogoUrl, setCompanyLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#4F46E5')
  const [secondaryColor, setSecondaryColor] = useState('#06B6D4')
  const [accentColor, setAccentColor] = useState('#10B981')
  const [footerText, setFooterText] = useState('')
  const [portalWelcomeMessage, setPortalWelcomeMessage] = useState('')

  const [previewTab, setPreviewTab] = useState<'portal' | 'report' | 'share'>('portal')

  useEffect(() => {
    async function loadBranding() {
      setLoading(true)
      try {
        const res = await getResolvedBranding(supabase, activeCompany?.id)
        setAgencyName(res.agencyName)
        setAgencyLogoUrl(res.agencyLogoUrl || '')
        setCompanyLogoUrl(res.companyLogoUrl || '')
        setPrimaryColor(res.primaryColor)
        setSecondaryColor(res.secondaryColor)
        setAccentColor(res.accentColor)
        setFooterText(res.footerText)
        setPortalWelcomeMessage(res.portalWelcomeMessage || '')
      } catch (err: unknown) {
        console.error('Failed to load branding:', err)
      } finally {
        setLoading(false)
      }
    }

    loadBranding()
  }, [activeCompany, supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCompany) return

    if (!isValidHexColor(primaryColor) || !isValidHexColor(secondaryColor) || !isValidHexColor(accentColor)) {
      setError('Please provide valid 6-digit hex colors (e.g., #4F46E5).')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: upsertErr } = await supabase
        .from('branding_settings')
        .upsert({
          company_id: activeCompany.id,
          agency_name: agencyName,
          agency_logo_url: agencyLogoUrl || null,
          company_logo_url: companyLogoUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_color: accentColor,
          footer_text: footerText,
          portal_welcome_message: portalWelcomeMessage,
          updated_at: new Date().toISOString()
        }, { onConflict: 'company_id' })

      if (upsertErr) throw upsertErr

      setSuccess('Branding settings saved successfully!')
    } catch (err: unknown) {
      console.error('Failed to save branding:', err)
      setError((err as Error).message || 'Failed to save branding settings.')
    } finally {
      setSaving(false)
    }
  }

  if (!activeCompany) return null

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Agency & Report Branding</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Customize colors, logos, and report styling for {activeCompany.name}.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Error</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Success</h4>
            <p className="mt-0.5">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Configuration Form */}
        <form onSubmit={handleSave} className="bg-card border border-border/60 rounded-2xl p-6 space-y-5 shadow-sm">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" /> Brand Customization
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-foreground mb-1">Agency Display Name</label>
              <input
                type="text"
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">Company Logo URL (Optional)</label>
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                value={companyLogoUrl}
                onChange={e => setCompanyLogoUrl(e.target.value)}
                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-foreground mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-border/40"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-full font-mono text-[11px] bg-muted/40 border border-border/60 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-border/40"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="w-full font-mono text-[11px] bg-muted/40 border border-border/60 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-border/40"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    className="w-full font-mono text-[11px] bg-muted/40 border border-border/60 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">Report Footer Text</label>
              <input
                type="text"
                value={footerText}
                onChange={e => setFooterText(e.target.value)}
                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">Client Portal Welcome Message</label>
              <textarea
                rows={2}
                value={portalWelcomeMessage}
                onChange={e => setPortalWelcomeMessage(e.target.value)}
                className="w-full bg-muted/40 border border-border/60 rounded-xl p-3 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border/40 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-5 py-2.5 rounded-xl disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Branding
            </button>
          </div>
        </form>

        {/* Live Preview Screen */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> Live Brand Preview
            </h3>
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewTab('portal')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${previewTab === 'portal' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'}`}
              >
                Portal
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('report')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${previewTab === 'report' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'}`}
              >
                Report
              </button>
            </div>
          </div>

          {/* Simulated Preview Box */}
          <div className="border border-border/60 rounded-xl p-6 bg-background space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: primaryColor }}>
                  {activeCompany.name.charAt(0)}
                </div>
                <span className="font-bold text-sm text-foreground">{activeCompany.name}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: accentColor }}>
                Verified
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-foreground">Monthly Analytics Performance</h4>
              <p className="text-xs text-muted-foreground">{portalWelcomeMessage || 'Welcome to your verified client analytics portal.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl border border-border/40 text-center" style={{ backgroundColor: `${secondaryColor}15` }}>
                <span className="block text-lg font-extrabold text-foreground">12,500</span>
                <span className="text-[10px] text-muted-foreground font-semibold">Total Followers</span>
              </div>
              <div className="p-3 rounded-xl border border-border/40 text-center" style={{ backgroundColor: `${primaryColor}15` }}>
                <span className="block text-lg font-extrabold text-foreground">45,000</span>
                <span className="text-[10px] text-muted-foreground font-semibold">Total Reach</span>
              </div>
            </div>

            <div className="text-[10px] text-center text-muted-foreground pt-4 border-t border-border/40 font-mono">
              {footerText || 'Powered by Social Report Pro'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
