'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { wellnessFocusAreas } from '@/data/about'
import { fadeUp, inViewOnce, EASE_OUT_PREMIUM } from '@/lib/motion'

/**
 * Wellness Focus — "The Atelier".
 * A compact dark cinematic break. Two balanced columns: left holds the
 * eyebrow, headline, intro and the Ritual Index; right holds a single
 * active cartouche anchored by a large faint numeral. Intentionally
 * avoids the cream vocabulary of the surrounding sections.
 */
export default function WellnessFocus() {
  const items = wellnessFocusAreas
  const [activeId, setActiveId] = useState<string>(items[0]!.id)
  const activeIndex = Math.max(
    0,
    items.findIndex((a) => a.id === activeId),
  )
  const active = items[activeIndex]!
  const ActiveIcon = active.icon
  const activeNum = String(activeIndex + 1).padStart(2, '0')
  const ctaHref = active.highlighted ? '/contact' : '/treatments'
  const ctaLabel = active.highlighted
    ? 'Design My Programme'
    : 'Explore This Ritual'

  return (
    <section
      aria-labelledby="wellness-heading"
      className="relative overflow-hidden bg-[#75B843] text-cream"
    >
      {/* Gold radial + green haze */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(880px 600px at 82% 22%, rgba(181, 138, 59,0.16), transparent 62%)',
            'radial-gradient(1080px 700px at 10% 94%, rgba(0, 107, 60,0.55), transparent 64%)',
          ].join(', '),
        }}
      />

      {/* Dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(181, 138, 59,0.55) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />

      {/* Film grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.831  0 0 0 0 0.639  0 0 0 0 0.451  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
        }}
      />

      {/* Inner vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 180px 40px rgba(10,20,17,0.7)' }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-14 sm:px-8 md:py-16 lg:px-12 lg:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          {/* ── LEFT column — header + ritual index ─────────────── */}
          <motion.div
            variants={fadeUp(0)}
            initial="initial"
            whileInView="animate"
            viewport={inViewOnce}
            className="lg:col-span-5"
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-px w-10 bg-accent/80" />
              <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.4em] text-accent">
                The Wellness Atelier
              </span>
            </div>

            {/* Compact headline */}
            <h2
              id="wellness-heading"
              className="mt-4 font-heading font-extrabold leading-[1.04] text-cream"
              style={{
                fontSize: 'clamp(1.75rem, 2.9vw, 2.35rem)',
                letterSpacing: '-0.024em',
              }}
            >
              Therapies for every{' '}
              <span className="font-body italic font-medium text-accent">
                stage of life.
              </span>
            </h2>

            {/* One-line intro */}
            <p className="mt-3 max-w-md font-body text-[14px] italic leading-[1.55] text-cream/60">
              Eight living rituals — one for each season of the body.
            </p>

            {/* Index heading */}
            <div
              aria-hidden
              className="mt-7 h-px w-14 bg-accent/55"
            />

            <motion.nav
              variants={fadeUp(0.08)}
              initial="initial"
              whileInView="animate"
              viewport={inViewOnce}
              aria-label="Therapy index"
              className="relative mt-6"
            >
              <ul className="flex flex-col">
                {items.map((area, i) => {
                  const n = String(i + 1).padStart(2, '0')
                  const isActive = area.id === activeId
                  return (
                    <li key={area.id} className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveId(area.id)}
                        onFocus={() => setActiveId(area.id)}
                        aria-current={isActive}
                        className="group relative grid w-full grid-cols-[auto_auto_1fr_auto] items-center gap-4 py-2.5 pl-4 pr-2 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/60 md:pl-5"
                      >
                        {isActive && (
                          <motion.span
                            layoutId="wellness-active-bar"
                            className="pointer-events-none absolute inset-y-0 left-0 right-0 z-0 border-l-2 border-accent bg-accent/[0.04]"
                            transition={{
                              duration: 0.45,
                              ease: EASE_OUT_PREMIUM,
                            }}
                            aria-hidden
                          />
                        )}

                        <span
                          aria-hidden
                          className={`relative z-10 h-[7px] w-[7px] rounded-full transition-[background-color,border-color,box-shadow] duration-500 ${
                            isActive
                              ? 'bg-accent shadow-[0_0_10px_rgba(181, 138, 59,0.8)]'
                              : 'border border-accent/55 group-hover:border-accent'
                          }`}
                        />

                        <span
                          className={`relative z-10 font-body text-[11.5px] italic tabular-nums transition-colors duration-500 ${
                            isActive ? 'text-accent' : 'text-cream/40'
                          }`}
                          style={{ letterSpacing: '0.22em' }}
                        >
                          {n}
                        </span>

                        <span
                          className={`relative z-10 font-heading text-[14px] font-bold tracking-[-0.01em] transition-[color,transform] duration-500 md:text-[15px] ${
                            isActive
                              ? 'text-cream'
                              : 'text-cream/55 group-hover:translate-x-0.5 group-hover:text-cream/85'
                          }`}
                        >
                          {area.label}
                          {area.highlighted && (
                            <span
                              aria-hidden
                              className="ml-2 align-middle text-[10px] text-accent/85"
                            >
                              {'\u2605'}
                            </span>
                          )}
                        </span>

                        <span
                          className={`relative z-10 transition-[opacity,transform] duration-500 ${
                            isActive
                              ? 'translate-x-0 opacity-100'
                              : '-translate-x-2 opacity-0'
                          }`}
                        >
                          <ArrowUpRight
                            className="h-3.5 w-3.5 text-accent"
                            strokeWidth={1.5}
                          />
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              <p className="mt-6 border-t border-cream/10 pt-4 font-body text-[12.5px] italic text-cream/45">
                &mdash; Personalised after a consultation with our Vaidyas.
              </p>
            </motion.nav>
          </motion.div>

          {/* ── RIGHT column — active cartouche ─────────────────── */}
          <motion.div
            variants={fadeUp(0.15)}
            initial="initial"
            whileInView="animate"
            viewport={inViewOnce}
            className="relative overflow-hidden lg:col-span-7 lg:pl-10"
          >
            {/* Vertical edge hairline */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-6 left-0 hidden w-px lg:block"
              style={{
                backgroundImage:
                  'linear-gradient(to bottom, transparent, rgba(181, 138, 59,0.4) 18%, rgba(181, 138, 59,0.15) 82%, transparent)',
              }}
            />

            {/* Counter + icon */}
            <div className="flex items-start justify-between">
              <div
                className="font-body text-[11.5px] italic text-accent"
                style={{ letterSpacing: '0.24em' }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={activeIndex}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.28, ease: EASE_OUT_PREMIUM }}
                    className="inline-block tabular-nums"
                  >
                    {activeNum}
                  </motion.span>
                </AnimatePresence>
                <span className="mx-2 text-accent/35">/</span>
                <span className="text-accent/45">VIII</span>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.id + '-icon'}
                  initial={{ opacity: 0, rotate: -8, scale: 0.92 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 8, scale: 0.92 }}
                  transition={{ duration: 0.35, ease: EASE_OUT_PREMIUM }}
                  className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-accent/55"
                >
                  <ActiveIcon
                    className="h-[16px] w-[16px] text-accent"
                    strokeWidth={1.4}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Centered massive numeral — vertical anchor */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={active.id + '-bgnum'}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.55, ease: EASE_OUT_PREMIUM }}
                aria-hidden
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none font-body italic leading-[0.82] text-accent/[0.07]"
                style={{
                  fontSize: 'clamp(8rem, 14vw, 14rem)',
                  fontFeatureSettings: '"lnum"',
                  letterSpacing: '-0.045em',
                }}
              >
                {activeNum}
              </motion.span>
            </AnimatePresence>

            {/* Content cartouche — vertically centered in column */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45, ease: EASE_OUT_PREMIUM }}
                className="relative mt-8 md:mt-10"
              >
                <p
                  className="font-body text-[11.5px] italic text-accent/90"
                  style={{ letterSpacing: '0.22em' }}
                >
                  {active.kicker}
                </p>
                <h3
                  className="mt-2.5 font-heading font-extrabold leading-[1.03] text-cream"
                  style={{
                    fontSize: 'clamp(1.625rem, 3vw, 2.35rem)',
                    letterSpacing: '-0.024em',
                  }}
                >
                  {active.label}
                </h3>
                <p className="mt-4 max-w-[56ch] font-body text-[15px] leading-[1.6] text-cream/75">
                  {active.body}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {active.techniques.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center border border-accent/45 bg-accent/[0.04] px-2.5 py-1 font-heading text-[9.5px] font-bold uppercase text-accent/95"
                      style={{ letterSpacing: '0.22em' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <Link
                  href={ctaHref}
                  className="group mt-7 inline-flex items-center gap-2.5 border border-accent/60 bg-transparent px-5 py-3 transition-[background-color,border-color] duration-500 hover:border-accent hover:bg-accent/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                >
                  <span
                    className="font-heading text-[10.5px] font-bold uppercase text-accent"
                    style={{ letterSpacing: '0.28em' }}
                  >
                    {ctaLabel}
                  </span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 text-accent transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-1"
                    strokeWidth={1.5}
                  />
                </Link>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
