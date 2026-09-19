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

const ACCENT: Record<
  NonNullable<KpiTileProps['accent']>,
  { chip: string; rule: string }
> = {
  burgundy: { chip: 'bg-[#006B3C]/[0.07] text-[#006B3C]', rule: 'from-[#006B3C] to-[#12372D]' },
  gold: { chip: 'bg-[#B58A3B]/15 text-[#B58A3B]', rule: 'from-[#B58A3B] to-[#B58A3B]' },
  rose: { chip: 'bg-[#E4C384]/20 text-[#E4C384]', rule: 'from-[#E4C384] to-[#E4C384]' },
}

/**
 * Premium admin KPI tile. Distinct from the shared account StatTile: tabular
 * numerals, a burgundy-tinted shadow, a thin accent top-rule that brightens on
 * hover, and a subtle lift. Built for the Command Center dashboard.
 */
export default function KpiTile({ label, value, sub, icon: Icon, accent = 'burgundy' }: KpiTileProps) {
  const a = ACCENT[accent]
  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-[#006B3C]/[0.08] bg-white p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        boxShadow: '0 1px 0 0 rgba(0,107,60,0.04), 0 18px 42px -26px rgba(0,107,60,0.30)',
      }}
    >
      {/* Accent top-rule */}
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r ${a.rule} opacity-70 transition-opacity duration-300 group-hover:opacity-100`}
      />

      <div className="flex items-start justify-between gap-3">
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.2em] text-[#006B3C]/55">
          {label}
        </span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${a.chip}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
        </span>
      </div>

      <p
        className="mt-3 font-heading text-[30px] font-bold leading-none tabular-nums text-[#006B3C] sm:text-[34px]"
        style={{ letterSpacing: '-0.03em' }}
      >
        {value}
      </p>

      {sub && (
        <p className="mt-1.5 font-body text-[11.5px] text-[#12372D]/55" style={{ lineHeight: 1.5 }}>
          {sub}
        </p>
      )}
    </article>
  )
}
