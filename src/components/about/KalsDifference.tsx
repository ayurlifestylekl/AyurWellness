'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { kalsDifferences } from '@/data/about'
import {
  fadeUp,
  staggerParent,
  inViewOnce,
  EASE_OUT_PREMIUM,
} from '@/lib/motion'

/**
 * The Ayurvedic Wellness Centre Difference — "The Colonnade".
 * A single-viewport horizontal frieze: compact header band above a
 * 4-column editorial strip. Columns are separated by decorative gold
 * hairline rules (each with a midpoint diamond ornament), not cards.
 * Mobile collapses into a stack of compact rows with horizontal
 * gold hairlines.
 */
const ROMAN = ['I', 'II', 'III', 'IV'] as const

export default function KalsDifference() {
  return (
    <section
      aria-labelledby="difference-heading"
      className="relative overflow-hidden bg-cream"
    >
      {/* Ambient radial wash — sage top-left, gold bottom-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(720px 520px at 10% 18%, rgba(0, 107, 60,0.085), transparent 62%)',
            'radial-gradient(820px 600px at 92% 88%, rgba(181, 138, 59,0.07), transparent 66%)',
          ].join(', '),
        }}
      />

      {/* Paper grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.184  0 0 0 0 0.365  0 0 0 0 0.314  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
        }}
      />

      {/* Botanical watermark — bottom-left, hidden on mobile */}
      <motion.svg
        aria-hidden
        viewBox="0 0 400 400"
        initial={{ opacity: 0, y: -16 }}
        whileInView={{ opacity: 0.055, y: 0 }}
        viewport={inViewOnce}
        transition={{ duration: 2.2, ease: EASE_OUT_PREMIUM }}
        className="pointer-events-none absolute -bottom-16 -left-14 hidden h-[360px] w-[360px] -rotate-[18deg] scale-x-[-1] text-primary lg:block"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 200 388 C 200 310, 222 256, 210 188 C 198 128, 180 86, 202 14" />
        <path d="M 210 310 C 242 302, 272 286, 292 262" />
        <path d="M 210 310 C 244 314, 274 320, 292 262" />
        <path d="M 205 248 C 172 243, 146 231, 120 204" />
        <path d="M 205 248 C 172 252, 148 258, 120 204" />
        <path d="M 208 182 C 242 176, 272 160, 292 134" />
        <path d="M 208 182 C 244 186, 274 192, 292 134" />
        <path d="M 202 116 C 170 110, 144 96, 120 70" />
        <path d="M 202 116 C 172 118, 148 126, 120 70" />
        <circle cx="202" cy="18" r="3.5" />
      </motion.svg>

      <div className="relative mx-auto max-w-7xl px-6 py-14 sm:px-8 md:py-16 lg:px-12">
        {/* ── Header band ─────────────────────── */}
        <motion.div
          variants={fadeUp(0)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          {/* Left — headline */}
          <div className="max-w-2xl lg:max-w-[62%]">
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-accent/70" />
              <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.4em] text-accent">
                What Makes Us Different
              </span>
            </div>
            <h2
              id="difference-heading"
              className="mt-4 font-heading font-extrabold leading-[1.06] text-primary"
              style={{
                fontSize: 'clamp(1.75rem, 2.6vw, 2.15rem)',
                letterSpacing: '-0.025em',
              }}
            >
              Why our patients{' '}
              <span className="font-body italic font-medium text-accent">
                stay with us.
              </span>
            </h2>
            <p className="mt-3 font-body text-[14.5px] italic leading-[1.55] text-primary/65">
              Four plates, one inheritance.
            </p>
          </div>

          {/* Right — ornamental roman sequence + closing phrase */}
          <div className="hidden items-center gap-4 lg:flex">
            <div className="flex items-baseline gap-2.5">
              {ROMAN.map((r, i) => (
                <React.Fragment key={r}>
                  <span
                    className="font-body text-[14px] italic text-accent/80"
                    style={{ letterSpacing: '0.08em' }}
                  >
                    {r}
                  </span>
                  {i < ROMAN.length - 1 && (
                    <span
                      aria-hidden
                      className="h-[3px] w-[3px] rotate-45 bg-accent/60"
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
            <span aria-hidden className="h-px w-10 bg-accent/50" />
            <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.32em] text-primary/55">
              One&nbsp;Inheritance
            </span>
          </div>
        </motion.div>

        {/* ── Top double-hairline ─────────────── */}
        <div className="relative mt-10 md:mt-12">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={inViewOnce}
            transition={{ duration: 1.2, ease: EASE_OUT_PREMIUM }}
            className="origin-left"
          >
            <div
              className="h-px"
              style={{
                backgroundImage:
                  'linear-gradient(to right, transparent, rgba(181, 138, 59,0.55) 14%, rgba(181, 138, 59,0.7) 50%, rgba(181, 138, 59,0.55) 86%, transparent)',
              }}
            />
            <div className="mt-[4px] h-px">
              <div
                className="h-full"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, transparent, rgba(181, 138, 59,0.3) 30%, rgba(181, 138, 59,0.35) 70%, transparent)',
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* ── Frieze: 4 columns on desktop, stacked rows on mobile ── */}
        <motion.div
          variants={staggerParent(0.09, 0.15)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="relative grid grid-cols-1 md:grid-cols-4"
        >
          {kalsDifferences.map((item, i) => {
            const Icon = item.icon
            const roman = ROMAN[i] ?? String(i + 1)
            const isLastColumn = i === kalsDifferences.length - 1

            return (
              <motion.article
                key={item.id}
                variants={fadeUp(0)}
                className="group relative min-h-[260px] px-0 py-8 md:min-h-[360px] md:px-6 md:py-10 lg:px-8 lg:py-12"
              >
                {/* Subtle hover tint backdrop */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-2 inset-x-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:inset-x-1"
                  style={{
                    backgroundImage:
                      'linear-gradient(180deg, rgba(255,249,242,0.55) 0%, rgba(255,249,242,0.15) 100%)',
                  }}
                />

                {/* Vertical colonnade rule (right side, skip last column) — desktop only */}
                {!isLastColumn && (
                  <motion.span
                    aria-hidden
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={inViewOnce}
                    transition={{
                      duration: 0.9,
                      delay: 0.25 + i * 0.08,
                      ease: EASE_OUT_PREMIUM,
                    }}
                    className="pointer-events-none absolute right-0 top-4 bottom-4 hidden w-px origin-top md:block"
                    style={{
                      backgroundImage:
                        'linear-gradient(to bottom, transparent, rgba(181, 138, 59,0.55) 22%, rgba(181, 138, 59,0.55) 78%, transparent)',
                    }}
                  >
                    {/* Midpoint diamond ornament */}
                    <span
                      aria-hidden
                      className="absolute left-1/2 top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-accent/55 transition-[background-color,box-shadow] duration-500 group-hover:bg-accent group-hover:shadow-[0_0_8px_rgba(181, 138, 59,0.7)]"
                    />
                  </motion.span>
                )}

                {/* Mobile horizontal hairline — between rows */}
                {i > 0 && (
                  <div
                    aria-hidden
                    className="absolute left-0 right-0 top-0 h-px md:hidden"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, rgba(181, 138, 59,0.35), rgba(181, 138, 59,0.15) 70%, transparent)',
                    }}
                  />
                )}

                {/* ── Mobile row layout ─────────── */}
                <div className="relative flex items-start gap-4 md:hidden">
                  <div className="flex flex-shrink-0 flex-col items-center gap-2 pt-0.5">
                    <Icon
                      className="h-6 w-6 text-accent transition-transform duration-500 group-hover:scale-[1.06]"
                      strokeWidth={1.5}
                    />
                    <span
                      aria-hidden
                      className="h-[4px] w-[4px] rotate-45 bg-accent/55"
                    />
                  </div>
                  <div className="flex-1">
                    {item.kicker && (
                      <p
                        className="font-body text-[11px] italic text-secondary"
                        style={{ letterSpacing: '0.14em' }}
                      >
                        {item.kicker}
                      </p>
                    )}
                    <h3
                      className="mt-1 font-heading font-extrabold leading-[1.18] text-primary"
                      style={{
                        fontSize: '1.125rem',
                        letterSpacing: '-0.022em',
                      }}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-2 font-body text-[14.5px] leading-[1.65] text-dark/68">
                      {item.body}
                    </p>
                    <span
                      className="mt-3 block font-body text-[11px] italic tracking-[0.18em] text-accent/80"
                    >
                      {roman}
                    </span>
                  </div>
                </div>

                {/* ── Desktop column layout ─────── */}
                <div className="relative hidden h-full flex-col md:flex">
                  {/* Icon + diamond */}
                  <div className="flex items-center gap-3">
                    <Icon
                      className="h-7 w-7 text-accent transition-transform duration-500 group-hover:scale-[1.06]"
                      strokeWidth={1.3}
                    />
                    <span
                      aria-hidden
                      className="h-[4px] w-[4px] rotate-45 bg-accent/55 transition-colors duration-500 group-hover:bg-accent"
                    />
                  </div>

                  {/* Sanskrit kicker */}
                  {item.kicker && (
                    <p
                      className="mt-7 font-body text-[11px] italic text-secondary"
                      style={{ letterSpacing: '0.14em' }}
                    >
                      {item.kicker}
                    </p>
                  )}

                  {/* Title */}
                  <h3
                    className="mt-1.5 font-heading font-extrabold leading-[1.16] text-primary"
                    style={{
                      fontSize: 'clamp(1.125rem, 1.35vw, 1.25rem)',
                      letterSpacing: '-0.022em',
                    }}
                  >
                    {item.title}
                  </h3>

                  {/* Body */}
                  <p className="mt-3 font-body text-[14.5px] leading-[1.72] text-dark/68">
                    {item.body}
                  </p>

                  {/* Spacer pushes roman numeral to bottom */}
                  <div className="flex-1" />

                  {/* Roman numeral signature */}
                  <div className="mt-6 flex items-center gap-2.5">
                    <span aria-hidden className="h-px w-5 bg-accent/55" />
                    <span
                      className="font-body text-[11px] italic text-accent"
                      style={{ letterSpacing: '0.22em' }}
                    >
                      {roman}
                    </span>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </motion.div>

        {/* ── Bottom hairline with embedded fleuron ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={inViewOnce}
          transition={{ duration: 1.2, delay: 0.4, ease: EASE_OUT_PREMIUM }}
          className="relative flex items-center gap-4"
        >
          <span
            className="h-px flex-1"
            style={{
              backgroundImage:
                'linear-gradient(to right, transparent, rgba(181, 138, 59,0.55) 18%, rgba(181, 138, 59,0.7) 62%, rgba(181, 138, 59,0.55) 80%, transparent)',
            }}
          />
          <svg
            aria-hidden
            viewBox="0 0 120 16"
            className="h-4 flex-shrink-0 text-accent"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M 6 8 Q 20 2, 34 8 T 58 8" />
            <path d="M 114 8 Q 100 14, 86 8 T 62 8" />
            <circle cx="60" cy="8" r="2.5" fill="currentColor" stroke="none" />
            <circle cx="60" cy="8" r="5" strokeWidth={0.7} />
          </svg>
          <span
            className="h-px flex-[2]"
            style={{
              backgroundImage:
                'linear-gradient(to left, transparent, rgba(181, 138, 59,0.55) 20%, rgba(181, 138, 59,0.35) 70%, transparent)',
            }}
          />
        </motion.div>
      </div>
    </section>
  )
}
