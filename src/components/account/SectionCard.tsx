import type { LucideIcon } from 'lucide-react'

interface SectionCardProps {
  icon: LucideIcon
  title: string
  /** Optional small caption under the title. */
  subtitle?: string
  /** Optional chip rendered on the header's right side (e.g. "PDPA"). */
  badge?: React.ReactNode
  children: React.ReactNode
  /** Visual emphasis — use for the health intake section. */
  tone?: 'default' | 'sensitive'
}

export default function SectionCard({
  icon: Icon,
  title,
  subtitle,
  badge,
  children,
  tone = 'default',
}: SectionCardProps) {
  const isSensitive = tone === 'sensitive'

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border bg-white ${
        isSensitive ? 'border-[#B58A3B]/25' : 'border-[#006B3C]/8'
      }`}
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      {isSensitive && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-[#B58A3B]" />
      )}
      <header
        className={`flex items-start justify-between gap-3 border-b px-5 py-4 sm:px-6 ${
          isSensitive ? 'border-[#B58A3B]/15' : 'border-[#006B3C]/6'
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              isSensitive ? 'bg-[#B58A3B]/15' : 'bg-[#006B3C]/[0.06]'
            }`}
          >
            <Icon
              className={`h-4 w-4 ${isSensitive ? 'text-[#B58A3B]' : 'text-[#006B3C]'}`}
              strokeWidth={1.8}
            />
          </span>
          <div>
            <h2
              className="font-heading text-[14px] font-bold text-[#006B3C]"
              style={{ letterSpacing: '-0.005em' }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                className="mt-0.5 font-body text-[11.5px] text-[#12372D]/55"
                style={{ lineHeight: 1.55 }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </header>
      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  )
}
