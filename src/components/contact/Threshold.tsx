'use client'

import React from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { MapPin, MessageCircle } from 'lucide-react'

import CTAButton from '@/components/ui/CTAButton'
import { BotanicalMandala } from '@/components/ui/Decorations'
import { EASE_OUT_PREMIUM } from '@/lib/motion'
import { CLINIC_ADDRESS } from '@/lib/clinic'

const heroDiamondPattern = {
  backgroundImage: `
    radial-gradient(circle, rgba(181, 138, 59,0.07) 1px, transparent 1px),
    radial-gradient(circle, rgba(181, 138, 59,0.07) 1px, transparent 1px)
  `,
  backgroundSize: '28px 28px',
  backgroundPosition: '0 0, 14px 14px',
}

/**
 * Zone 1 — "The Threshold"
 * Dark cinematic hero for Vol. II · The Correspondence. Deliberately inverted
 * 5/7 from Treatments (plate LEFT, type RIGHT) so the two hero atmospheres
 * don't mirror. Photo plate with gold foil frame + L-bracket mitres, botanical
 * mandala rotating behind, overlapping address card bottom-right. Right
 * column: small-caps eyebrow → oversized serif italic "threshold." → subtitle
 * → gold hairline → trust row → dual CTA.
 */
export default function Threshold() {
  const reduce = useReducedMotion() ?? false

  return (
    <section
      className="relative flex min-h-[calc(100svh-6.5rem)] overflow-hidden bg-primary lg:h-[calc(100svh-6.5rem)] lg:max-h-[calc(100svh-6.5rem)] lg:min-h-[560px]"
      aria-labelledby="threshold-heading"
    >
      {/* L-1  Blurred atmospheric background photo — soft-focus brass/herb
              still life, kept fully out of focus so it never competes with
              the foreground plate photo or the headline text. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <Image
          src="/contact-threshold-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-110 object-cover blur-2xl"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(11,31,22,0.35)' }}
        />
      </div>

      {/* L0  Gold dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={heroDiamondPattern}
        aria-hidden
      />

      {/* L2  Draftsman gold gridlines — shifted (25% / 75%) so the Threshold
              doesn't mirror Treatments' 33% / 67% split */}
      <div
        className="pointer-events-none absolute inset-y-0 left-[25%] hidden w-px bg-accent/[0.08] lg:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-[75%] hidden w-px bg-accent/[0.08] lg:block"
        aria-hidden
      />

      {/* L3  Grain overlay */}
      <div className="grain-overlay-dark pointer-events-none absolute inset-0" aria-hidden />

      {/* L4  Gold double border frame + corner brackets */}
      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: EASE_OUT_PREMIUM }}
        className="pointer-events-none absolute inset-4 sm:inset-6 md:inset-8 lg:inset-10"
        aria-hidden
      >
        <div className="absolute inset-0 rounded-[2px] border border-accent/55" />
        <div className="absolute inset-[10px] rounded-[2px] border border-accent/25 sm:inset-3" />
        <div className="absolute -left-[1px] -top-[1px] h-4 w-4 border-l-2 border-t-2 border-accent/80" />
        <div className="absolute -right-[1px] -top-[1px] h-4 w-4 border-r-2 border-t-2 border-accent/80" />
        <div className="absolute -bottom-[1px] -left-[1px] h-4 w-4 border-b-2 border-l-2 border-accent/80" />
        <div className="absolute -bottom-[1px] -right-[1px] h-4 w-4 border-b-2 border-r-2 border-accent/80" />
      </motion.div>

      {/* ══════════ CONTENT ══════════════════════════════ */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-center px-8 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-10 md:pb-10 md:pt-10 lg:pb-8 lg:pt-8">
        {/* Masthead — Vol. II  |  Plate N°01 */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE_OUT_PREMIUM }}
            className="font-heading text-[10px] font-medium uppercase tracking-[0.42em] text-accent/75"
          >
            Vol. II · The Correspondence
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: EASE_OUT_PREMIUM }}
            className="flex items-center gap-2 font-heading text-[10px] font-medium uppercase tracking-[0.35em] text-white/55"
          >
            <span aria-hidden className="inline-block h-1 w-1 rotate-45 bg-accent" />
            Plate N°01 · Threshold
          </motion.span>
        </div>

        {/* Body — flipped grid: PLATE lg:col-start-1, TYPE lg:col-start-6 */}
        <div className="mt-4 grid grid-cols-1 items-center gap-6 sm:mt-5 lg:mt-3 lg:grid-cols-12 lg:gap-10">
          {/* ═══════════ PLATE (5) — left on desktop ═══════════ */}
          <div className="lg:order-1 lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 0.7, ease: EASE_OUT_PREMIUM }}
              className="relative mx-auto w-full max-w-[260px] lg:mx-0 lg:max-w-[280px]"
            >
              {/* Mandala — offset right+up (Treatments has it left+up; flipped) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.4, delay: 1.0 }}
                className="pointer-events-none absolute -right-10 -top-10 h-[200px] w-[200px] sm:-right-16 sm:-top-16 sm:h-[260px] sm:w-[260px]"
                aria-hidden
              >
                <motion.div
                  animate={reduce ? undefined : { rotate: -360 }}
                  transition={
                    reduce
                      ? undefined
                      : { duration: 140, repeat: Infinity, ease: 'linear' }
                  }
                  className="h-full w-full"
                >
                  <BotanicalMandala opacity={0.28} stroke="#B58A3B" />
                </motion.div>
              </motion.div>

              {/* Photo plate — 4:5 portrait crop */}
              <motion.div
                initial={{ clipPath: 'inset(0 0 100% 0)', opacity: 0 }}
                animate={{ clipPath: 'inset(0 0 0 0)', opacity: 1 }}
                transition={{ duration: 1.1, delay: 0.75, ease: EASE_OUT_PREMIUM }}
                className="relative aspect-[4/5] w-full overflow-hidden rounded-[2px]"
                style={{
                  boxShadow:
                    '0 40px 80px -30px rgba(0,0,0,0.55), 0 18px 40px -20px rgba(181, 138, 59,0.25)',
                }}
              >
                <Image
                  src="/about/gallery-exterior.jpg"
                  alt="Ayurvedic Wellness Centre — our storefront in Brickfields, Kuala Lumpur"
                  fill
                  priority
                  sizes="(max-width: 1024px) 85vw, 420px"
                  className="object-cover"
                  style={{ objectPosition: '50% 30%' }}
                />

                {/* Bottom gradient — darker than Treatments for cinematic weight */}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/20 to-transparent"
                  aria-hidden
                />

                {/* Gold foil inner frame */}
                <div
                  className="pointer-events-none absolute inset-2 border border-accent/60"
                  aria-hidden
                />
                {/* Inner corner mitres */}
                <div className="pointer-events-none absolute left-1 top-1 h-3 w-3 border-l-2 border-t-2 border-accent" />
                <div className="pointer-events-none absolute right-1 top-1 h-3 w-3 border-r-2 border-t-2 border-accent" />
                <div className="pointer-events-none absolute bottom-1 left-1 h-3 w-3 border-b-2 border-l-2 border-accent" />
                <div className="pointer-events-none absolute bottom-1 right-1 h-3 w-3 border-b-2 border-r-2 border-accent" />

                {/* Plate N°01 · Threshold badge */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.4, ease: EASE_OUT_PREMIUM }}
                  className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-accent/95 px-3 py-1 font-body text-[11px] italic text-primary shadow-[0_10px_24px_-10px_rgba(181, 138, 59,0.8)]"
                >
                  <span aria-hidden className="inline-block h-1 w-1 rotate-45 bg-primary/70" />
                  Plate N°01 · Threshold
                </motion.div>
              </motion.div>

              {/* Address card — overlaps plate's bottom-right corner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.5, ease: EASE_OUT_PREMIUM }}
                className="relative mt-5 flex w-full items-start gap-3 rounded-sm bg-cream px-4 py-3 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.45)] lg:absolute lg:-bottom-7 lg:-right-4 lg:mt-0 lg:w-[260px]"
                style={{ backdropFilter: 'blur(8px)' }}
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
                  className="relative mt-1 h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_0_3px_rgba(181, 138, 59,0.2)]"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-[9px] font-bold uppercase tracking-[0.24em] text-primary/55">
                    The Centre
                  </p>
                  <p className="mt-1 font-body text-[13px] italic leading-[1.45] text-dark/85">
                    {CLINIC_ADDRESS}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* ═══════════ TYPE (7) — right on desktop ═══════════ */}
          <div className="lg:order-2 lg:col-span-7">
            {/* Sanskrit invocation — anchors the empty top-right zone of the
                 type column. Devanagari script in gold, transliteration below,
                 small-caps English translation. Right-aligned so it acts as
                 marginalia rather than competing with the headline. */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: EASE_OUT_PREMIUM }}
              className="mb-5 ml-auto max-w-[280px] text-right"
            >
              <span
                aria-hidden
                className="ml-auto block h-px w-16"
                style={{
                  background:
                    'linear-gradient(to right, transparent, rgba(181, 138, 59,0.9))',
                }}
              />
              <p
                lang="sa"
                className="mt-3 font-devanagari text-accent"
                style={{
                  fontSize: 'clamp(20px, 1.7vw, 26px)',
                  lineHeight: '1.05',
                }}
              >
                अतिथि देवो भव
              </p>
              <p
                className="mt-2 font-body italic text-accent/85"
                style={{ fontSize: '13px' }}
              >
                Atithi Devo Bhava
              </p>
              <p
                className="mt-1 font-heading uppercase text-white/45"
                style={{ fontSize: '9px', letterSpacing: '0.3em' }}
              >
                The guest is divine
              </p>
            </motion.div>

            {/* Eyebrow rule + small italic "The" (mirror of Treatments, trimmed) */}
            <div className="mb-2 flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.9, delay: 0.5, ease: EASE_OUT_PREMIUM }}
                className="h-px w-10 origin-left bg-accent/80"
              />
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: EASE_OUT_PREMIUM }}
                className="font-body italic text-accent/90"
                style={{ fontSize: 'clamp(1.2rem, 2vw, 1.7rem)' }}
              >
                Begin with a
              </motion.span>
            </div>

            {/* Headline — "Cross the" + italic "threshold." */}
            <h1
              id="threshold-heading"
              className="font-heading font-extrabold leading-[0.86] text-white"
              style={{ letterSpacing: '-0.05em' }}
            >
              <motion.span
                initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0 }}
                animate={{ clipPath: 'inset(0 0 0 0)', opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.65, ease: EASE_OUT_PREMIUM }}
                className="block"
                style={{ fontSize: 'clamp(1.9rem, 4.6vw, 3.4rem)' }}
              >
                Cross the
              </motion.span>
              <motion.span
                initial={{ clipPath: 'inset(0 0 0 100%)', opacity: 0, rotate: 0.4 }}
                animate={{ clipPath: 'inset(0 0 0 0)', opacity: 1, rotate: -0.4 }}
                transition={{ duration: 1.0, delay: 0.85, ease: EASE_OUT_PREMIUM }}
                className="relative -mt-1 block font-body font-semibold italic text-accent"
                style={{
                  fontSize: 'clamp(2.4rem, 6.2vw, 4.6rem)',
                  letterSpacing: '-0.03em',
                  lineHeight: '0.84',
                }}
              >
                Threshold<span className="text-accent/70">.</span>
                <motion.span
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.9, delay: 1.5, ease: EASE_OUT_PREMIUM }}
                  aria-hidden
                  className="absolute -bottom-1 left-0 block h-px w-[42%] origin-left"
                  style={{
                    background:
                      'linear-gradient(to right, rgba(181, 138, 59,0.85), rgba(181, 138, 59,0.1) 70%, transparent)',
                  }}
                />
              </motion.span>
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.05, ease: EASE_OUT_PREMIUM }}
              className="mt-4 max-w-[520px] font-body italic text-white/80"
              style={{ fontSize: '15px', lineHeight: '1.55' }}
            >
              Write, call, or step through the door. Every message reaches
              the Ayurvedic Wellness Centre vaidyasalai — read, considered,
              and answered with the same care you&rsquo;d receive in person.
            </motion.p>

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.25, ease: EASE_OUT_PREMIUM }}
              className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-heading text-[10.5px] font-medium uppercase tracking-[0.2em] text-white/55"
            >
              <span>Every message read personally</span>
              <span aria-hidden className="h-0.5 w-0.5 rounded-full bg-accent/60" />
              <span>Reply within one working day</span>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4, ease: EASE_OUT_PREMIUM }}
              className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
            >
              <CTAButton href="#letterhead" variant="primary" size="lg" shimmer>
                Send a note
              </CTAButton>
              <CTAButton
                href="https://wa.me/601163393436"
                variant="outlineLight"
                icon={<MessageCircle className="h-4 w-4" strokeWidth={2.2} />}
              >
                WhatsApp now
              </CTAButton>
            </motion.div>

            {/* Directions micro-link (marginal, very subtle) */}
            <motion.a
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.6, ease: EASE_OUT_PREMIUM }}
              href="#bureau"
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 font-heading text-[10.5px] font-medium uppercase tracking-[0.22em] text-white/45 transition-colors duration-300 hover:text-accent"
            >
              <MapPin className="h-3 w-3" strokeWidth={2} />
              Find the Centre →
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  )
}
