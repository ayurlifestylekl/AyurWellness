'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { findPrevNext } from '@/lib/treatments/pager'
import type { TreatmentSibling } from '@/types/treatments'

interface TherapySwitcherProps {
  categoryTitle: string
  siblings: TreatmentSibling[]
  currentSlug: string
}

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x',
                'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx']

export default function TherapySwitcher({
  categoryTitle,
  siblings,
  currentSlug,
}: TherapySwitcherProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const activeChipRef = useRef<HTMLAnchorElement>(null)

  // Scroll the active chip into view on mount.
  useEffect(() => {
    const chip = activeChipRef.current
    const strip = stripRef.current
    if (!chip || !strip) return
    const chipRect = chip.getBoundingClientRect()
    const stripRect = strip.getBoundingClientRect()
    if (chipRect.left < stripRect.left || chipRect.right > stripRect.right) {
      chip.scrollIntoView({ block: 'nearest', inline: 'center' })
    }
  }, [currentSlug])

  if (siblings.length === 0) return null

  const { prev, next } = findPrevNext(siblings, currentSlug)

  return (
    <nav
      aria-label="Browse therapies in this category"
      className="relative border-b border-accent/25 bg-primary/[0.04]"
    >
      <div className="mx-auto max-w-7xl px-6 py-3.5 sm:px-8 lg:px-12">
        <div className="font-heading text-[9px] font-bold uppercase tracking-[0.28em] text-primary/55">
          Browse this chapter · {categoryTitle}
        </div>

        <div
          ref={stripRef}
          className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1"
        >
          {siblings.map((s, i) => {
            const isActive = s.slug === currentSlug
            return (
              <Link
                key={s._id}
                ref={isActive ? activeChipRef : undefined}
                href={`/treatments/${s.categorySlug}/${s.slug}`}
                aria-current={isActive ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 font-heading text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'border border-accent/30 bg-white text-primary/65 hover:text-primary'
                }`}
              >
                <span className={`font-display italic text-[10px] tracking-[0.06em] ${isActive ? 'text-accent' : 'text-accent/80'}`}>
                  {ROMAN[i] ?? String(i + 1)}.
                </span>
                <span>{s.title}</span>
              </Link>
            )
          })}
        </div>

        {(prev || next) && (
          <div className="mt-3 flex items-center justify-between font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-primary/55">
            {prev ? (
              <Link
                href={`/treatments/${prev.categorySlug}/${prev.slug}`}
                className="flex items-center gap-2 transition-colors hover:text-primary"
              >
                <span>←</span>
                <span>Previous</span>
                <span className="font-body text-[12px] italic tracking-normal normal-case text-primary">
                  {prev.title}
                </span>
              </Link>
            ) : <span />}
            {next ? (
              <Link
                href={`/treatments/${next.categorySlug}/${next.slug}`}
                className="flex items-center gap-2 transition-colors hover:text-primary"
              >
                <span className="font-body text-[12px] italic tracking-normal normal-case text-primary">
                  {next.title}
                </span>
                <span>Next</span>
                <span>→</span>
              </Link>
            ) : <span />}
          </div>
        )}
      </div>
    </nav>
  )
}
