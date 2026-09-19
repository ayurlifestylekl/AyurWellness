'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export type OrderFilter =
  | 'all'
  | 'awaiting'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

interface OrderFilterTabsProps {
  active: OrderFilter
  counts: Record<OrderFilter, number>
}

const TABS: { id: OrderFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'awaiting', label: 'Awaiting' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
]

export default function OrderFilterTabs({ active, counts }: OrderFilterTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setFilter = useCallback(
    (filter: OrderFilter) => {
      const params = new URLSearchParams(searchParams.toString())
      if (filter === 'all') params.delete('status')
      else params.set('status', filter)
      const q = params.toString()
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return (
    <div
      role="tablist"
      aria-label="Filter orders by status"
      className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active
        const count = counts[tab.id]
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setFilter(tab.id)}
            className={[
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-heading text-[11.5px] font-semibold transition-all duration-200',
              isActive
                ? 'border-[#B58A3B] bg-[#B58A3B] text-[#12372D]'
                : 'border-[#006B3C]/12 bg-white text-[#006B3C]/65 hover:border-[#B58A3B]/40 hover:text-[#006B3C]',
            ].join(' ')}
          >
            <span>{tab.label}</span>
            <span
              className={[
                'rounded-full px-1.5 py-px font-mono text-[9.5px] font-semibold',
                isActive
                  ? 'bg-black/15 text-[#12372D]'
                  : 'bg-[#006B3C]/[0.06] text-[#006B3C]/50',
              ].join(' ')}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
