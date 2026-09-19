'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export type AppointmentFilter = 'all' | 'upcoming' | 'past' | 'cancelled'

interface AppointmentFilterTabsProps {
  active: AppointmentFilter
  counts: Record<AppointmentFilter, number>
}

const TABS: { id: AppointmentFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
]

export default function AppointmentFilterTabs({
  active,
  counts,
}: AppointmentFilterTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setFilter = useCallback(
    (filter: AppointmentFilter) => {
      const params = new URLSearchParams(searchParams.toString())
      if (filter === 'all') params.delete('view')
      else params.set('view', filter)
      const q = params.toString()
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return (
    <div
      role="tablist"
      aria-label="Filter appointments by status"
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
