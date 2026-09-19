'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'all', label: 'All' },
] as const

const TYPES = [
  { value: '', label: 'Any type' },
  { value: 'affiliate', label: 'Affiliate' },
  { value: 'reseller', label: 'Reseller' },
]

export default function PartnersFilters() {
  const router = useRouter()
  const sp = useSearchParams()
  const status = sp.get('status') ?? 'active'

  const set = useCallback(
    (k: string, v: string | null) => {
      const next = new URLSearchParams(sp.toString())
      if (!v) next.delete(k)
      else next.set(k, v)
      router.push(`/admin/partners?${next.toString()}`)
    },
    [router, sp],
  )

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#006B3C]/10 bg-white p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUSES.map((s) => {
          const isActive = status === s.value
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => set('status', s.value)}
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
          placeholder="Search name, email, referral code…"
          defaultValue={sp.get('q') ?? ''}
          onChange={(e) => set('q', e.target.value || null)}
          className="min-w-[220px] rounded-lg border border-[#006B3C]/10 bg-white px-3 py-1.5 text-sm placeholder:text-[#12372D]/40 focus:border-[#006B3C] focus:outline-none"
        />
        <select
          value={sp.get('type') ?? ''}
          onChange={(e) => set('type', e.target.value || null)}
          className="rounded-lg border border-[#006B3C]/10 bg-white px-3 py-1.5 text-sm"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
