import Link from 'next/link'

import type { TreatmentSibling } from '@/types/treatments'

interface TherapyPagerProps {
  prev: TreatmentSibling | null
  next: TreatmentSibling | null
}

export default function TherapyPager({ prev, next }: TherapyPagerProps) {
  if (!prev && !next) return null
  return (
    <nav
      aria-label="Adjacent therapies in this chapter"
      className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          href={`/treatments/${prev.categorySlug}/${prev.slug}`}
          className="group rounded-lg border border-accent/30 bg-white p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-[2px] hover:shadow-elevated"
        >
          <div className="font-heading text-[9px] font-bold uppercase tracking-[0.22em] text-accent">
            ← Previous
          </div>
          <div className="mt-1.5 font-heading text-[16px] font-extrabold tracking-[-0.01em] text-primary">
            {prev.title}
          </div>
        </Link>
      ) : <span />}

      {next ? (
        <Link
          href={`/treatments/${next.categorySlug}/${next.slug}`}
          className="group rounded-lg border border-accent/30 bg-white p-5 text-right transition-[transform,box-shadow] duration-300 hover:-translate-y-[2px] hover:shadow-elevated"
        >
          <div className="font-heading text-[9px] font-bold uppercase tracking-[0.22em] text-accent">
            Next →
          </div>
          <div className="mt-1.5 font-heading text-[16px] font-extrabold tracking-[-0.01em] text-primary">
            {next.title}
          </div>
        </Link>
      ) : <span />}
    </nav>
  )
}
