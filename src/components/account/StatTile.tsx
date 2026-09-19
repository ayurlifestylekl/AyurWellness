import type { LucideIcon } from 'lucide-react'

interface StatTileProps {
  /** Small caps label like "Active orders" */
  label: string
  /** Main value — "2", "RM 480", "Mar 15", etc. */
  value: string
  /** Sub-line beneath the value, e.g. "RM 480 total", "Panchakarma · 4 pm" */
  sub?: string
  /** Top-right icon */
  icon: LucideIcon
  /** Subtle accent color for the icon background */
  accent?: 'gold' | 'olive' | 'sage'
}

const ACCENT_BG: Record<NonNullable<StatTileProps['accent']>, string> = {
  gold: 'bg-[#B58A3B]/15',
  olive: 'bg-[#006B3C]/15',
  sage: 'bg-[#006B3C]/10',
}
const ACCENT_TEXT: Record<NonNullable<StatTileProps['accent']>, string> = {
  gold: 'text-[#B58A3B]',
  olive: 'text-[#006B3C]',
  sage: 'text-[#006B3C]',
}

export default function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  accent = 'sage',
}: StatTileProps) {
  return (
    <article
      className="relative overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white p-4 sm:p-5"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
          {label}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${ACCENT_BG[accent]}`}
        >
          <Icon className={`h-3.5 w-3.5 ${ACCENT_TEXT[accent]}`} strokeWidth={1.8} />
        </span>
      </div>

      <p
        className="mt-2.5 font-heading text-[22px] font-bold leading-none text-[#006B3C] sm:text-[26px]"
        style={{ letterSpacing: '-0.02em' }}
      >
        {value}
      </p>

      {sub && (
        <p
          className="mt-1 font-body text-[11.5px] text-[#12372D]/55"
          style={{ lineHeight: 1.5 }}
        >
          {sub}
        </p>
      )}
    </article>
  )
}
