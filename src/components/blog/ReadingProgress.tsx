'use client'

import React, { useEffect, useState } from 'react'

/**
 * Sticky 2px Turmeric Gold reading-progress bar at the top of the viewport.
 *
 * Uses `transform: scaleX` only (per the house anti-generic guardrails),
 * runs inside requestAnimationFrame to avoid jank during fast scrolls,
 * and respects `prefers-reduced-motion` by hiding the bar entirely when set.
 */
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduceMotion.matches) {
      setEnabled(false)
      return
    }

    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const doc = document.documentElement
        const scrollTop = window.scrollY || doc.scrollTop
        const max = doc.scrollHeight - window.innerHeight
        const next = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0
        setProgress(next)
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  if (!enabled) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] bg-primary/10"
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-accent via-accent to-secondary"
        style={{
          transform: `scaleX(${progress})`,
          transition: 'transform 80ms linear',
        }}
      />
    </div>
  )
}
