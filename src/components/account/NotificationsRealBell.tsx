'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { Bell, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { markRead } from '@/actions/notifications/markRead'
import { markAllRead } from '@/actions/notifications/markAllRead'
import type { Notification } from '@/lib/notifications/queries'

interface NotificationsRealBellProps {
  userId: string
  initial: Notification[]
}

export default function NotificationsRealBell({ userId, initial }: NotificationsRealBellProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>(initial)
  const [, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setItems((prev) => [payload.new as Notification, ...prev].slice(0, 30))
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setItems((prev) => prev.map((n) => n.id === (payload.new as Notification).id ? (payload.new as Notification) : n))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const unreadCount = items.filter((n) => !n.read_at).length

  function handleClickItem(id: string) {
    startTransition(async () => { await markRead(id) })
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
  }

  function handleMarkAll() {
    startTransition(async () => { await markAllRead() })
    const now = new Date().toISOString()
    setItems((prev) => prev.map((n) => n.read_at ? n : { ...n, read_at: now }))
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-[#006B3C]/8 bg-white transition-all hover:border-[#006B3C]/20 hover:shadow-sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        <Bell className="h-[17px] w-[17px] text-[#006B3C]/70 group-hover:text-[#006B3C]" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute right-[9px] top-[9px] flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#B58A3B] opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#B58A3B]" />
          </span>
        )}
      </button>

      {open && (
        <>
          <button type="button" aria-label="Close notifications" onClick={() => setOpen(false)} className="fixed inset-0 z-30 cursor-default" />
          <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white shadow-2xl shadow-black/8">
            <div className="flex items-center justify-between border-b border-[#006B3C]/6 px-4 py-2.5">
              <p className="font-heading text-[12px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/65">Notifications</p>
              {unreadCount > 0 && (
                <button type="button" onClick={handleMarkAll} className="font-heading text-[10.5px] font-semibold text-[#B58A3B] hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-96 divide-y divide-[#006B3C]/6 overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-4 py-6 text-center font-body text-[12.5px] italic text-[#12372D]/55">No notifications yet.</li>
              ) : items.map((n) => (
                <li key={n.id} className={`px-4 py-3 ${!n.read_at ? 'bg-[#EDF4E7]/40' : ''}`}>
                  {n.href ? (
                    <Link href={n.href} onClick={() => handleClickItem(n.id)} className="block">
                      <NotificationRow notification={n} />
                    </Link>
                  ) : (
                    <button type="button" onClick={() => handleClickItem(n.id)} className="block w-full text-left">
                      <NotificationRow notification={n} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

function NotificationRow({ notification }: { notification: Notification }) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <p className="font-heading text-[12.5px] font-semibold text-[#006B3C]">{notification.title}</p>
        <p className="mt-0.5 font-body text-[11.5px] text-[#12372D]/70 line-clamp-2">{notification.body}</p>
        <p className="mt-1 font-body text-[10.5px] text-[#006B3C]/45">{relativeTime(notification.created_at)}</p>
      </div>
      {!notification.read_at && <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#B58A3B]" aria-label="Unread" />}
      {notification.read_at && <Check className="h-3 w-3 text-[#006B3C]/30" aria-label="Read" />}
    </div>
  )
}

function relativeTime(iso: string): string {
  const d = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(d / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
