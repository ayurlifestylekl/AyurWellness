'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const SEGMENTS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New (≤30d)' },
  { value: 'vip', label: 'VIP (RM 500+)' },
  { value: 'at_risk', label: 'At risk (no order 90d+)' },
  { value: 'blocked', label: 'Blocked' },
] as const

export default function CustomersFilters({ tags }: { tags: string[] }) {
  const router = useRouter()
  const sp = useSearchParams()
  const active = sp.get('segment') ?? ''

  const set = useCallback(
    (k: string, v: string | null) => {
      const next = new URLSearchParams(sp.toString())
      if (!v) next.delete(k)
      else next.set(k, v)
      router.push(`/admin/customers?${next.toString()}`)
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
              onClick={() => set('segment', s.value || null)}
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
          placeholder="Search name, email, phone…"
          defaultValue={sp.get('q') ?? ''}
          onChange={(e) => set('q', e.target.value || null)}
          className="min-w-[200px] rounded-lg border border-[#006B3C]/10 bg-white px-3 py-1.5 text-sm placeholder:text-[#12372D]/40 focus:border-[#006B3C] focus:outline-none"
        />
        <select
          value={sp.get('tag') ?? ''}
          onChange={(e) => set('tag', e.target.value || null)}
          className="rounded-lg border border-[#006B3C]/10 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">Any tag</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
