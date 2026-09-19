'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { philosophyPillars } from '@/data/about'
import {
  fadeUp,
  staggerParent,
  slideIn,
  inViewOnce,
  EASE_OUT_PREMIUM,
} from '@/lib/motion'

/**
 * Philosophy — editorial manuscript.
 * Sticky two-column composition: left eyebrow + headline + signature,
 * right oversized italic numerals with gold-sealed icon medallions,
 * connected by a vertical gold rail. Cream paper + sage watermark.
 */
export default function OurPhilosophy() {
  return (
    <section
      aria-labelledby="philosophy-heading"
      className="relative overflow-hidden bg-cream"
    >
      {/* Ambient radial wash — sage top-left, gold bottom-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(600px 500px at 8% 10%, rgba(0, 107, 60,0.09), transparent 60%)',
            'radial-gradient(700px 600px at 92% 92%, rgba(181, 138, 59,0.06), transparent 65%)',
          ].join(', '),
        }}
      />

      {/* Paper grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.184  0 0 0 0 0.365  0 0 0 0 0.314  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
        }}
      />

      {/* Botanical watermark — sprig, bottom-right, hidden on mobile */}
      <motion.svg
        aria-hidden
        viewBox="0 0 400 400"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 0.07, y: 0 }}
        viewport={inViewOnce}
        transition={{ duration: 2.2, ease: EASE_OUT_PREMIUM }}
        className="pointer-events-none absolute -bottom-10 -right-10 hidden h-[420px] w-[420px] rotate-[14deg] text-primary lg:block"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 200 388 C 200 310, 222 256, 210 188 C 198 128, 180 86, 202 14" />
        {/* leaf pairs */}
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

      <div className="relative mx-auto max-w-7xl px-6 py-14 sm:px-8 md:py-16 lg:px-12 lg:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* ── LEFT: Sticky header ─────────────────────── */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            <motion.div
              variants={fadeUp(0)}
              initial="initial"
              whileInView="animate"
              viewport={inViewOnce}
            >
              {/* Eyebrow with gold lead-in hairline */}
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-px w-8 bg-accent/70"
                />
                <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.4em] text-accent">
                  Our Philosophy
                </span>
              </div>

              <h2
                id="philosophy-heading"
                className="mt-4 font-heading font-extrabold leading-[1.05] text-primary"
                style={{
                  fontSize: 'clamp(1.875rem, 3.4vw, 2.625rem)',
                  letterSpacing: '-0.025em',
                }}
              >
                Holistic Wellness that Treats Body, Mind, and Spirit as a{' '}
                <span className="font-body italic text-accent">Whole.</span>
              </h2>

              <p className="mt-5 max-w-sm font-body text-[15px] italic leading-[1.55] text-primary/65">
                Three principles shape every consultation, every therapy, every
                ounce of oil we pour.
              </p>

              {/* Gold flourish */}
              <svg
                aria-hidden
                viewBox="0 0 96 12"
                className="mt-6 h-3 text-accent"
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                strokeLinecap="round"
              >
                <line x1="0" y1="6" x2="34" y2="6" />
                <path d="M 40 6 L 48 2 L 56 6 L 48 10 Z" />
                <line x1="62" y1="6" x2="96" y2="6" />
              </svg>

              {/* Signature */}
              <p className="mt-5 font-body text-[13px] italic text-dark/55">
                — the Ayurvedic Wellness Centre
              </p>
            </motion.div>
          </div>

          {/* ── RIGHT: Pillar entries ───────────────────── */}
          <div className="relative lg:col-span-7">
            <motion.ol
              variants={staggerParent(0.14, 0.18)}
              initial="initial"
              whileInView="animate"
              viewport={inViewOnce}
              className="relative flex flex-col gap-10 md:gap-11 md:pl-6 lg:pl-10"
            >
              {/* Vertical gold rail — editorial spine */}
              <motion.span
                aria-hidden
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={inViewOnce}
                transition={{ duration: 1.6, ease: EASE_OUT_PREMIUM }}
                className="pointer-events-none absolute left-0 top-6 hidden w-px origin-top lg:block"
                style={{
                  bottom: '3rem',
                  backgroundImage:
                    'linear-gradient(to bottom, rgba(181, 138, 59,0.9) 0%, rgba(181, 138, 59,0.5) 60%, rgba(181, 138, 59,0.1) 100%)',
                  boxShadow: '0 0 10px rgba(181, 138, 59,0.18)',
                }}
              />

              {philosophyPillars.map((pillar, i) => {
                const Icon = pillar.icon
                const num = String(i + 1).padStart(2, '0')

                return (
                  <motion.li
                    key={pillar.id}
                    variants={fadeUp(0)}
                    className="group relative"
                  >
                    {/* Rail node — gold dot on the spine */}
                    <span
                      aria-hidden
                      className="absolute -left-10 top-4 hidden h-[7px] w-[7px] -translate-x-px rounded-full border border-accent/60 bg-cream transition-[background-color,border-color,box-shadow] duration-500 group-hover:border-accent group-hover:bg-accent group-hover:shadow-gold-glow lg:block"
                    />

                    <div className="grid grid-cols-[auto_1fr] items-start gap-4 md:gap-7">
                      {/* Numeral — pure italic */}
                      <motion.div
                        variants={slideIn('left', 0)}
                        className="relative w-[64px] flex-shrink-0 md:w-[88px]"
                      >
                        <span
                          className="block select-none font-body italic leading-[0.9] text-primary/25"
                          style={{
                            fontSize: 'clamp(60px, 6.6vw, 92px)',
                            fontFeatureSettings: '"lnum"',
                            letterSpacing: '-0.04em',
                          }}
                        >
                          {num}
                        </span>
                      </motion.div>

                      {/* Content */}
                      <div>
                        {/* Kicker + inline icon glyph */}
                        <div className="flex items-center gap-2">
                          <Icon
                            aria-hidden
                            className="h-[14px] w-[14px] flex-shrink-0 text-accent transition-colors duration-500 group-hover:text-primary"
                            strokeWidth={1.75}
                          />
                          {pillar.kicker && (
                            <span
                              className="font-body text-[12px] italic text-secondary"
                              style={{ letterSpacing: '0.14em' }}
                            >
                              {pillar.kicker}
                            </span>
                          )}
                        </div>
                        <h3
                          className="mt-1.5 font-heading font-extrabold leading-[1.15] text-primary"
                          style={{
                            fontSize: 'clamp(1.25rem, 1.9vw, 1.5rem)',
                            letterSpacing: '-0.015em',
                          }}
                        >
                          {pillar.title}
                        </h3>
                        <p className="mt-2.5 max-w-[52ch] font-body text-[15px] leading-[1.65] text-dark/65 transition-colors duration-500 group-hover:text-dark/90 md:text-[16px]">
                          {pillar.body}
                        </p>
                        {/* Gold segment divider */}
                        <span
                          aria-hidden
                          className="mt-4 block h-px w-10 bg-accent/80 transition-all duration-700 group-hover:w-24"
                          style={{
                            transitionTimingFunction:
                              'cubic-bezier(0.22,0.92,0.38,1.0)',
                          }}
                        />
                      </div>
                    </div>
                  </motion.li>
                )
              })}
            </motion.ol>
          </div>
        </div>
      </div>
    </section>
  )
}
