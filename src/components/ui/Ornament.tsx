import React from 'react'

const GOLD = '#B58A3B'

/* ── Lotus mark — the brand's heritage motif ───────────────── */
export function LotusMark({
  className = 'h-6 w-6',
  color = GOLD,
  strokeWidth = 1.3,
}: {
  className?: string
  color?: string
  strokeWidth?: number
}) {
  return (
    <svg
      viewBox="0 0 24 26"
      className={className}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2 C 14.5 7, 14.5 11, 12 14 C 9.5 11, 9.5 7, 12 2 Z" />
      <path d="M12 14 C 18 11.5, 21.5 14, 20.5 19 C 16 17.5, 13 16, 12 14 Z" />
      <path d="M12 14 C 6 11.5, 2.5 14, 3.5 19 C 8 17.5, 11 16, 12 14 Z" />
    </svg>
  )
}

/* ── Horizontal gold flourish — tapered rules + centered lotus ─ */
export function Flourish({
  className = '',
  color = GOLD,
  width = 'w-16 sm:w-24',
}: {
  className?: string
  color?: string
  width?: string
}) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className={`h-px ${width}`} style={{ background: `linear-gradient(to right, transparent, ${color})` }} />
      <LotusMark className="h-5 w-5" color={color} />
      <span className={`h-px ${width}`} style={{ background: `linear-gradient(to left, transparent, ${color})` }} />
    </div>
  )
}

/* ── Full-width ornamental section divider ─────────────────────
   Place BETWEEN sections. `bg` must match the surrounding band so
   it blends seamlessly (e.g. "#EDF4E7" between two cream sections). */
export function OrnamentalDivider({
  bg = '#EDF4E7',
  color = GOLD,
}: {
  bg?: string
  color?: string
}) {
  return (
    <div className="relative w-full" style={{ backgroundColor: bg }} aria-hidden>
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-6 py-7 sm:py-9">
        <span className="h-px w-24 sm:w-40 md:w-56" style={{ background: `linear-gradient(to right, transparent, ${color}99)` }} />
        <LotusMark className="h-6 w-6 shrink-0" color={color} />
        <span className="h-px w-24 sm:w-40 md:w-56" style={{ background: `linear-gradient(to left, transparent, ${color}99)` }} />
      </div>
    </div>
  )
}
