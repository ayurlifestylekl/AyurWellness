'use client'

import React from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDown, Calendar, ShieldCheck, Star } from 'lucide-react'

import CTAButton from '@/components/ui/CTAButton'
import { BotanicalMandala } from '@/components/ui/Decorations'
import { EASE_OUT_PREMIUM } from '@/lib/motion'

interface TreatmentsHeroProps {
  therapyCount?: number
  onBrowseTreatments?: () => void
}

/* Gold dot grid — bumped from 0.04 → 0.07 */
const heroDiamondPattern = {
  backgroundImage: `
    radial-gradient(circle, rgba(181, 138, 59,0.07) 1px, transparent 1px),
    radial-gradient(circle, rgba(181, 138, 59,0.07) 1px, transparent 1px)
  `,
  backgroundSize: '28px 28px',
  backgroundPosition: '0 0, 14px 14px',
}

type Credential = {
  key: string
  value: string
  label?: string
  icon?: typeof Star
  valueFirst?: boolean
}

const credentials: Credential[] = [
  { key: 'therapies', value: '62+', label: 'Therapies', valueFirst: true },
  { key: 'years', value: '14', label: 'Years', valueFirst: true },
  { key: 'rating', value: '4.9', label: 'Rating', icon: Star, valueFirst: true },
  { key: 'location', value: 'Brickfields, KL' },
  { key: 'est', value: '2011', label: 'Est.', valueFirst: false },
]

/**
 * V6 — "The Apothecary Atlas"
 * Editorial asymmetric spread. Type column (7) + Specimen plate (5) at lg.
 * Gold frame + warm radials + botanical mandala + signed Vaidya card +
 * credentials masthead footer. Mobile: single column stack.
 */
export default function TreatmentsHero({
  therapyCount,
  onBrowseTreatments,
}: TreatmentsHeroProps) {
  const reduce = useReducedMotion() ?? false

  return (
    <section
      className="relative overflow-hidden bg-primary lg:h-[calc(100vh-113px)] lg:min-h-[620px]"
      aria-labelledby="treatments-heading"
    >
      {/* ── L0  Gold dot grid ───────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={heroDiamondPattern}
        aria-hidden
      />

      {/* ── L1  Warm atmospheric radials (spilled light) ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 900px 700px at 85% 10%, rgba(181, 138, 59,0.22) 0%, transparent 55%), radial-gradient(ellipse 800px 650px at 10% 95%, rgba(18,55,45,0.55) 0%, transparent 55%), radial-gradient(ellipse 600px 500px at 50% 50%, rgba(181, 138, 59,0.04) 0%, transparent 60%)',
        }}
        aria-hidden
      />

      {/* ── L2  Draftsman gold gridlines at 33% / 67% ───── */}
      <div
        className="pointer-events-none absolute inset-y-0 left-[33%] w-px bg-accent/[0.08] hidden lg:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-[67%] w-px bg-accent/[0.08] hidden lg:block"
        aria-hidden
      />

      {/* ── L3  Grain overlay ───────────────────────────── */}
      <div
        className="grain-overlay-dark pointer-events-none absolute inset-0"
        aria-hidden
      />

      {/* ── L4  Gold double border frame + corner brackets ─ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: EASE_OUT_PREMIUM }}
        className="absolute inset-4 sm:inset-6 md:inset-8 lg:inset-10"
        aria-hidden
      >
        {/* Outer */}
        <div className="absolute inset-0 rounded-[2px] border border-accent/55" />
        {/* Inner */}
        <div className="absolute inset-[10px] rounded-[2px] border border-accent/25 sm:inset-3" />

        {/* L-bracket corners — 16px / 2px stroke / accent/80 */}
        <div className="absolute -left-[1px] -top-[1px] h-4 w-4 border-l-2 border-t-2 border-accent/80" />
        <div className="absolute -right-[1px] -top-[1px] h-4 w-4 border-r-2 border-t-2 border-accent/80" />
        <div className="absolute -bottom-[1px] -left-[1px] h-4 w-4 border-b-2 border-l-2 border-accent/80" />
        <div className="absolute -bottom-[1px] -right-[1px] h-4 w-4 border-b-2 border-r-2 border-accent/80" />
      </motion.div>

      {/* ══════════ CONTENT ══════════════════════════════ */}
      <div
        className="relative z-10 mx-auto flex max-w-7xl flex-col px-6 pb-16 pt-20 sm:px-10 md:pb-20 md:pt-24 lg:h-full lg:pb-10 lg:pt-16"
      >
        {/* ── Masthead row — Vol. + specimen ref ────────── */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: EASE_OUT_PREMIUM }}
            className="font-heading text-[10px] font-medium uppercase tracking-[0.42em] text-accent/75"
          >
            Vol. 01 · The Treatment Atlas
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: EASE_OUT_PREMIUM }}
            className="flex items-center gap-2 font-heading text-[10px] font-medium uppercase tracking-[0.35em] text-white/55"
          >
            <span className="inline-block h-1 w-1 rotate-45 bg-accent" />
            Specimen N°01
          </motion.span>
        </div>

        {/* ── Two-column editorial body ─────────────────── */}
        <div className="mt-10 grid flex-1 grid-cols-1 items-center gap-12 lg:mt-6 lg:grid-cols-12 lg:gap-10">
          {/* ═══════════ TYPE COLUMN (7) ═══════════════════ */}
          <div className="lg:col-span-7">
            {/* Rule + "The" */}
            <div className="mb-1 flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.9, delay: 0.55, ease: EASE_OUT_PREMIUM }}
                className="h-px w-10 origin-left bg-accent/80"
              />
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55, ease: EASE_OUT_PREMIUM }}
                className="font-body italic text-accent/90"
                style={{ fontSize: 'clamp(1.3rem, 2.2vw, 1.9rem)' }}
              >
                The
              </motion.span>
            </div>

            {/* Heading */}
            <h1
              id="treatments-heading"
              className="font-heading font-extrabold leading-[0.86] text-white"
              style={{ letterSpacing: '-0.05em' }}
            >
              {/* "Treatment" — clipReveal from left */}
              <motion.span
                initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0 }}
                animate={{ clipPath: 'inset(0 0 0 0)', opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.7, ease: EASE_OUT_PREMIUM }}
                className="block"
                style={{ fontSize: 'clamp(3rem, 7.2vw, 5.4rem)' }}
              >
                Treatment
              </motion.span>

              {/* "Library." — oversized serif italic, breaks the grid */}
              <motion.span
                initial={{ clipPath: 'inset(0 0 0 100%)', opacity: 0, rotate: -0.6 }}
                animate={{ clipPath: 'inset(0 0 0 0)', opacity: 1, rotate: 0 }}
                transition={{ duration: 1.0, delay: 0.9, ease: EASE_OUT_PREMIUM }}
                className="relative -mt-2 block font-body font-normal italic text-accent"
                style={{
                  fontSize: 'clamp(3.8rem, 9.5vw, 6.8rem)',
                  letterSpacing: '-0.03em',
                  lineHeight: '0.82',
                }}
              >
                Library<span className="text-accent/70">.</span>
                {/* Fade underline flourish beneath the "y" */}
                <motion.span
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.9, delay: 1.5, ease: EASE_OUT_PREMIUM }}
                  aria-hidden
                  className="absolute -bottom-1 left-0 block h-px w-[38%] origin-left"
                  style={{
                    background:
                      'linear-gradient(to right, rgba(181, 138, 59,0.8), rgba(181, 138, 59,0.1) 70%, transparent)',
                  }}
                />
              </motion.span>
            </h1>

            {/* Subtitle + signature */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.1, ease: EASE_OUT_PREMIUM }}
              className="mt-6 max-w-[460px] lg:mt-5"
            >
              <p
                className="font-body italic text-white/80"
                style={{ fontSize: '17px', lineHeight: '1.65' }}
              >
                Protocols refined across generations of Ayurvedic tradition.
                Each one calibrated to your body.
              </p>
              <p className="mt-3 font-body text-[13px] italic text-accent/85">
                — our therapists
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3, ease: EASE_OUT_PREMIUM }}
              className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:mt-6"
            >
              <button
                type="button"
                onClick={onBrowseTreatments}
                className="group relative inline-flex min-h-[44px] items-center gap-2 overflow-hidden rounded-full bg-accent px-7 py-3 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-dark shadow-gold-glow transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-16px_rgba(181, 138, 59,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary active:scale-[0.97]"
              >
                <span className="relative z-10">Browse Treatments</span>
                <ArrowDown
                  className="relative z-10 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
                  strokeWidth={2.2}
                />
                <span
                  aria-hidden
                  className="shimmer-sweep-delayed pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                    width: '60%',
                  }}
                />
              </button>
              <CTAButton
                href="/book/consultation"
                variant="outlineLight"
                icon={<Calendar className="h-4 w-4" />}
              >
                Book Consultation
              </CTAButton>
            </motion.div>

            {/* Micro-trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.5, ease: EASE_OUT_PREMIUM }}
              className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-heading text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/55"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-accent/80" strokeWidth={2} />
                20-min Consult
              </span>
              <span className="h-0.5 w-0.5 rounded-full bg-accent/60" />
              <span>No Commitment</span>
              <span className="h-0.5 w-0.5 rounded-full bg-accent/60" />
              <span>Same-gender Therapists</span>
            </motion.div>
          </div>

          {/* ═══════════ SPECIMEN PLATE (5) ════════════════ */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 0.8, ease: EASE_OUT_PREMIUM }}
              className="relative mx-auto w-full max-w-[440px] lg:mx-0 lg:ml-auto lg:max-w-[360px] xl:max-w-[400px]"
            >
              {/* Mandala — behind the photo, offset left+up */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.4, delay: 1.0 }}
                className="pointer-events-none absolute -left-10 -top-10 h-[200px] w-[200px] sm:-left-16 sm:-top-16 sm:h-[260px] sm:w-[260px]"
                aria-hidden
              >
                <motion.div
                  animate={reduce ? undefined : { rotate: 360 }}
                  transition={
                    reduce
                      ? undefined
                      : { duration: 120, repeat: Infinity, ease: 'linear' }
                  }
                  className="h-full w-full"
                >
                  <BotanicalMandala opacity={0.28} stroke="#B58A3B" />
                </motion.div>
              </motion.div>

              {/* Photo plate (portrait, 4:5) */}
              <motion.div
                initial={{ clipPath: 'inset(100% 0 0 0)', opacity: 0 }}
                animate={{ clipPath: 'inset(0 0 0 0)', opacity: 1 }}
                transition={{ duration: 1.1, delay: 0.85, ease: EASE_OUT_PREMIUM }}
                className="relative aspect-[4/5] w-full overflow-hidden rounded-[2px]"
                style={{
                  boxShadow:
                    '0 40px 80px -30px rgba(0,0,0,0.55), 0 18px 40px -20px rgba(181, 138, 59,0.25)',
                }}
              >
                <Image
                  src="/ayurvedic-lifestyle_1022134-20273.jpg.avif"
                  alt="Ayurvedic flat-lay with herbs, brass vessels and warm amber oils arranged on a dark surface"
                  fill
                  priority
                  sizes="(max-width: 1024px) 85vw, 440px"
                  className="object-cover"
                />
                {/* Green tint to harmonise */}
                <div
                  className="pointer-events-none absolute inset-0 mix-blend-multiply"
                  style={{ backgroundColor: 'rgba(0,107,60,0.22)' }}
                  aria-hidden
                />
                {/* Bottom gradient for legibility */}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/10 to-transparent"
                  aria-hidden
                />

                {/* Gold foil frame (inner) */}
                <div
                  className="pointer-events-none absolute inset-2 border border-accent/60"
                  aria-hidden
                />
                {/* Inner corner mitres */}
                <div className="pointer-events-none absolute left-1 top-1 h-3 w-3 border-l-2 border-t-2 border-accent" />
                <div className="pointer-events-none absolute right-1 top-1 h-3 w-3 border-r-2 border-t-2 border-accent" />
                <div className="pointer-events-none absolute bottom-1 left-1 h-3 w-3 border-b-2 border-l-2 border-accent" />
                <div className="pointer-events-none absolute bottom-1 right-1 h-3 w-3 border-b-2 border-r-2 border-accent" />

                {/* Plate N°01 badge — top-left */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.4, ease: EASE_OUT_PREMIUM }}
                  className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-accent/95 px-3 py-1 font-body text-[11px] italic text-primary shadow-[0_10px_24px_-10px_rgba(181, 138, 59,0.8)]"
                >
                  <span className="inline-block h-1 w-1 rotate-45 bg-primary/70" />
                  Plate N°01
                </motion.div>
              </motion.div>

              {/* Signature card — overlapping bottom-right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.5, ease: EASE_OUT_PREMIUM }}
                className="absolute -bottom-6 right-2 flex w-[220px] items-center gap-3 rounded-sm bg-cream px-4 py-3 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.45)] sm:-bottom-7 sm:-right-4"
                style={{
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* Gold hairline top */}
                <span
                  aria-hidden
                  className="absolute left-0 right-0 top-0 h-px"
                  style={{
                    background:
                      'linear-gradient(to right, transparent, rgba(181, 138, 59,0.85) 20%, rgba(181, 138, 59,0.85) 80%, transparent)',
                  }}
                />
                {/* Gold seal dot */}
                <span
                  aria-hidden
                  className="relative h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_0_3px_rgba(181, 138, 59,0.2)]"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[11px] italic text-dark/55">Attended by</p>
                  <p className="font-heading text-[14px] font-bold leading-tight text-primary">
                    our therapists
                  </p>
                  <p className="mt-0.5 font-heading text-[9px] font-semibold uppercase tracking-[0.2em] text-accent">
                    Certified · 14 Yrs
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* ── Credentials masthead — inside frame, at bottom ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.7, ease: EASE_OUT_PREMIUM }}
          className="mt-16 lg:mt-6"
        >
          <div
            aria-hidden
            className="mb-5 h-px w-full lg:mb-4"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(181, 138, 59,0.45) 15%, rgba(181, 138, 59,0.45) 85%, transparent)',
            }}
          />
          <ul
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85 sm:justify-center sm:gap-x-7 lg:gap-x-9"
            role="list"
          >
            {credentials.map((c, i) => {
              const hiddenOnMobile = c.key === 'years' || c.key === 'rating'
              const displayValue = c.key === 'therapies' ? `${therapyCount}+` : c.value
              const Icon = c.icon
              return (
                <React.Fragment key={c.key}>
                  <li
                    className={`flex items-center gap-2 ${hiddenOnMobile ? 'hidden lg:flex' : 'flex'}`}
                  >
                    {Icon ? (
                      <Icon
                        className="h-3 w-3 fill-accent text-accent"
                        strokeWidth={0}
                      />
                    ) : null}
                    {c.valueFirst === false && c.label && (
                      <span className="text-white/55">{c.label}</span>
                    )}
                    <span className="text-accent/90">{displayValue}</span>
                    {c.valueFirst !== false && c.label && (
                      <span className="text-white/55">{c.label}</span>
                    )}
                  </li>
                  {i < credentials.length - 1 && (
                    <li
                      aria-hidden
                      className={`hidden h-3 w-px bg-accent/35 sm:inline-block ${
                        hiddenOnMobile ? 'lg:inline-block' : ''
                      }`}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
