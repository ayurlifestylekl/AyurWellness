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
  default: 'border-accent/20 bg-white',
  alert: 'border-amber-300 bg-amber-50',
  good: 'border-green-200 bg-green-50/60',
}

export default function StatCard({ label, value, hint, href, tone = 'default' }: StatCardProps) {
  const inner = (
    <div className={`rounded-2xl border p-5 transition-shadow ${TONE[tone]} ${href ? 'hover:shadow-elevated' : ''}`}>
      <div className="font-heading text-[10.5px] font-bold uppercase tracking-[0.16em] text-dark/50">{label}</div>
      <div className="mt-1.5 font-heading text-[30px] font-extrabold leading-none text-primary">{value}</div>
      {hint && <div className="mt-1.5 font-body text-[12px] text-dark/55">{hint}</div>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}
