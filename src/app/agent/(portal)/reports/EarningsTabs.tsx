'use client'

import { useRouter } from 'next/navigation'

const TABS = [
  { value: 'all', label: 'All commissions' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'reversed', label: 'Reversed' },
  { value: 'payouts', label: 'Payouts' },
] as const

export default function EarningsTabs({ active }: { active: string }) {
  const router = useRouter()
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#12372D]/10 bg-white p-3">
      {TABS.map((t) => {
        const isActive = active === t.value
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => router.push(`/agent/reports?tab=${t.value}`)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              isActive
                ? 'bg-[#149447] text-white'
                : 'border border-[#12372D]/15 bg-white text-[#12372D] hover:bg-[#EDF4E7]/60'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
