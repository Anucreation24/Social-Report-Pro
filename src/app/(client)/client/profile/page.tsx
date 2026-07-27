'use client'

import React, { useEffect, useState } from 'react'
import { useCompany } from '@/components/providers/CompanyProvider'
import { createClient } from '@/lib/supabase/client'
import { User, ShieldCheck, Mail, Building2, CheckCircle2 } from 'lucide-react'

export default function ClientProfilePage() {
  const { activeCompany } = useCompany()
  const supabase = createClient()

  const [userEmail, setUserEmail] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('Client Viewer')

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || 'Client User')
        if (activeCompany) {
          const { data: member } = await supabase
            .from('company_members')
            .select('role')
            .eq('company_id', activeCompany.id)
            .eq('user_id', user.id)
            .single()
          if (member) setUserRole(member.role.replace('_', ' ').toUpperCase())
        }
      }
    }
    loadUser()
  }, [activeCompany, supabase])

  if (!activeCompany) return null

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Client User Profile</h1>
        <p className="text-xs text-muted-foreground mt-1">Your account information and access privileges.</p>
      </div>

      <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-lg">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">{userEmail}</h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> Active Client Portal Access
            </span>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-border/40 text-xs">
          <div className="flex items-center justify-between p-3 bg-muted/30 border border-border/40 rounded-xl">
            <span className="text-muted-foreground flex items-center gap-2 font-medium">
              <Building2 className="w-4 h-4 text-primary" /> Company Access:
            </span>
            <span className="font-bold text-foreground">{activeCompany.name}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 border border-border/40 rounded-xl">
            <span className="text-muted-foreground flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-primary" /> Granted Role:
            </span>
            <span className="font-bold text-foreground">{userRole}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
