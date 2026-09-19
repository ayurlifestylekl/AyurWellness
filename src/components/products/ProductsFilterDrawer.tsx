'use client'

import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SlidersHorizontal, X } from 'lucide-react'

interface ProductsFilterDrawerProps {
  /** Triggers button label, e.g. "Filter · 7". */
  triggerLabel: string
  children: React.ReactNode
}

export default function ProductsFilterDrawer({ triggerLabel, children }: ProductsFilterDrawerProps) {
  const [open, setOpen] = React.useState(false)

  // lock body scroll when open
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-accent/45 bg-white/70 px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-primary backdrop-blur transition-colors duration-300 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        {triggerLabel}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-cream/60 backdrop-blur-sm"
            />
            <motion.aside
              role="dialog"
              aria-label="Filters"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[88vw] max-w-[360px] overflow-y-auto bg-cream p-6 shadow-elevated"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-heading text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                  Filters
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close filters"
                  className="rounded-full p-1 text-dark/50 transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
              {children}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
