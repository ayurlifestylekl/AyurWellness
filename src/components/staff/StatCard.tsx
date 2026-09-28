import Link from 'next/link'

interface StatCardProps {
  label: string
  value: number | string
  hint?: string
  href?: string
  /** Visual emphasis when the number needs attention (e.g. pending > 0). */
  tone?: 'default' | 'alert' | 'good'
}

const TONE: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'border-[#12372D]/[0.06] bg-white',
  alert: 'border-[#B58A3B]/40 bg-[#FBF6EC]',
  good: 'border-[#006B3C]/15 bg-[#EDF4E7]/70',
}

export default function StatCard({ label, value, hint, href, tone = 'default' }: StatCardProps) {
  const inner = (
    <div
      className={`h-full rounded-[22px] border p-5 transition-all duration-300 ${TONE[tone]} ${href ? 'hover:-translate-y-0.5 hover:border-[#B58A3B]/40' : ''}`}
      style={{ boxShadow: '0 1px 2px rgba(18,55,45,0.04), 0 20px 40px -30px rgba(18,55,45,0.35)' }}
    >
      <div className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#12372D]/50">{label}</div>
      <div className="mt-3 font-heading text-[32px] font-bold leading-none tabular-nums text-[#12372D]" style={{ letterSpacing: '-0.03em' }}>{value}</div>
      {hint && <div className="mt-2 font-body text-[12px] text-[#12372D]/50">{hint}</div>}
    </div>
  )
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner
}
