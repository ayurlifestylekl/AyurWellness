'use client'

import React from 'react'
import Image from 'next/image'
import { Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { EASE_OUT_PREMIUM } from '@/lib/motion'
import CTAButton from '@/components/ui/CTAButton'

/* ── Palette (hero-local) — Amber Wash ──────────────────── */
const SAFFRON      = '#B58A3B'   // gold — minor decorative accents only
const SAFFRON_SOFT = '#B58A3B'   // eyebrow on warm base
const SCRIPT_LOTUS = '#F17CA5'   // main accent — italic "Ayurveda"
const INK          = '#12372D'   // espresso-oxblood warm base (was forest green)
// Oxblood ground (#12372D) is applied inline with alpha on the stats bar / overlays

/* ── Animation helpers ──────────────────────────────────── */
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.0, delay, ease: EASE_OUT_PREMIUM },
  },
})

export default function HeroSection() {
  return (
    <section
      className="relative flex h-[calc(100svh-97px)] min-h-[640px] w-full flex-col overflow-hidden"
      style={{ backgroundColor: INK }}
    >
      {/* ── Background photo — dimmed evenly ──────────────── */}
      <motion.div
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: 'easeOut' }}
        className="absolute inset-0 z-0"
      >
        <Image
          src="/hero-shirodhara.jpg"
          alt="Traditional Shirodhara oil vessel, kizhi herbal bundles and Ayurvedic herbs"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />

        {/* Neutral warm-dark tint — espresso/near-black, no green cast */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,15,10,0.45) 0%, rgba(20,15,10,0.10) 26%, rgba(20,15,10,0.14) 55%, rgba(20,15,10,0.34) 84%, rgba(20,15,10,0.62) 100%)',
          }}
        />

        {/* Soft neutral scrim behind the headline only — legibility without tinting the whole photo */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 42% 60% at 28% 48%, rgba(20,15,10,0.32) 0%, transparent 68%)',
          }}
        />

        {/* Warm saffron glow — richer, directional luxe light */}
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{
            background:
              'radial-gradient(ellipse 45% 55% at 8% 14%, rgba(181, 138, 59,0.26) 0%, transparent 64%), radial-gradient(ellipse 50% 60% at 92% 86%, rgba(181, 138, 59,0.22) 0%, transparent 66%), radial-gradient(ellipse 70% 45% at 50% -5%, rgba(181, 138, 59,0.16) 0%, transparent 60%)',
          }}
        />

        {/* Gold-foil mandala texture — heritage cue, behind the headline (low opacity, never reduces legibility) */}
        <div
          aria-hidden
          className="absolute inset-0 mix-blend-overlay"
          style={{
            opacity: 0.16,
            background:
              'repeating-radial-gradient(circle at 50% 42%, rgba(181,138,59,0.22) 0 2px, transparent 2px 26px), repeating-radial-gradient(circle at 50% 42%, rgba(181,138,59,0.15) 0 1px, transparent 1px 52px)',
          }}
        />

        {/* Warm vignette — focuses the headline, lifts text contrast on the busy photo */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 82% 82% at 50% 45%, transparent 56%, rgba(16,11,8,0.50) 100%)',
          }}
        />
      </motion.div>

      {/* Soft, feathered blur behind the text column only — two layered blurs
          (stronger + tighter, softer + wider) so the transition tapers
          gradually instead of cutting off in one visible band */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 z-[5] w-full backdrop-blur-md lg:w-[46%]"
        style={{
          backgroundColor: 'rgba(20,15,10,0.10)',
          maskImage:
            'linear-gradient(90deg, black 0%, black 55%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(90deg, black 0%, black 55%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 z-[5] w-full backdrop-blur-sm lg:w-[68%]"
        style={{
          backgroundColor: 'rgba(20,15,10,0.06)',
          maskImage:
            'linear-gradient(90deg, black 0%, black 35%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(90deg, black 0%, black 35%, transparent 100%)',
        }}
      />

      {/* ── Content — pinned left, over the calmer side of the photo ─────── */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-start justify-center overflow-hidden px-6 py-8 sm:px-8 lg:px-12">
        <div className="max-w-[34rem] text-left">

          {/* Eyebrow */}
          <motion.div {...fadeUp(0.05)} className="flex items-center gap-3">
            <svg viewBox="0 0 48 48" className="h-7 w-7 shrink-0" aria-hidden style={{ filter: 'drop-shadow(0 2px 10px rgba(181,138,59,0.4))' }}>
              <g transform="translate(24 27)" fill="none" stroke={SAFFRON} strokeWidth="1.5" strokeLinejoin="round">
                <path d="M0 -15 C 5 -8, 5 -2, 0 2 C -5 -2, -5 -8, 0 -15 Z" />
                <path d="M0 -11 C 10 -9, 14 -2, 12 5 C 6 3, 1 -3, 0 -11 Z" />
                <path d="M0 -11 C -10 -9, -14 -2, -12 5 C -6 3, -1 -3, 0 -11 Z" />
              </g>
            </svg>
            <span
              className="font-heading text-[11px] font-bold uppercase tracking-[0.3em] sm:text-[12px]"
              style={{ color: SAFFRON_SOFT }}
            >
              Brickfields, KL
            </span>
          </motion.div>

          {/* Headline — left-aligned, same bold weight on both lines */}
          <motion.h1 {...fadeUp(0.2)} className="mt-5 flex flex-col">
            <span
              className="font-heading font-extrabold text-white"
              style={{
                fontSize: 'clamp(2.25rem, 4.4vw, 3.75rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 24px rgba(18,55,45,0.65), 0 1px 2px rgba(18,55,45,0.5)',
              }}
            >
              Restore Balance.
            </span>
            <span
              className="mt-1 font-heading font-extrabold"
              style={{
                color: SCRIPT_LOTUS,
                fontSize: 'clamp(2.25rem, 4.4vw, 3.75rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 24px rgba(18,55,45,0.5)',
              }}
            >
              Renew Naturally.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            {...fadeUp(0.35)}
            className="mt-5 max-w-md font-body leading-[1.6]"
            style={{
              color: 'rgba(237, 244, 231,0.9)',
              fontSize: 'clamp(1rem, 1.2vw, 1.125rem)',
              textShadow: '0 1px 12px rgba(18,55,45,0.5)',
            }}
          >
            Personalised traditional Ayurvedic wellness for a{' '}
            <strong className="font-semibold text-white">healthier, happier you</strong>{' '}
            — guided by our{' '}
            <strong className="font-semibold text-white">experienced practitioners</strong>.
          </motion.p>

          {/* CTA row */}
          <motion.div {...fadeUp(0.5)} className="mt-7 flex flex-wrap items-center gap-5">
            <CTAButton
              href="/book/consultation"
              variant="primary"
              size="lg"
              shimmer
              icon={<Calendar className="h-4 w-4" />}
              className="px-7 py-2 text-[11px]"
            >
              Book a Consultation
            </CTAButton>

            <a
              href="/treatments"
              className="group inline-flex items-center gap-1.5 font-heading text-[12px] font-semibold uppercase tracking-[0.2em] text-white/80 transition-colors hover:text-white"
              style={{ textShadow: '0 1px 10px rgba(18,55,45,0.5)' }}
            >
              Explore Treatments
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          </motion.div>

          {/* Trust row — fills the space below the CTAs with credibility signals */}
          <motion.div
            {...fadeUp(0.65)}
            className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/15 pt-6"
          >
            {['KKM Registered', 'B.A.M.S. Certified Vaidyas', '100% Natural Formulas'].map((t) => (
              <span
                key={t}
                className="flex items-center gap-2 font-heading text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/80"
                style={{ textShadow: '0 1px 10px rgba(20,15,10,0.5)' }}
              >
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" fill="none" stroke={SAFFRON} strokeWidth="2">
                  <path d="M4 10.5 L8 14.5 L16 5.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Small script caption — top-right, over the calmer wall area of the photo */}
      <motion.div
        {...fadeUp(0.4)}
        className="absolute right-6 top-6 z-10 hidden text-right sm:right-10 sm:top-10 lg:block"
      >
        {['Heal', 'Rejuvenate', 'Live Better'].map((w) => (
          <p
            key={w}
            className="font-display italic text-white/90"
            style={{
              fontSize: 'clamp(1rem, 1.6vw, 1.35rem)',
              lineHeight: 1.35,
              textShadow: '0 2px 12px rgba(20,15,10,0.6)',
            }}
          >
            {w}
          </p>
        ))}
        <span
          className="ml-auto mt-2 block h-8 w-px"
          style={{ background: `linear-gradient(180deg, ${SCRIPT_LOTUS}, transparent)` }}
          aria-hidden
        />
      </motion.div>

      {/* ── Stats Bar (Bottom) ────────────────── */}
      <motion.div
        {...fadeUp(0.85)}
        className="relative z-10 shrink-0 overflow-hidden border-t backdrop-blur-md"
        style={{
          background: 'linear-gradient(120deg, rgba(0,107,60,0.95) 0%, rgba(18,55,45,0.95) 55%, rgba(18,55,45,0.95) 100%)',
          borderTopColor: 'rgba(181, 138, 59,0.3)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Subtle warm glow for depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 40% 90% at 15% 50%, rgba(181,138,59,0.10), transparent 70%), radial-gradient(ellipse 40% 90% at 85% 50%, rgba(181,138,59,0.08), transparent 70%)',
          }}
        />

        <div className="relative mx-auto flex max-w-7xl items-center px-6 py-3 sm:px-8 lg:px-12">
          {[
            { n: '15+',    l: 'Years Experience'    },
            { n: '5,000+', l: 'Patients Healed'     },
            { n: '20+',    l: 'Authentic Therapies' },
          ].map((s, i, arr) => (
            <React.Fragment key={s.l}>
              <div className="flex flex-col items-start text-left sm:flex-1 sm:flex-row sm:items-baseline sm:gap-3">
                <span
                  className="font-heading font-extrabold leading-none"
                  style={{
                    color: SAFFRON,
                    fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
                    textShadow: '0 2px 12px rgba(181,138,59,0.25)',
                  }}
                >
                  {s.n}
                </span>
                <span
                  className="mt-0.5 font-heading text-[9px] font-semibold uppercase tracking-[0.2em] text-white/75 sm:mt-0 sm:text-[10px]"
                >
                  {s.l}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div
                  aria-hidden
                  className="hidden h-8 w-px shrink-0 sm:mx-8 sm:block lg:mx-10"
                  style={{ background: 'linear-gradient(180deg, transparent, rgba(181,138,59,0.45), transparent)' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
