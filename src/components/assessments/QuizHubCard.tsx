import Link from 'next/link'
import { ArrowUpRight, Lock, Check, type LucideIcon } from 'lucide-react'

export interface QuizHubCardProps {
  title: string
  sanskrit: string
  description: string
  questionCount: number
  estimatedMinutes: number
  icon: LucideIcon
  href: string
  /** Visual status. */
  status: 'active' | 'completed' | 'locked'
  /** When status='completed', a short label to surface (e.g. "Vata-dominant"). */
  resultLabel?: string
  /** When status='locked' or 'completed', a small caption under the title. */
  caption?: string
  /** Bigger / hero treatment on the hub. */
  emphasised?: boolean
}

export default function QuizHubCard({
  title,
  sanskrit,
  description,
  questionCount,
  estimatedMinutes,
  icon: Icon,
  href,
  status,
  resultLabel,
  caption,
  emphasised = false,
}: QuizHubCardProps) {
  const interactive = status !== 'locked'

  const innerContent = (
    <>
      {/* Decorative gold rule on hero variant */}
      {emphasised && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px] bg-[#B58A3B]"
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex shrink-0 items-center justify-center rounded-2xl ${
            emphasised
              ? 'h-12 w-12 bg-[#EDF4E7]'
              : 'h-10 w-10 bg-[#12372D]/[0.06]'
          }`}
        >
          {status === 'locked' ? (
            <Lock className="h-4 w-4 text-[#12372D]/45" strokeWidth={1.8} />
          ) : status === 'completed' ? (
            <Check className="h-4 w-4 text-[#149447]" strokeWidth={2.2} />
          ) : (
            <Icon
              className={`${emphasised ? 'h-5 w-5' : 'h-4 w-4'} text-[#149447]`}
              strokeWidth={1.6}
            />
          )}
        </span>

        {status !== 'locked' && (
          <ArrowUpRight
            className="h-4 w-4 text-[#12372D]/35 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#B58A3B]"
            strokeWidth={2}
          />
        )}
      </div>

      <div className="mt-4 flex-1">
        <p
          className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#12372D]/55"
          style={{ letterSpacing: '0.18em' }}
        >
          <span className="italic" style={{ fontFamily: 'var(--font-playfair)' }}>
            {sanskrit}
          </span>
        </p>
        <h3
          className={`mt-1 font-heading font-bold text-[#12372D] ${
            emphasised ? 'text-[22px] sm:text-[26px]' : 'text-[16px]'
          }`}
          style={{ letterSpacing: '-0.015em' }}
        >
          {title}
        </h3>
        <p
          className={`mt-1.5 font-body text-[#12372D]/65 ${
            emphasised ? 'text-[13.5px]' : 'text-[12.5px]'
          }`}
          style={{ lineHeight: 1.55 }}
        >
          {description}
        </p>

        {/* Status caption / result label */}
        {status === 'completed' && resultLabel && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#149447]/[0.08] px-3 py-1 font-heading text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#149447]">
            <Check className="h-3 w-3" strokeWidth={2.4} />
            {resultLabel}
          </p>
        )}
        {status === 'locked' && caption && (
          <p className="mt-3 font-body text-[11px] italic text-[#12372D]/50">
            {caption}
          </p>
        )}
      </div>

      {/* Meta row */}
      <div
        className={`mt-4 flex items-center justify-between border-t pt-3 font-heading text-[10.5px] font-semibold uppercase tracking-[0.16em] ${
          emphasised
            ? 'border-[#B58A3B]/25 text-[#12372D]/55'
            : 'border-[#12372D]/6 text-[#12372D]/45'
        }`}
      >
        <span>
          {questionCount} {questionCount === 1 ? 'question' : 'questions'}
        </span>
        <span>~ {estimatedMinutes} min</span>
      </div>
    </>
  )

  const baseClass =
    'group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white p-5 transition-all sm:p-6'
  const styleByStatus: Record<typeof status, string> = {
    active: emphasised
      ? 'border-[#B58A3B]/30 bg-[#EDF4E7]/55 hover:-translate-y-0.5 hover:border-[#B58A3B]/55'
      : 'border-[#12372D]/8 hover:-translate-y-0.5 hover:border-[#B58A3B]/40',
    completed:
      'border-[#149447]/20 bg-[#149447]/[0.02] hover:-translate-y-0.5 hover:border-[#149447]/40',
    locked:
      'border-[#12372D]/6 bg-[#EDF4E7]/30 opacity-75 cursor-not-allowed',
  }

  const shadow = emphasised
    ? '0 1px 0 0 rgba(18, 55, 45,0.04), 0 18px 36px -20px rgba(18, 55, 45,0.22)'
    : '0 1px 0 0 rgba(18, 55, 45,0.04), 0 12px 30px -16px rgba(18, 55, 45,0.18)'

  if (!interactive) {
    return (
      <div
        className={`${baseClass} ${styleByStatus[status]}`}
        style={{ boxShadow: shadow }}
        aria-disabled
      >
        {innerContent}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={`${baseClass} ${styleByStatus[status]}`}
      style={{ boxShadow: shadow }}
    >
      {innerContent}
    </Link>
  )
}
