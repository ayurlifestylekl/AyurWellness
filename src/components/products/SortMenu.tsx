'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type SortOption = 'newest' | 'price-asc' | 'price-desc'

const OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'newest',     label: 'Newest' },
  { value: 'price-asc',  label: 'Price · Low → High' },
  { value: 'price-desc', label: 'Price · High → Low' },
]

interface SortMenuProps {
  value: SortOption
  onChange: (next: SortOption) => void
}

export default function SortMenu({ value, onChange }: SortMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  // close on outside click + Escape
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const activeLabel = OPTIONS.find((o) => o.value === value)?.label ?? 'Newest'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-accent/45 bg-white/60 px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-primary backdrop-blur transition-colors duration-300 hover:border-accent hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <span className="text-primary/55">Sort ·</span>
        <span>{activeLabel}</span>
        <span aria-hidden className="text-[9px] text-accent">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-accent/30 bg-white/95 backdrop-blur-lg shadow-elevated"
          >
            {OPTIONS.map((opt) => {
              const active = opt.value === value
              return (
                <li key={opt.value} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onChange(opt.value)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left font-heading text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 hover:bg-accent/10 focus-visible:outline-none focus-visible:bg-accent/10 ${
                      active ? 'text-accent' : 'text-dark/75'
                    }`}
                  >
                    {opt.label}
                    {active && (
                      <span aria-hidden className="text-[10px] text-accent">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
