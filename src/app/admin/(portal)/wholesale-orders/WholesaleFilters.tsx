'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const TABS = [
  { value: 'pending_payment', label: 'Awaiting payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'fulfilling', label: 'Packing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
] as const

export default function WholesaleFilters({
  active,
  q,
}: {
  active: string
  q: string
}) {
  const router = useRouter()
  const sp = useSearchParams()

  const set = useCallback(
    (k: string, v: string | null) => {
      const next = new URLSearchParams(sp.toString())
      if (!v) next.delete(k)
      else next.set(k, v)
      router.push(`/admin/wholesale-orders?${next.toString()}`)
    },
    [router, sp],
  )

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#006B3C]/10 bg-white p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {TABS.map((t) => {
          const isActive = active === t.value
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => set('status', t.value)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                isActive
                  ? 'bg-[#006B3C] text-white'
                  : 'border border-[#006B3C]/15 bg-white text-[#006B3C] hover:bg-[#EDF4E7]/60'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      <input
        type="search"
        placeholder="Search order # or partner…"
        defaultValue={q}
        onChange={(e) => set('q', e.target.value || null)}
        className="ml-auto min-w-[220px] rounded-lg border border-[#006B3C]/10 bg-white px-3 py-1.5 text-sm placeholder:text-[#12372D]/40 focus:border-[#006B3C] focus:outline-none"
      />
    </div>
  )
}
