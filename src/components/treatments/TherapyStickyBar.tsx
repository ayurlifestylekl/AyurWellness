'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface TherapyStickyBarProps {
  treatmentId: string
  treatmentTitle: string
  /** Pixel scroll-Y above which the bar is hidden. */
  showAfter?: number
}

/**
 * Compact deep-green bar that slides in after the user scrolls past
 * the hero (default 320px). Hidden at the top of the page so it doesn't
 * compete with the page title. Hidden on mobile to avoid stacking with
 * the MobileBookingBar.
 */
export default function TherapyStickyBar({
  treatmentId,
  treatmentTitle,
  showAfter = 320,
}: TherapyStickyBarProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > showAfter)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [showAfter])

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 top-0 z-30 hidden border-b border-accent/40 bg-primary/96 text-white backdrop-blur-md transition-transform duration-300 lg:block ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-2.5 lg:px-12">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-heading text-[9px] font-bold uppercase tracking-[0.22em] text-white/50">
            Treatment
          </span>
          <span className="truncate font-heading text-[13px] font-extrabold tracking-[-0.01em]">
            {treatmentTitle}
          </span>
        </div>
        <Link
          href={`/book/treatment?id=${treatmentId}`}
          className="shrink-0 rounded bg-accent px-4 py-1.5 font-heading text-[9px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent/90"
        >
          Book →
        </Link>
      </div>
    </div>
  )
}
