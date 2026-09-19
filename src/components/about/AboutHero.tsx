'use client'

import React from 'react'
import Image from 'next/image'
import { Leaf } from 'lucide-react'
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

const scaleReveal = {
  initial: { scale: 1.12, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: 1.6, delay: 0, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
}

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
 * About Hero — 50/50 split.
 * Left: burgundy editorial panel (eyebrow, headline, copy, CTA, stats).
 * Right: the centre storefront photograph, bright and unobscured.
 * Stacks on mobile (content first, photo below).
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
    <section className="relative overflow-hidden">
      <div className="grid grid-cols-1 lg:min-h-[calc(100vh-108px)] lg:grid-cols-2">

        {/* ── LEFT — burgundy editorial panel ─────────────── */}
        <div
          className="relative flex flex-col justify-center px-6 py-16 sm:px-10 sm:py-20 lg:px-14 lg:py-24"
          style={{ background: 'radial-gradient(130% 120% at 0% 0%, #006B3C, #12372D)' }}
        >
          <div className="grain-overlay-dark pointer-events-none absolute inset-0" aria-hidden />
          {/* warm gold glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(60% 50% at 10% 18%, rgba(181,138,59,0.10) 0%, transparent 60%)' }}
          />

          <div className="relative z-10 max-w-xl">
            {/* Eyebrow */}
            <motion.div {...fadeIn(0.1)} className="flex items-center gap-2">
              <Leaf className="h-3 w-3 text-accent/60" />
              <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.32em] text-accent/80">
                {copy.eyebrow}
              </span>
            </motion.div>

            {/* Gold rule */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 1.0, delay: 0.2, ease: EASE_OUT_PREMIUM }}
              className="mt-5 h-px w-16 origin-left bg-accent/40"
            />

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 0.28, ease: EASE_OUT_PREMIUM }}
              className="mt-6 font-heading font-extrabold leading-[0.98] text-white"
              style={{ fontSize: 'clamp(2.4rem, 4.4vw, 4.25rem)', letterSpacing: '-0.03em' }}
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
              className="mt-6 max-w-[480px] font-body text-[16px] leading-[1.7] text-white/70 md:text-[17px]"
            >
              {copy.subheading}
            </motion.p>

            {/* CTA */}
            <motion.div {...fadeIn(0.55)} className="mt-8">
              <a
                href="#founder-heading"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(95deg,#FFF9F2,#B58A3B_55%,#B58A3B)] px-7 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-[#12372D] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Our Story
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              {...fadeIn(0.65)}
              className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-accent/15 pt-6"
            >
              {copy.stats.map((s) => (
                <div key={s.label} className="flex flex-col">
                  <p className="font-heading text-[1.6rem] font-extrabold leading-none tracking-tight text-accent">
                    {s.value}
                  </p>
                  <p className="mt-1.5 font-heading text-[9px] font-medium uppercase tracking-[0.2em] text-white/40 sm:text-[10px]">
                    {s.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── RIGHT — storefront photograph ───────────────── */}
        <motion.div {...scaleReveal} className="relative min-h-[300px] sm:min-h-[400px] lg:min-h-0">
          <Image
            src="/centre-exterior.jpg"
            alt="Ayurvedic Wellness Centre centre in Brickfields, Kuala Lumpur"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {/* Soft burgundy feather at the seam so the split reads as one composition */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 hidden w-20 bg-gradient-to-r from-[#12372D]/45 to-transparent lg:block"
          />
        </motion.div>
      </div>
    </section>
  )
}
