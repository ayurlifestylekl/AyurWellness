'use client'

import React from 'react'
import Image from 'next/image'
import { Leaf, ArrowRight, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { EASE_OUT_PREMIUM } from '@/lib/motion'

/* ── Animation helpers ──────────────────────────────────── */
const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay, ease: EASE_OUT_PREMIUM },
  },
})

const defaultStats = [
  { value: '17+', label: 'Years in Brickfields' },
  { value: '5,000+', label: 'Patients Healed' },
  { value: '20+', label: 'Traditional Therapies' },
]

const defaults = {
  eyebrow: 'About Ayurvedic Wellness Centre',
  headlineLead: 'A Sanctuary for\nAuthentic',
  headlineAccent: 'Healing',
  subheading:
    'We bring the timeless wisdom of traditional Ayurveda to Brickfields — a space where tradition, care, and natural healing come together in harmony.',
}

interface AboutHeroProps {
  eyebrow?: string
  headlineLead?: string
  headlineAccent?: string
  subheading?: string
  stats?: Array<{ value: string; label: string }>
}

/**
 * About Hero — full-bleed photo, matching the homepage hero's treatment
 * (same dark tint + scrim + feathered blur + left-pinned text) so the two
 * signature pages read as one site. The centre photo is real (the actual
 * Brickfields shopfront), positioned at 50%/38% — the exact window that
 * keeps the "AYURVEDIC WELLNESS CENTRE" signage clearly in frame; a tall
 * portrait source cropped wide loses most of its height, so this was tuned
 * against the source image rather than left at a default object-position.
 *
 * Copy can be overridden via CMS props; missing fields fall back to defaults.
 */
export default function AboutHero({
  eyebrow,
  headlineLead,
  headlineAccent,
  subheading,
  stats,
}: AboutHeroProps = {}) {
  const copy = {
    eyebrow: eyebrow || defaults.eyebrow,
    headlineLead: headlineLead || defaults.headlineLead,
    headlineAccent: headlineAccent || defaults.headlineAccent,
    subheading: subheading || defaults.subheading,
    stats: stats && stats.length > 0 ? stats : defaultStats,
  }

  return (
    <section className="relative flex h-[calc(100svh-97px)] min-h-[540px] w-full flex-col overflow-hidden" style={{ backgroundColor: '#12372D' }}>
      {/* ── Background photo — the real centre, dimmed evenly ──────────────── */}
      <motion.div
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: 'easeOut' }}
        className="absolute inset-0 z-0"
      >
        <Image
          src="/about/centre-lounge.jpg"
          alt="Inside Ayurvedic Wellness Centre — our reception lounge in Brickfields"
          fill
          priority
          className="object-cover"
          style={{ objectPosition: '50% 42%', filter: 'saturate(0.8) sepia(0.1)' }}
          sizes="100vw"
        />

        {/* Color wash (mix-blend: color) — the source photo's LED lighting is still
            fairly green/neon even after the enhance pass; this shifts its hue toward
            the brand's amber without flattening the room's own detail or contrast */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, rgba(181,138,59,0.35) 0%, rgba(0,107,60,0.22) 100%)',
            mixBlendMode: 'color',
          }}
        />

        {/* Neutral warm-dark tint */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,15,10,0.5) 0%, rgba(20,15,10,0.14) 26%, rgba(20,15,10,0.18) 55%, rgba(20,15,10,0.4) 84%, rgba(20,15,10,0.68) 100%)',
          }}
        />

        {/* Soft neutral scrim behind the headline only */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 42% 60% at 28% 48%, rgba(20,15,10,0.36) 0%, transparent 68%)',
          }}
        />

        {/* Warm saffron glow */}
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{
            background:
              'radial-gradient(ellipse 45% 55% at 8% 14%, rgba(181, 138, 59,0.26) 0%, transparent 64%), radial-gradient(ellipse 50% 60% at 92% 86%, rgba(181, 138, 59,0.22) 0%, transparent 66%)',
          }}
        />

        {/* Gold-foil texture — same touch as the homepage hero. Quiet on its own,
            but keeps flat dark corners (like the left edge here) from reading as
            completely bare */}
        <div
          aria-hidden
          className="absolute inset-0 mix-blend-overlay"
          style={{
            opacity: 0.16,
            background:
              'repeating-radial-gradient(circle at 50% 42%, rgba(181,138,59,0.22) 0 2px, transparent 2px 26px), repeating-radial-gradient(circle at 50% 42%, rgba(181,138,59,0.15) 0 1px, transparent 1px 52px)',
          }}
        />

        {/* Warm vignette */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 82% 82% at 50% 45%, transparent 56%, rgba(16,11,8,0.5) 100%)',
          }}
        />
      </motion.div>

      {/* Feathered blur behind the text column only — two layered blurs so the
          transition tapers instead of cutting off in one visible band */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 z-[5] w-full backdrop-blur-md lg:w-[50%]"
        style={{
          backgroundColor: 'rgba(20,15,10,0.14)',
          maskImage: 'linear-gradient(90deg, black 0%, black 55%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(90deg, black 0%, black 55%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 z-[5] w-full backdrop-blur-sm lg:w-[70%]"
        style={{
          backgroundColor: 'rgba(20,15,10,0.08)',
          maskImage: 'linear-gradient(90deg, black 0%, black 35%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(90deg, black 0%, black 35%, transparent 100%)',
        }}
      />

      {/* ── Content — pinned left ─────────────────────────── */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-11">
        <div className="max-w-xl">
          {/* Eyebrow */}
          <motion.div {...fadeIn(0.1)} className="flex items-center gap-2">
            <Leaf className="h-3 w-3 text-accent/70" />
            <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.32em] text-accent/85">
              {copy.eyebrow}
            </span>
          </motion.div>

          {/* Gold rule */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1.0, delay: 0.2, ease: EASE_OUT_PREMIUM }}
            className="mt-4 h-px w-16 origin-left bg-accent/50"
          />

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.28, ease: EASE_OUT_PREMIUM }}
            className="mt-5 font-heading font-extrabold leading-[0.98] text-white"
            style={{
              fontSize: 'clamp(2.1rem, 3.8vw, 3.5rem)',
              letterSpacing: '-0.03em',
              textShadow: '0 2px 24px rgba(18,55,45,0.65), 0 1px 2px rgba(18,55,45,0.5)',
            }}
          >
            {copy.headlineLead.split('\n').map((line, idx, arr) => (
              <React.Fragment key={idx}>
                {line}
                {idx < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
            {copy.headlineAccent ? (
              <>
                {' '}
                <span className="font-body italic text-accent">{copy.headlineAccent}</span>
              </>
            ) : null}
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            {...fadeIn(0.45)}
            className="mt-4 max-w-[480px] font-body text-[15px] leading-[1.65] text-white/80 md:text-[16px]"
            style={{ textShadow: '0 1px 12px rgba(18,55,45,0.5)' }}
          >
            {copy.subheading}
          </motion.p>

          {/* CTA row */}
          <motion.div {...fadeIn(0.55)} className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
            <a
              href="#founder-heading"
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(95deg,#FFF9F2,#B58A3B_55%,#B58A3B)] px-6 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-[#12372D] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              Our Story
            </a>
            <a
              href="#founder-heading"
              className="group inline-flex items-center gap-2 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-white/85 transition-colors hover:text-accent"
              style={{ textShadow: '0 1px 10px rgba(18,55,45,0.5)' }}
            >
              Meet Our Founders
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </motion.div>

          {/* Closing line */}
          <motion.div
            {...fadeIn(0.7)}
            className="mt-6 flex items-start gap-3 border-t border-white/15 pt-5"
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent/80" strokeWidth={1.8} />
            <p
              className="font-body text-[12.5px] italic leading-[1.6] text-white/70"
              style={{ textShadow: '0 1px 10px rgba(20,15,10,0.5)' }}
            >
              KKM-registered, staffed by B.A.M.S.-certified Vaidyas — every protocol
              is built around you, not a set menu of treatments.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Closing tagline bar — a single editorial line, not the homepage's
          repeated 3-column stat bar ────────────────────────────────── */}
      <motion.div
        {...fadeIn(0.85)}
        className="relative z-10 shrink-0 overflow-hidden border-t backdrop-blur-md"
        style={{
          background: 'linear-gradient(120deg, rgba(0,107,60,0.95) 0%, rgba(18,55,45,0.95) 55%, rgba(18,55,45,0.95) 100%)',
          borderTopColor: 'rgba(181, 138, 59,0.3)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 90% at 50% 50%, rgba(181,138,59,0.10), transparent 70%)',
          }}
        />
        <div className="relative mx-auto flex max-w-4xl items-center justify-center gap-4 px-6 py-3.5 text-center sm:px-8">
          <span aria-hidden className="hidden h-px w-8 shrink-0 bg-accent/40 sm:block" />
          <p
            className="font-display text-[13px] italic leading-snug text-white/85 sm:text-[14.5px]"
            style={{ textShadow: '0 1px 10px rgba(18,55,45,0.5)' }}
          >
            Every visit begins with getting to know you — not a diagnosis code.
          </p>
          <span aria-hidden className="hidden h-px w-8 shrink-0 bg-accent/40 sm:block" />
        </div>
      </motion.div>
    </section>
  )
}
