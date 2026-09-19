import { Sparkles, type LucideIcon } from 'lucide-react'

interface ComingSoonCardProps {
  icon: LucideIcon
  title: string
  subtitle: string
  children: React.ReactNode
  /** Optional footnote at the bottom — italic gray copy. */
  footnote?: string
}

/**
 * Shared wrapper for Tier B sections — features with completed UI but
 * pending backend infrastructure. Renders as a polished, intentional
 * card with a small gold "Activating soon" tag, never a broken-looking
 * placeholder.
 */
export default function ComingSoonCard({
  icon: Icon,
  title,
  subtitle,
  children,
  footnote,
}: ComingSoonCardProps) {
  return (
    <article
      className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-3 border-b border-[#006B3C]/6 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#B58A3B]/12">
            <Icon className="h-4 w-4 text-[#B58A3B]" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="font-heading text-[14px] font-semibold text-[#006B3C]">
              {title}
            </h2>
            <p className="mt-0.5 font-body text-[11px] text-[#12372D]/50">
              {subtitle}
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#B58A3B]/35 bg-[#B58A3B]/[0.08] px-2 py-0.5 font-heading text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#B58A3B]">
          <Sparkles className="h-2.5 w-2.5" />
          Activating soon
        </span>
      </header>

      {/* Body */}
      <div className="relative flex-1 px-5 py-4 sm:px-6">{children}</div>

      {/* Footnote */}
      {footnote && (
        <p className="border-t border-[#006B3C]/6 px-5 py-3 font-body text-[11px] italic text-[#12372D]/50 sm:px-6">
          {footnote}
        </p>
      )}
    </article>
  )
}
