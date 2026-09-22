'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { philosophyPillars } from '@/data/about'
import { fadeUp, staggerParent, inViewOnce } from '@/lib/motion'

const GOLD = '#B58A3B'
const GOLD_LIGHT = '#E4C384'

/**
 * Philosophy — three pillar cards, not a numbered timeline.
 * The three principles are parallel, not sequential, so a 01/02/03 rail
 * implied an order that wasn't really there — dropped it for equal-weight
 * cards instead. Deep forest backdrop with gold-foil cards gives this the
 * same premium contrast as the products/booking sections, replacing the
 * flat pale-on-pale look.
 */
export default function OurPhilosophy() {
  return (
    <section
      aria-labelledby="philosophy-heading"
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0B1F16 0%, #12372D 55%, #0A1A12 100%)' }}
    >
      {/* Atmospheric gold + emerald glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(50% 55% at 90% 0%, rgba(181,138,59,0.18) 0%, transparent 62%), radial-gradient(45% 45% at 5% 100%, rgba(0,107,60,0.25) 0%, transparent 60%)',
        }}
      />
      {/* Fine gold grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-screen"
        style={{
          backgroundImage: 'radial-gradient(rgba(228,195,132,0.8) 1px, transparent 1px)',
          backgroundSize: '3px 3px',
        }}
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent 4%, ${GOLD}80 50%, transparent 96%)` }} />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-10 sm:px-8 lg:px-12 lg:py-12">
        {/* ── Header — centered, not sticky-left, so the section reads as one balanced block ── */}
        <motion.div
          variants={fadeUp(0)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="mx-auto max-w-xl text-center"
        >
          <div className="flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8" style={{ backgroundColor: GOLD_LIGHT, opacity: 0.7 }} />
            <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.4em]" style={{ color: GOLD_LIGHT }}>
              Our Philosophy
            </span>
            <span aria-hidden className="h-px w-8" style={{ backgroundColor: GOLD_LIGHT, opacity: 0.7 }} />
          </div>

          <h2
            id="philosophy-heading"
            className="mt-3 font-heading font-extrabold leading-[1.1] text-white"
            style={{ fontSize: 'clamp(1.5rem, 2.4vw, 2rem)', letterSpacing: '-0.02em' }}
          >
            Holistic wellness that treats body, mind, and spirit as a{' '}
            <span
              className="font-body italic"
              style={{
                backgroundImage: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD} 55%, ${GOLD_LIGHT})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              whole.
            </span>
          </h2>

          <p className="mt-3 font-body text-[13.5px] italic leading-[1.55]" style={{ color: 'rgba(237,244,231,0.65)' }}>
            Three principles shape every consultation, every therapy, every ounce of oil we pour.
          </p>

          {/* Diamond flourish */}
          <svg aria-hidden viewBox="0 0 96 12" className="mx-auto mt-4 h-2.5 w-20" fill="none" stroke={GOLD_LIGHT} strokeWidth={1} strokeLinecap="round">
            <line x1="0" y1="6" x2="34" y2="6" />
            <path d="M 40 6 L 48 2 L 56 6 L 48 10 Z" />
            <line x1="62" y1="6" x2="96" y2="6" />
          </svg>
        </motion.div>

        {/* ── Three equal pillar cards ─────────────────────── */}
        <motion.div
          variants={staggerParent(0.1, 0.15)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-5"
        >
          {philosophyPillars.map((pillar) => {
            const Icon = pillar.icon
            return (
              <motion.div
                key={pillar.id}
                variants={fadeUp(0)}
                className="group relative flex flex-col overflow-hidden rounded-[4px] px-7 py-9 transition-all duration-500 hover:-translate-y-1.5"
                style={{
                  backgroundColor: 'rgba(255,249,242,0.04)',
                  border: `1px solid ${GOLD}35`,
                  boxShadow: '0 24px 48px -28px rgba(0,0,0,0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${GOLD}80`
                  e.currentTarget.style.backgroundColor = 'rgba(255,249,242,0.07)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${GOLD}35`
                  e.currentTarget.style.backgroundColor = 'rgba(255,249,242,0.04)'
                }}
              >
                {/* Oversized watermark icon — depth cue, not decoration for its own sake */}
                <Icon
                  aria-hidden
                  className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 transition-transform duration-700 group-hover:scale-110"
                  style={{ color: GOLD_LIGHT, opacity: 0.07 }}
                  strokeWidth={1}
                />

                {/* Corner mitres — same plaque language as the Contact page map card */}
                <span aria-hidden className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 border-l-2 border-t-2" style={{ borderColor: `${GOLD}70` }} />
                <span aria-hidden className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 border-r-2 border-t-2" style={{ borderColor: `${GOLD}70` }} />
                <span aria-hidden className="pointer-events-none absolute bottom-2.5 left-2.5 h-3.5 w-3.5 border-b-2 border-l-2" style={{ borderColor: `${GOLD}70` }} />
                <span aria-hidden className="pointer-events-none absolute bottom-2.5 right-2.5 h-3.5 w-3.5 border-b-2 border-r-2" style={{ borderColor: `${GOLD}70` }} />

                {/* Icon medallion — wax-seal treatment: outer ring, inner fill, seal dot */}
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full" style={{ border: `1px solid ${GOLD}55` }}>
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundImage: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`, boxShadow: `0 12px 28px -12px ${GOLD}99` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: '#0B1F16' }} strokeWidth={1.8} />
                  </span>
                  <span aria-hidden className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full" style={{ backgroundColor: GOLD_LIGHT, boxShadow: `0 0 8px ${GOLD_LIGHT}` }} />
                </span>

                {pillar.kicker && (
                  <span
                    className="relative mt-6 font-body text-[12px] italic"
                    style={{ color: GOLD_LIGHT, letterSpacing: '0.1em' }}
                  >
                    {pillar.kicker}
                  </span>
                )}

                <h3
                  className="relative mt-1.5 font-heading font-extrabold leading-[1.15] text-white"
                  style={{ fontSize: 'clamp(1.25rem, 1.6vw, 1.4rem)', letterSpacing: '-0.01em' }}
                >
                  {pillar.title}
                </h3>

                <p
                  className="relative mt-3 font-body text-[14.5px] leading-[1.65]"
                  style={{ color: 'rgba(237,244,231,0.7)' }}
                >
                  {pillar.body}
                </p>

                <span
                  aria-hidden
                  className="relative mt-5 block h-px w-10 transition-all duration-500 group-hover:w-16"
                  style={{ backgroundColor: GOLD }}
                />
              </motion.div>
            )
          })}
        </motion.div>

        {/* Signature */}
        <motion.p
          variants={fadeUp(0.2)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="mt-10 text-center font-body text-[13px] italic"
          style={{ color: 'rgba(237,244,231,0.45)' }}
        >
          — the Ayurvedic Wellness Centre
        </motion.p>
      </div>
    </section>
  )
}
