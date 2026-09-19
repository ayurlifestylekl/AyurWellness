'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const SEGMENTS = [
  { value: 'needs_therapist', label: 'Needs therapist' },
  { value: 'awaiting_payment', label: 'Awaiting payment' },
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No-show' },
  { value: 'all', label: 'All' },
] as const

export default function AppointmentsFilters({ requestCount = 0 }: { requestCount?: number }) {
  const router = useRouter()
  const sp = useSearchParams()
  const active = sp.get('segment') ?? 'today'

  const set = useCallback(
    (k: string, v: string | null) => {
      const next = new URLSearchParams(sp.toString())
      if (!v) next.delete(k)
      else next.set(k, v)
      router.push(`/admin/appointments?${next.toString()}`)
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
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                isActive
                  ? 'bg-[#006B3C] text-white'
                  : 'border border-[#006B3C]/15 bg-white text-[#006B3C] hover:bg-[#EDF4E7]/60'
              }`}
            >
              {s.label}
              {s.value === 'needs_therapist' && requestCount > 0 && (
                <span
                  className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-[#B58A3B] text-[#12372D]'
                  }`}
                >
                  {requestCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <input
        type="search"
        placeholder="Search customer, treatment, vaidya…"
        defaultValue={sp.get('q') ?? ''}
        onChange={(e) => set('q', e.target.value || null)}
        className="ml-auto min-w-[220px] flex-1 rounded-lg border border-[#006B3C]/10 bg-white px-3 py-1.5 text-sm placeholder:text-[#12372D]/40 focus:border-[#006B3C] focus:outline-none"
      />
    </div>
  )
}
