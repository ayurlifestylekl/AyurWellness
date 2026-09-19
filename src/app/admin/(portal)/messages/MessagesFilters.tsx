'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const SEGMENTS = [
  { value: 'unread', label: 'Unread' },
  { value: 'open', label: 'Open' },
  { value: 'awaiting_customer', label: 'Awaiting customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
] as const

const TOPICS = [
  { value: '', label: 'All topics' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'order', label: 'Order' },
  { value: 'billing', label: 'Billing' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'other', label: 'Other' },
]

export default function MessagesFilters() {
  const router = useRouter()
  const sp = useSearchParams()
  const active = sp.get('segment') ?? 'unread'

  const set = useCallback(
    (k: string, v: string | null) => {
      const next = new URLSearchParams(sp.toString())
      if (!v) next.delete(k)
      else next.set(k, v)
      router.push(`/admin/messages?${next.toString()}`)
    },
    [router, sp],
  )

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#006B3C]/10 bg-white p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {SEGMENTS.map((s) => {
          const isActive = active === s.value
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => set('segment', s.value)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                isActive
                  ? 'bg-[#006B3C] text-white'
                  : 'border border-[#006B3C]/15 bg-white text-[#006B3C] hover:bg-[#EDF4E7]/60'
              }`}
            >
              {s.label}
            </button>
          )
        })}
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search subject, customer…"
          defaultValue={sp.get('q') ?? ''}
          onChange={(e) => set('q', e.target.value || null)}
          className="min-w-[200px] rounded-lg border border-[#006B3C]/10 bg-white px-3 py-1.5 text-sm placeholder:text-[#12372D]/40 focus:border-[#006B3C] focus:outline-none"
        />
        <select
          value={sp.get('topic') ?? ''}
          onChange={(e) => set('topic', e.target.value || null)}
          className="rounded-lg border border-[#006B3C]/10 bg-white px-3 py-1.5 text-sm"
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
