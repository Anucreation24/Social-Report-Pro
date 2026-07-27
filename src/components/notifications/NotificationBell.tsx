'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, CheckCheck } from 'lucide-react'

export interface InAppNotification {
  id: string
  title: string
  message: string
  link_url?: string | null
  is_read: boolean
  created_at: string
}

export function NotificationBell() {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [loading, setLoading] = useState(false)

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('in_app_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) setNotifications(data as InAppNotification[])
    }

    loadNotifications()
  }, [supabase])

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('in_app_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors relative cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border/80 rounded-2xl shadow-xl z-50 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <h4 className="font-bold text-xs text-foreground">Notifications ({unreadCount})</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No notifications.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`p-2.5 rounded-xl border text-xs space-y-0.5 ${
                    n.is_read ? 'bg-muted/20 border-border/30 opacity-75' : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  <h5 className="font-bold text-foreground">{n.title}</h5>
                  <p className="text-muted-foreground text-[11px]">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
