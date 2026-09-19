'use client'

import { useRouter } from 'next/navigation'

const TABS = [
  { value: 'all',        label: 'All' },
  { value: 'order',      label: 'Orders' },
  { value: 'stock',      label: 'Stock' },
  { value: 'commission', label: 'Commissions' },
  { value: 'payout',     label: 'Payouts' },
  { value: 'review',     label: 'Reviews' },
] as const

export default function AuditFilterBar({ active }: { active: string }) {
  const router = useRouter()
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#006B3C]/10 bg-white p-3">
      {TABS.map((t) => {
        const isActive = active === t.value
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => router.push(`/admin/audit?entity=${t.value}`)}
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
  )
}
