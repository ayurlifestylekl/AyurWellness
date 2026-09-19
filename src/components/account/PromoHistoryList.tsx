import type { WalletItem } from '@/lib/promos/format'
import { formatValue } from '@/lib/promos/format'
import PromoStatusPill from './PromoStatusPill'

interface PromoHistoryListProps {
  used: WalletItem[]
  expired: WalletItem[]
}

const dateFormat = new Intl.DateTimeFormat('en-MY', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export default function PromoHistoryList({ used, expired }: PromoHistoryListProps) {
  const rows = [
    ...used.map((item) => ({ item, status: 'used' as const })),
    ...expired.map((item) => ({ item, status: 'expired' as const })),
  ]

  if (rows.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-[#006B3C]/12 bg-white px-5 py-4 text-center font-body text-[12px] italic text-[#12372D]/55">
        Used and expired vouchers will live here.
      </p>
    )
  }

  return (
    <ul
      className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      {rows.map(({ item, status }, idx) => {
        const date = status === 'used' && item.grant.used_at
          ? item.grant.used_at
          : item.promo.expires_at ?? item.grant.granted_at
        const isLast = idx === rows.length - 1
        return (
          <li
            key={item.grant.id}
            className={`flex items-center gap-3 px-5 py-3 sm:px-6 ${
              isLast ? '' : 'border-b border-[#006B3C]/6'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p
                className="truncate font-heading text-[13px] font-semibold text-[#006B3C]/75"
                style={{ letterSpacing: '-0.005em' }}
              >
                {item.promo.title}
              </p>
              <p className="font-body text-[11.5px] text-[#12372D]/55">
                {formatValue(item.promo)} · {item.promo.code} · {dateFormat.format(new Date(date))}
              </p>
            </div>
            <PromoStatusPill status={status} />
          </li>
        )
      })}
    </ul>
  )
}
