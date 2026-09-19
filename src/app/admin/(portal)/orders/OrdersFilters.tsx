'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const STATUSES = [
  'pending',
  'processing',
  'packing',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
] as const

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const

export default function OrdersFilters() {
  const router = useRouter()
  const sp = useSearchParams()

  const set = useCallback(
    (k: string, v: string | null) => {
      const next = new URLSearchParams(sp.toString())
      if (!v) next.delete(k)
      else next.set(k, v)
      router.push(`/admin/orders?${next.toString()}`)
    },
    [router, sp],
  )

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#006B3C]/10 bg-white p-3">
      <input
        type="search"
        placeholder="Search ID, name, email…"
        defaultValue={sp.get('q') ?? ''}
        onChange={(e) => set('q', e.target.value || null)}
        className="min-w-[200px] flex-1 rounded-lg border border-[#006B3C]/10 bg-white px-3 py-1.5 text-sm placeholder:text-[#12372D]/40 focus:border-[#006B3C] focus:outline-none"
      />
      <select
        value={sp.get('status') ?? ''}
        onChange={(e) => set('status', e.target.value || null)}
        className="rounded-lg border border-[#006B3C]/10 bg-white px-3 py-1.5 text-sm"
      >
        <option value="">All fulfilment statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        value={sp.get('payment') ?? ''}
        onChange={(e) => set('payment', e.target.value || null)}
        className="rounded-lg border border-[#006B3C]/10 bg-white px-3 py-1.5 text-sm"
      >
        <option value="">Any payment</option>
        {PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  )
}
