import Link from 'next/link'

interface MobileBookingBarProps {
  treatmentId: string
  treatmentTitle: string
}

/**
 * Fixed bottom bar on mobile/tablet. Hidden at ≥lg breakpoint where
 * BookingSidebar takes over.
 */
export default function MobileBookingBar({ treatmentId, treatmentTitle }: MobileBookingBarProps) {
  return (
    <div
      role="region"
      aria-label={`Book ${treatmentTitle}`}
      data-booking-bar
      className="fixed inset-x-0 bottom-0 z-40 border-t border-accent/30 bg-cream/95 px-4 py-3 backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-heading text-[9px] font-bold uppercase tracking-[0.2em] text-accent">
            Book
          </div>
          <div className="truncate font-heading text-[13px] font-extrabold tracking-[-0.01em] text-primary">
            {treatmentTitle}
          </div>
        </div>
        <Link
          href={`/book/treatment?id=${treatmentId}`}
          className="shrink-0 rounded bg-accent px-4 py-2.5 font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Book →
        </Link>
      </div>
    </div>
  )
}
