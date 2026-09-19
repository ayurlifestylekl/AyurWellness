import Link from 'next/link'

interface MarginaliaEntry {
  label: string
  value: string
  isDevanagari?: boolean
  href?: string
}

interface TherapyMarginaliaProps {
  origin: string | null
  sanskritName: string | null
  practitioner: string
  categoryTitle: string
  categorySlug: string
  /** When true, renders the inline mobile variant (no sticky positioning). */
  variant?: 'desktop' | 'mobile'
}

export default function TherapyMarginalia({
  origin,
  sanskritName,
  practitioner,
  categoryTitle,
  categorySlug,
  variant = 'desktop',
}: TherapyMarginaliaProps) {
  const entries: MarginaliaEntry[] = []
  if (origin) entries.push({ label: 'Origin', value: origin })
  if (sanskritName) entries.push({ label: 'Sanskrit', value: sanskritName, isDevanagari: true })
  entries.push({ label: 'Practitioner', value: practitioner })
  entries.push({
    label: 'Category',
    value: categoryTitle,
    href: `/treatments/${categorySlug}`,
  })

  const containerClass =
    variant === 'mobile'
      ? 'grid grid-cols-1 gap-5 rounded-lg border border-accent/25 bg-white/60 p-5 sm:grid-cols-2'
      : 'space-y-7'

  return (
    <aside aria-label="About this therapy" className={containerClass}>
      {entries.map((entry) => (
        <div key={entry.label}>
          <div className="mb-2 h-px w-6 bg-accent" aria-hidden />
          <div className="font-heading text-[9px] font-bold uppercase tracking-[0.22em] text-accent">
            {entry.label}
          </div>
          <div
            className={`mt-1.5 font-body text-[13px] italic leading-[1.45] text-dark/70 ${
              entry.isDevanagari ? 'font-devanagari' : ''
            }`}
          >
            {entry.href ? (
              <Link href={entry.href} className="not-italic underline decoration-accent/40 underline-offset-2 hover:text-primary">
                {entry.value}
              </Link>
            ) : (
              entry.value
            )}
          </div>
        </div>
      ))}
    </aside>
  )
}
