'use client'

import React, { useEffect, useState } from 'react'

interface LocalTimeClockProps {
  /** IANA timezone — defaults to Asia/Kuala_Lumpur for the clinic. */
  timeZone?: string
  /** Short zone label shown after the time (e.g. "MYT"). */
  zoneLabel?: string
  className?: string
}

type Parts = { hh: string; mm: string; ss: string; weekday: string; date: string }

function buildParts(date: Date, timeZone: string): Parts {
  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const hh = timeParts.find((p) => p.type === 'hour')?.value ?? '--'
  const mm = timeParts.find((p) => p.type === 'minute')?.value ?? '--'
  const ss = timeParts.find((p) => p.type === 'second')?.value ?? '--'

  const weekday = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'long',
  }).format(date)

  const date_ = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)

  return { hh, mm, ss, weekday, date: date_ }
}

/**
 * Live Asia/Kuala_Lumpur clock rendered as a large editorial display.
 * The colon pulses between HH and MM. SSR-safe: first paint renders
 * dashes, then hydrates with the real time to avoid a mismatch.
 */
export default function LocalTimeClock({
  timeZone = 'Asia/Kuala_Lumpur',
  zoneLabel = 'MYT',
  className = '',
}: LocalTimeClockProps) {
  const [parts, setParts] = useState<Parts | null>(null)

  useEffect(() => {
    const tick = () => setParts(buildParts(new Date(), timeZone))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [timeZone])

  const hh = parts?.hh ?? '--'
  const mm = parts?.mm ?? '--'
  const weekday = parts?.weekday ?? ''
  const date = parts?.date ?? ''

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <span className="font-heading text-[9.5px] font-bold uppercase tracking-[0.3em] text-primary/55">
        Right now in Brickfields
      </span>

      <div
        aria-live="polite"
        className="flex items-baseline gap-1 font-heading font-extrabold leading-none tracking-[-0.02em] text-primary"
        style={{ fontSize: 'clamp(44px, 8vw, 68px)' }}
      >
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{hh}</span>
        <span
          aria-hidden
          className="clock-colon px-[2px]"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          :
        </span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{mm}</span>
        <span className="ml-2 font-body text-[14px] italic text-primary/55">
          {zoneLabel}
        </span>
      </div>

      <div className="flex items-center gap-2 font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-primary/65">
        <span>{weekday || '\u00A0'}</span>
        {weekday && <span aria-hidden className="h-1 w-1 rounded-full bg-accent" />}
        <span>{date || '\u00A0'}</span>
      </div>

      <style jsx>{`
        .clock-colon {
          animation: clock-blink 1.04s ease-in-out infinite;
        }
        @keyframes clock-blink {
          0%, 45% {
            opacity: 1;
          }
          55%, 100% {
            opacity: 0.25;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .clock-colon {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  )
}
