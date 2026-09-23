'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { slideIn, inViewOnce } from '@/lib/motion'

/* ── Palette (section-local; mirrors the hero so the homepage reads as one piece) ── */
const EMERALD      = '#006B3C'   // dark base, matches hero ink
const EMERALD_DEEP = '#12372D'   // slight gradient depth
const SAFFRON      = '#B58A3B'   // vivid turmeric accent — minor/decorative only
const SAFFRON_SOFT = '#B58A3B'   // eyebrow on dark
const LOTUS        = '#B8752A'   // main accent — highlighted words, links, CTAs
const LOTUS_SOFT   = '#E4C384'   // subtle pink accent
const CREAM        = '#EFE2C4'   // warm parchment — more saturated than the pale ivory token, which read as white

const painPoints = ['Burnout', 'Insomnia', 'Joint Pain', 'Brain Fog']

/**
 * Editorial split-screen — Modern Life (dark emerald) vs Ancient Healing (warm cream).
 * Palette synced to the new hero: emerald + saffron, no muted tan.
 */
export default function EmpathyBridge() {
  return (
    <section
      aria-labelledby="empathy-heading"
      className="relative flex flex-col overflow-hidden lg:min-h-[600px] lg:max-h-[760px] lg:flex-row"
    >
      <h2 id="empathy-heading" className="sr-only">
        From modern stress to ancient healing
      </h2>

      {/* ── LEFT: Dark panel — Modern Life (45%) ─────────── */}
      <motion.div
        variants={slideIn('left', 0)}
        initial="initial"
        whileInView="animate"
        viewport={inViewOnce}
        className="relative flex w-full flex-col justify-center px-6 py-14 sm:px-10 sm:py-16 lg:w-[45%] lg:px-16 lg:py-12 xl:px-20"
        style={{ backgroundColor: EMERALD_DEEP }}
      >
        <div className="relative z-10 mx-auto w-full max-w-lg lg:ml-auto lg:mr-8 xl:mr-16">
          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span
              className="h-[1px] w-8"
              style={{ backgroundColor: SAFFRON_SOFT, opacity: 0.7 }}
              aria-hidden
            />
            <span
              className="font-heading text-[11px] font-bold uppercase tracking-[0.36em]"
              style={{ color: SAFFRON_SOFT }}
            >
              Modern Life
            </span>
          </div>

          <h3 className="mt-6 flex flex-col gap-3">
            <span
              className="font-heading font-extrabold leading-[1.02] tracking-tight text-white"
              style={{ fontSize: 'clamp(2rem, 4.2vw, 3.5rem)' }}
            >
              Painkillers hide the pain.
            </span>
            <span
              className="font-display italic leading-[1.1]"
              style={{
                color: LOTUS_SOFT,
                fontSize: 'clamp(1.75rem, 3.6vw, 3rem)',
                letterSpacing: '-0.01em',
                textShadow: '0 2px 18px rgba(184, 117, 42,0.25)',
              }}
            >
              They don&apos;t fix the cause.
            </span>
          </h3>

          {/* Pain points — refreshed as chip row, more youthful than a numbered list */}
          <ul className="mt-9 flex flex-wrap gap-2.5">
            {painPoints.map((p) => (
              <li key={p}>
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85 transition-all duration-200 hover:text-white sm:text-[12px]"
                  style={{
                    borderColor: `${SAFFRON}40`,
                    backgroundColor: 'rgba(181, 138, 59,0.06)',
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: SAFFRON }}
                  />
                  {p}
                </span>
              </li>
            ))}
          </ul>

          {/* Quiet supporting line */}
          <p className="mt-7 max-w-md font-body text-[14px] leading-[1.65] text-white/55 sm:text-[15px]">
            A pill can quiet a symptom for a day. But if what&apos;s actually
            causing it never gets treated, it always comes back.
          </p>
        </div>
      </motion.div>

      {/* ── RIGHT: Cream panel — Ancient Healing (55%) ──── */}
      <motion.div
        variants={slideIn('right', 0.15)}
        initial="initial"
        whileInView="animate"
        viewport={inViewOnce}
        className="relative flex w-full flex-col justify-center px-6 py-14 sm:px-10 sm:py-16 lg:w-[55%] lg:px-20 lg:py-12 xl:px-32"
        style={{ backgroundColor: CREAM }}
      >
        <div className="relative z-10 max-w-xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span
              className="h-[1px] w-8"
              style={{ backgroundColor: LOTUS, opacity: 0.6 }}
              aria-hidden
            />
            <span
              className="font-heading text-[11px] font-bold uppercase tracking-[0.36em]"
              style={{ color: LOTUS }}
            >
              5,000-Year-Old Answer
            </span>
          </div>

          {/* Headline — Playfair italic for a magazine-quote feel */}
          <h3 className="mt-6 flex flex-col">
            <span
              className="font-display italic"
              style={{
                color: EMERALD,
                fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                lineHeight: 1.08,
                letterSpacing: '-0.015em',
              }}
            >
              Ayurveda asks a simpler question:
            </span>
            <span
              className="font-display italic"
              style={{
                color: EMERALD,
                fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                lineHeight: 1.08,
                letterSpacing: '-0.015em',
              }}
            >
              why do you{' '}
              <span
                className="relative inline-block"
                style={{ color: LOTUS }}
              >
                actually
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 right-0 h-[6px] rounded-full"
                  style={{ backgroundColor: `${LOTUS}30` }}
                />
              </span>
              {' '}feel this way?
            </span>
          </h3>

          <p
            className="mt-7 font-body leading-[1.7]"
            style={{
              color: 'rgba(0,107,60,0.78)',
              fontSize: 'clamp(15px, 1.1vw, 17px)',
            }}
          >
            No two bodies are the same, so we don&apos;t guess. Our Vaidyas
            start by getting to know{' '}
            <strong
              className="font-semibold"
              style={{
                color: EMERALD,
                backgroundImage: `linear-gradient(transparent 65%, ${LOTUS}33 65%)`,
              }}
            >
              your body
            </strong>
            {' '}— then build a treatment plan made specifically for you.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Link
              href="/book"
              className="group inline-flex items-center gap-3 rounded-full px-7 py-3.5 font-heading text-[12px] font-bold uppercase tracking-[0.22em] text-white transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                backgroundColor: LOTUS,
                boxShadow: `0 18px 40px -18px ${LOTUS}99`,
              }}
            >
              Get to Know Your Body
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              href="/treatments"
              className="inline-flex min-h-[44px] items-center font-heading text-[11px] font-bold uppercase tracking-[0.22em] underline decoration-1 underline-offset-[6px] transition-colors hover:opacity-80"
              style={{
                color: LOTUS,
                textDecorationColor: `${LOTUS}80`,
              }}
            >
              Browse Therapies →
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
