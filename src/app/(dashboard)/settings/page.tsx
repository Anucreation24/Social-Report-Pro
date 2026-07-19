'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  User,
  Building,
  FileText,
  Sun,
  Moon,
  Laptop,
  Bell,
  Shield,
  Check,
  AlertTriangle,
  Loader2,
  Lock,
  Building2,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import {
  updateProfile,
  updateCompanySettings,
  updateReportPreferences,
  updateNotificationPreferences,
  archiveCompany,
  restoreCompany,
} from '@/features/settings/actions'

const TIMEZONES = [
  { name: 'UTC (GMT+00:00)', value: 'UTC' },
  { name: 'New York (GMT-05:00)', value: 'America/New_York' },
  { name: 'London (GMT+00:00)', value: 'Europe/London' },
  { name: 'Tokyo (GMT+09:00)', value: 'Asia/Tokyo' },
  { name: 'Sydney (GMT+11:00)', value: 'Australia/Sydney' },
  { name: 'Colombo (GMT+05:30)', value: 'Asia/Colombo' },
]

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

const PLATFORMS = ['facebook', 'instagram', 'youtube', 'tiktok']

const SECTIONS = [
  'Executive Summary',
  'Platform Comparison',
  'Facebook',
  'Instagram',
  'YouTube',
  'TikTok',
  'Top Content',
  'Goals',
  'Recommendations',
  'Data Availability Notes',
]

export default function SettingsPage() {
  const { activeCompany, companies, refreshCompanies, setActiveCompanyId } = useCompany()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const supabase = createClient()

  // Tabs state
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'reports' | 'appearance' | 'notifications' | 'security'>('profile')

  // User state
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'marketing_manager' | 'viewer' | null>(null)
  
  // Forms loading/saving states
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Profile Form state
  const [profileName, setProfileName] = useState('')
  const [profileAvatar, setProfileAvatar] = useState('')
  const [profileTimezone, setProfileTimezone] = useState('UTC')

  // Company Form state
  const [companyName, setCompanyName] = useState('')
  const [companyLogo, setCompanyLogo] = useState('')
  const [companyIndustry, setCompanyIndustry] = useState('')
  const [companyCountry, setCompanyCountry] = useState('')
  const [companyTimezone, setCompanyTimezone] = useState('UTC')
  const [companyWeekStart, setCompanyWeekStart] = useState<'sunday' | 'monday'>('monday')

  // Report preferences state
  const [repType, setRepType] = useState<'weekly' | 'monthly'>('weekly')
  const [repPreparedBy, setRepPreparedBy] = useState('')
  const [repPlatforms, setRepPlatforms] = useState<string[]>([])
  const [repSections, setRepSections] = useState<string[]>([])
  const [repDateFormat, setRepDateFormat] = useState('YYYY-MM-DD')
  const [repNumberFormat, setRepNumberFormat] = useState('standard')

  // Notification state
  const [notifConnection, setNotifConnection] = useState(true)
  const [notifToken, setNotifToken] = useState(true)
  const [notifSync, setNotifSync] = useState(true)
  const [notifReport, setNotifReport] = useState(true)
  const [notifGoal, setNotifGoal] = useState(true)
  const [notifInvite, setNotifInvite] = useState(true)

  // Security state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Fetch initial preferences
  const fetchSettingsData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUserEmail(user.email || '')

      // 1. Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setProfileName(profile.full_name || '')
        setProfileAvatar(profile.avatar_url || '')
        setProfileTimezone(profile.timezone || 'UTC')
      }

      // 2. Fetch user role for active company
      if (activeCompany) {
        const { data: member } = await supabase
          .from('company_members')
          .select('role')
          .eq('company_id', activeCompany.id)
          .eq('user_id', user.id)
          .single()

        if (member) {
          setUserRole(member.role as 'owner' | 'admin' | 'marketing_manager' | 'viewer')
        }

        // Set company initial values
        setCompanyName(activeCompany.name)
        setCompanyLogo(activeCompany.logo_url || '')
        setCompanyIndustry(activeCompany.industry || '')
        setCompanyCountry(activeCompany.country || '')
        setCompanyTimezone(activeCompany.timezone)
        setCompanyWeekStart(activeCompany.week_starts_on)

        // 3. Fetch report preferences
        const { data: repPref } = await supabase
          .from('company_preferences')
          .select('settings')
          .eq('company_id', activeCompany.id)
          .single()

        if (repPref && repPref.settings) {
          interface ReportPreferencesJson {
            defaultReportType?: 'weekly' | 'monthly'
            preparedByDefault?: string
            defaultPlatforms?: string[]
            defaultSections?: string[]
            dateFormat?: string
            numberFormat?: string
          }
          const settings = repPref.settings as ReportPreferencesJson
          setRepType(settings.defaultReportType || 'weekly')
          setRepPreparedBy(settings.preparedByDefault || '')
          setRepPlatforms(settings.defaultPlatforms || [])
          setRepSections(settings.defaultSections || [])
          setRepDateFormat(settings.dateFormat || 'YYYY-MM-DD')
          setRepNumberFormat(settings.numberFormat || 'standard')
        }
      }

      // 4. Fetch user preferences
      const { data: userPref } = await supabase
        .from('user_preferences')
        .select('notification_settings')
        .eq('user_id', user.id)
        .single()

      if (userPref && userPref.notification_settings) {
        interface NotificationSettingsJson {
          connectionWarnings?: boolean
          tokenExpiryWarnings?: boolean
          syncFailureNotifications?: boolean
          reportCompletionNotifications?: boolean
          goalAchievementNotifications?: boolean
          teamInvitationNotifications?: boolean
        }
        const notif = userPref.notification_settings as NotificationSettingsJson
        setNotifConnection(notif.connectionWarnings !== false)
        setNotifToken(notif.tokenExpiryWarnings !== false)
        setNotifSync(notif.syncFailureNotifications !== false)
        setNotifReport(notif.reportCompletionNotifications !== false)
        setNotifGoal(notif.goalAchievementNotifications !== false)
        setNotifInvite(notif.teamInvitationNotifications !== false)
      }
    } catch (err) {
      console.error('Failed to load settings data:', err)
    } finally {
      setLoading(false)
    }
  }, [activeCompany, supabase, router])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettingsData()
  }, [fetchSettingsData])

  // Clear messages on tab change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSuccessMsg(null)
    setErrorMsg(null)
  }, [activeTab])

  // Submissions
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    const formData = new FormData()
    formData.append('fullName', profileName)
    formData.append('avatarUrl', profileAvatar)
    formData.append('timezone', profileTimezone)

    try {
      const res = await updateProfile(formData)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg('Profile settings updated successfully!')
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save profile.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCompany) return
    setSubmitting(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    const formData = new FormData()
    formData.append('name', companyName)
    formData.append('logoUrl', companyLogo)
    formData.append('industry', companyIndustry)
    formData.append('country', companyCountry)
    formData.append('timezone', companyTimezone)
    formData.append('weekStartsOn', companyWeekStart)

    try {
      const res = await updateCompanySettings(activeCompany.id, formData)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg('Company settings updated successfully!')
        refreshCompanies()
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save company settings.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveReports = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCompany) return
    setSubmitting(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    const data = {
      defaultReportType: repType,
      preparedByDefault: repPreparedBy,
      defaultPlatforms: repPlatforms,
      defaultSections: repSections,
      dateFormat: repDateFormat,
      numberFormat: repNumberFormat,
    }

    try {
      const res = await updateReportPreferences(activeCompany.id, data)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg('Report preferences updated successfully!')
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save report preferences.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    const data = {
      connectionWarnings: notifConnection,
      tokenExpiryWarnings: notifToken,
      syncFailureNotifications: notifSync,
      reportCompletionNotifications: notifReport,
      goalAchievementNotifications: notifGoal,
      teamInvitationNotifications: notifInvite,
    }

    try {
      const res = await updateNotificationPreferences(data)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg('Notification preferences updated successfully!')
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save notification preferences.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setErrorMsg(error.message)
      } else {
        setSuccessMsg('Password updated successfully!')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleArchive = async () => {
    if (!activeCompany) return
    if (!confirm('Are you absolutely sure you want to archive this company? Dashboard metrics will not be visible until restored.')) return

    setSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await archiveCompany(activeCompany.id)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        // Refresh companies list and redirect to dashboard (will select next active company)
        await refreshCompanies()
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to archive company.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRestore = async (id: string) => {
    setSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await restoreCompany(id)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg('Company restored successfully!')
        await refreshCompanies()
        setActiveCompanyId(id)
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to restore company.')
    } finally {
      setSubmitting(false)
    }
  }

  const togglePlatform = (p: string) => {
    setRepPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    )
  }

  const toggleSection = (s: string) => {
    setRepSections((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    )
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading settings configurations...</p>
      </div>
    )
  }

  const isViewer = userRole === 'viewer'
  const isMarketingManager = userRole === 'marketing_manager'
  const isOwner = userRole === 'owner'
  const isAdmin = userRole === 'admin'
  const canEditCompany = isOwner || isAdmin

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account preferences, company workspace configurations, and default report profiles.
        </p>
      </div>

      {/* Grid containing tabs navigation + panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="flex flex-col space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left font-medium cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Details</span>
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left font-medium cursor-pointer ${
              activeTab === 'company'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Company Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left font-medium cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Report Defaults</span>
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left font-medium cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span>Appearance Theme</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left font-medium cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left font-medium cursor-pointer ${
              activeTab === 'security'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security & Audit</span>
          </button>
        </div>

        {/* Panel Content */}
        <div className="md:col-span-3 bg-card border border-border/60 rounded-xl p-6 shadow-sm min-h-[400px]">
          {/* Alerts */}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Profile Details</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Manage your personal display identity.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    disabled
                    className="w-full bg-muted/30 border border-border/60 rounded-lg px-3.5 py-2 text-sm text-muted-foreground focus:outline-none"
                  />
                  <p className="text-[10px] text-muted-foreground">Your account email address is configured via Supabase Auth and cannot be modified directly.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={profileAvatar}
                    onChange={(e) => setProfileAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Personal Timezone
                  </label>
                  <select
                    value={profileTimezone}
                    onChange={(e) => setProfileTimezone(e.target.value)}
                    className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border/40">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* Company Tab */}
          {activeTab === 'company' && (
            <form onSubmit={handleSaveCompany} className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Company Profile</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage identity configurations for the active company.</p>
                </div>
                {userRole && (
                  <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-primary/20">
                    Role: {userRole.replace('_', ' ')}
                  </span>
                )}
              </div>

              {isViewer && (
                <div className="p-4 bg-muted/40 border border-border/60 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span>You have view-only access for this company profile. Changes can only be modified by owners or administrators.</span>
                </div>
              )}

              {isMarketingManager && (
                <div className="p-4 bg-muted/40 border border-border/60 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span>As Marketing Manager, you may view settings. Contact your Workspace administrator to request configuration updates.</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    disabled={!canEditCompany}
                    className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={companyLogo}
                    onChange={(e) => setCompanyLogo(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    disabled={!canEditCompany}
                    className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Industry
                    </label>
                    <select
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      disabled={!canEditCompany}
                      className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    >
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Country
                    </label>
                    <input
                      type="text"
                      value={companyCountry}
                      onChange={(e) => setCompanyCountry(e.target.value)}
                      required
                      disabled={!canEditCompany}
                      className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Company Timezone
                    </label>
                    <select
                      value={companyTimezone}
                      onChange={(e) => setCompanyTimezone(e.target.value)}
                      disabled={!canEditCompany}
                      className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Week Starts On
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!canEditCompany}
                        onClick={() => setCompanyWeekStart('sunday')}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          companyWeekStart === 'sunday'
                            ? 'bg-primary border-primary text-primary-foreground font-semibold'
                            : 'bg-background border-border/60 text-muted-foreground hover:bg-muted/50'
                        } disabled:opacity-50`}
                      >
                        Sunday
                      </button>
                      <button
                        type="button"
                        disabled={!canEditCompany}
                        onClick={() => setCompanyWeekStart('monday')}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          companyWeekStart === 'monday'
                            ? 'bg-primary border-primary text-primary-foreground font-semibold'
                            : 'bg-background border-border/60 text-muted-foreground hover:bg-muted/50'
                        } disabled:opacity-50`}
                      >
                        Monday
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Archive Section (Owner Only) */}
              {isOwner && activeCompany && (
                <div className="border-t border-destructive/20 pt-6 mt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-destructive">Danger Zone</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Archive this company to soft-delete it. Live tracking will be suspended.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleArchive}
                    disabled={submitting}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Archive Company
                  </button>
                </div>
              )}

              {/* Show Archived Companies (Restore Option - Owner Only) */}
              {isOwner && companies.some(c => c.status === 'archived') && (
                <div className="border-t border-border/60 pt-6 mt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold">Archived Companies</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Restore previously archived companies back to the active workspaces list.</p>
                  </div>
                  <div className="space-y-2">
                    {companies.filter(c => c.status === 'archived').map(comp => (
                      <div key={comp.id} className="flex items-center justify-between p-3 bg-muted/20 border border-border/60 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{comp.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRestore(comp.id)}
                          disabled={submitting}
                          className="bg-muted hover:bg-muted-foreground/10 text-foreground border border-border/60 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canEditCompany && (
                <div className="flex justify-end pt-4 border-t border-border/40">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Company Changes
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Report Tab */}
          {activeTab === 'reports' && (
            <form onSubmit={handleSaveReports} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Report Defaults</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Configure weekly and monthly report preference outputs.</p>
              </div>

              {isViewer && (
                <div className="p-4 bg-muted/40 border border-border/60 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span>You have view-only access. Only company admins can save report configuration changes.</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Default Report Type
                    </label>
                    <select
                      value={repType}
                      onChange={(e) => setRepType(e.target.value as 'weekly' | 'monthly')}
                      disabled={isViewer}
                      className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    >
                      <option value="weekly">Weekly Report</option>
                      <option value="monthly">Monthly Report</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Default Prepared By Text
                    </label>
                    <input
                      type="text"
                      value={repPreparedBy}
                      onChange={(e) => setRepPreparedBy(e.target.value)}
                      placeholder="e.g. Marketing Department"
                      disabled={isViewer}
                      className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Default Platforms */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Default Included Platforms
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => {
                      const isSelected = repPlatforms.includes(p)
                      return (
                        <button
                          key={p}
                          type="button"
                          disabled={isViewer}
                          onClick={() => togglePlatform(p)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-background border-border/60 text-muted-foreground hover:bg-muted/50'
                          } disabled:opacity-50`}
                        >
                          {p}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Default Sections */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Default Report Sections Included
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SECTIONS.map((s) => {
                      const isSelected = repSections.includes(s)
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={isViewer}
                          onClick={() => toggleSection(s)}
                          className={`px-2.5 py-2 rounded-lg border text-xs text-left font-medium transition-colors truncate cursor-pointer ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-background border-border/60 text-muted-foreground hover:bg-muted/50'
                          } disabled:opacity-50`}
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Date Format Default
                    </label>
                    <select
                      value={repDateFormat}
                      onChange={(e) => setRepDateFormat(e.target.value)}
                      disabled={isViewer}
                      className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Number Format Default
                    </label>
                    <select
                      value={repNumberFormat}
                      onChange={(e) => setRepNumberFormat(e.target.value)}
                      disabled={isViewer}
                      className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    >
                      <option value="standard">Standard (e.g. 1,000)</option>
                      <option value="compact">Compact (e.g. 1.0K)</option>
                    </select>
                  </div>
                </div>
              </div>

              {!isViewer && (
                <div className="flex justify-end pt-4 border-t border-border/40">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Report Defaults
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Appearance Theme</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Customize default appearance settings for the workspace dashboard.</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
                    theme === 'light'
                      ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm'
                      : 'border-border/60 bg-muted/10 text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                  }`}
                >
                  <Sun className="w-6 h-6" />
                  <span className="text-xs">Light Theme</span>
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm'
                      : 'border-border/60 bg-muted/10 text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                  }`}
                >
                  <Moon className="w-6 h-6" />
                  <span className="text-xs">Dark Theme</span>
                </button>

                <button
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
                    theme === 'system'
                      ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm'
                      : 'border-border/60 bg-muted/10 text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                  }`}
                >
                  <Laptop className="w-6 h-6" />
                  <span className="text-xs">System Default</span>
                </button>
              </div>

              <div className="p-4 bg-muted/30 border border-border/60 rounded-xl text-xs text-muted-foreground leading-relaxed">
                Theme changes are applied immediately to all views across the active dashboard shell, storing preferences inside local browser settings.
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSaveNotifications} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Notifications Settings</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Define your personal in-app and email notification dispatch triggers.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-muted/10 border border-border/60 rounded-xl">
                  <div className="space-y-0.5">
                    <label className="text-sm font-bold text-foreground block">Connection Warnings</label>
                    <span className="text-xs text-muted-foreground">Trigger warnings if third-party credentials fall out of health sync limits.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifConnection}
                    onChange={(e) => setNotifConnection(e.target.checked)}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/50"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-muted/10 border border-border/60 rounded-xl">
                  <div className="space-y-0.5">
                    <label className="text-sm font-bold text-foreground block">Token Expiry Warnings</label>
                    <span className="text-xs text-muted-foreground">Receive updates before API access tokens reach expiration intervals.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifToken}
                    onChange={(e) => setNotifToken(e.target.checked)}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/50"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-muted/10 border border-border/60 rounded-xl">
                  <div className="space-y-0.5">
                    <label className="text-sm font-bold text-foreground block">Sync Failure Notifications</label>
                    <span className="text-xs text-muted-foreground">Notify immediately if background engine integrations fail execution.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSync}
                    onChange={(e) => setNotifSync(e.target.checked)}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/50"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-muted/10 border border-border/60 rounded-xl">
                  <div className="space-y-0.5">
                    <label className="text-sm font-bold text-foreground block">Report Completion Notifications</label>
                    <span className="text-xs text-muted-foreground">Get updates when weekly or monthly immutable snapshot reports complete compilation.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifReport}
                    onChange={(e) => setNotifReport(e.target.checked)}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/50"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-muted/10 border border-border/60 rounded-xl">
                  <div className="space-y-0.5">
                    <label className="text-sm font-bold text-foreground block">Goal Achievement Notifications</label>
                    <span className="text-xs text-muted-foreground">Celebrate milestones whenever active connection goals are reached.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifGoal}
                    onChange={(e) => setNotifGoal(e.target.checked)}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/50"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-muted/10 border border-border/60 rounded-xl">
                  <div className="space-y-0.5">
                    <label className="text-sm font-bold text-foreground block">Team Invitation Notifications</label>
                    <span className="text-xs text-muted-foreground">Receive invitations to join client workspaces from other workspace owners.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifInvite}
                    onChange={(e) => setNotifInvite(e.target.checked)}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border/40">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Notification Preferences
                </button>
              </div>
            </form>
          )}

          {/* Security & Audit Tab */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              {/* Change Password */}
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Security Settings</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Change your password credentials safely.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-background border border-border/60 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Update Password
                  </button>
                </div>
              </form>

              {/* Session / Storage Info Card */}
              <div className="border-t border-border/60 pt-6 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Browser Session Audit Summary</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Active local credentials inspection breakdown.</p>
                </div>

                <div className="p-4 bg-muted/15 border border-border/60 rounded-xl space-y-3 text-xs leading-relaxed">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-semibold text-muted-foreground">Local Storage Context</span>
                    <code className="text-primary font-bold">activeCompanyId = {activeCompany?.id || 'none'}</code>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-semibold text-muted-foreground">Session Storage Context</span>
                    <code className="text-muted-foreground">[EMPTY]</code>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-semibold text-muted-foreground">Browser Storage Cookies</span>
                    <span className="text-emerald-400 font-bold">Supabase auth tokens (Encrypted HTTPOnly/Session)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">Server-Only Environment Secrets</span>
                    <span className="text-emerald-400 font-bold">Fully isolated on Vercel Edge Server</span>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Notice: We never store third-party credentials or raw OAuth access tokens in local or session browser storages. User credentials are securely handled on PostgreSQL database level protected with robust Row Level Security policies.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
