'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const RANGES = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
] as const

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'reversed', label: 'Reversed' },
] as const

const CHANNELS = [
  { value: '', label: 'All channels' },
  { value: 'web', label: 'Web' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'tiktok_shop', label: 'TikTok Shop' },
  { value: 'lazada', label: 'Lazada' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Other' },
]

export default function ReferredFilters({
  activeStatus,
  activeChannel,
  activeRange,
}: {
  activeStatus: string
  activeChannel: string
  activeRange: string
}) {
  const router = useRouter()
  const sp = useSearchParams()

  const set = useCallback(
    (k: string, v: string | null) => {
      const next = new URLSearchParams(sp.toString())
      if (!v) next.delete(k)
      else next.set(k, v)
      router.push(`/agent/orders?${next.toString()}`)
    },
    [router, sp],
  )

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#12372D]/10 bg-white p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {RANGES.map((r) => {
          const isActive = activeRange === r.value
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => set('range', r.value)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                isActive
                  ? 'bg-[#149447] text-white'
                  : 'border border-[#12372D]/15 bg-white text-[#12372D] hover:bg-[#EDF4E7]/60'
              }`}
            >
              {r.label}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/55">
          Commission:
        </span>
        {STATUSES.map((s) => {
          const isActive = activeStatus === s.value
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => set('status', s.value === 'all' ? null : s.value)}
              className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                isActive
                  ? 'bg-[#12372D] text-white'
                  : 'border border-[#12372D]/15 bg-white text-[#12372D] hover:bg-[#EDF4E7]/60'
              }`}
            >
              {s.label}
            </button>
          )
        })}
        <select
          value={activeChannel}
          onChange={(e) => set('channel', e.target.value || null)}
          className="ml-auto rounded-lg border border-[#12372D]/15 bg-white px-3 py-1.5 text-[12.5px]"
        >
          {CHANNELS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
