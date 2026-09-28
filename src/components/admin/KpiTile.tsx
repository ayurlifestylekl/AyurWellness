import type { LucideIcon } from 'lucide-react'

interface KpiTileProps {
  /** Small-caps label, e.g. "New customers" */
  label: string
  /** Main value — "0", "RM 480", "12" */
  value: string
  /** Sub-line beneath the value */
  sub?: string
  /** Top-right icon */
  icon: LucideIcon
  /** On-brand accent — drives the icon chip + top rule */
  accent?: 'burgundy' | 'gold' | 'rose'
}

const ACCENT: Record<NonNullable<KpiTileProps['accent']>, string> = {
  burgundy: 'bg-[#12372D]/[0.06] text-[#12372D]',
  gold: 'bg-[#B58A3B]/[0.12] text-[#B58A3B]',
  rose: 'bg-[#006B3C]/[0.08] text-[#006B3C]',
}

export default function KpiTile({ label, value, sub, icon: Icon, accent = 'burgundy' }: KpiTileProps) {
  return (
    <article
      className="group relative overflow-hidden rounded-[22px] border border-[#12372D]/[0.06] bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#B58A3B]/30 sm:p-6"
      style={{ boxShadow: '0 1px 2px rgba(18,55,45,0.04), 0 20px 40px -30px rgba(18,55,45,0.35)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#12372D]/50">{label}</span>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ACCENT[accent]}`}>
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-4 font-heading text-[30px] font-bold leading-none tabular-nums text-[#12372D] sm:text-[34px]" style={{ letterSpacing: '-0.03em' }}>
        {value}
      </p>
      {sub && <p className="mt-2 font-body text-[12px] leading-snug text-[#12372D]/50">{sub}</p>}
    </article>
  )
}
