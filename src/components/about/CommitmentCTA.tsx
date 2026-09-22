'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Calendar, MessageCircle } from 'lucide-react'
import CTAButton from '@/components/ui/CTAButton'
import { clipReveal, fadeUp, staggerParent, inViewOnce } from '@/lib/motion'

const defaults = {
  eyebrow: 'Our Commitment to You',
  headlineLead: 'Your Partner in',
  headlineAccent: 'Health.',
  body:
    'Ayurvedic Wellness Centre is a trusted name in holistic healing. Our mission is simple: to help you rediscover balance and vitality through integrity, compassion, and excellence.',
  closingLine: 'Experience the difference that true Ayurveda makes.',
  primaryLabel: 'Book a Consultation',
  primaryHref: '/book/consultation',
  secondaryLabel: 'WhatsApp Us',
  secondaryHref: 'https://wa.me/601163393436',
  trustPills: ['Brickfields, KL', 'our Vaidyas'],
}

interface CommitmentCTAProps {
  eyebrow?: string
  headlineLead?: string
  headlineAccent?: string
  body?: string
  closingLine?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  trustPills?: string[]
}

/**
 * Commitment CTA — cinematic close mirroring homepage FinalBookingCTA.
 * Split: atmospheric photograph left, CTA content on nearBlackGreen right.
 * Copy and CTAs are overridable via props; missing fields fall back to the
 * hard-coded defaults above.
 */
export default function CommitmentCTA({
  eyebrow,
  headlineLead,
  headlineAccent,
  body,
  closingLine,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  trustPills,
}: CommitmentCTAProps = {}) {
  const copy = {
    eyebrow: eyebrow || defaults.eyebrow,
    headlineLead: headlineLead || defaults.headlineLead,
    headlineAccent: headlineAccent || defaults.headlineAccent,
    body: body || defaults.body,
    closingLine: closingLine || defaults.closingLine,
    primaryLabel: primaryLabel || defaults.primaryLabel,
    primaryHref: primaryHref || defaults.primaryHref,
    secondaryLabel: secondaryLabel || defaults.secondaryLabel,
    secondaryHref: secondaryHref || defaults.secondaryHref,
    trustPills:
      trustPills && trustPills.length > 0 ? trustPills : defaults.trustPills,
  }
  return (
    <section
      id="about-cta"
      aria-labelledby="commitment-heading"
      className="relative overflow-hidden"
    >
      <div className="grid min-h-[280px] grid-cols-1 lg:grid-cols-[3fr_2fr]">
        {/* ── LEFT: Atmospheric photograph ────────────── */}
        <motion.div
          variants={clipReveal('left', 0)}
          initial="initial"
          animate="animate"
          className="relative hidden min-h-[220px] lg:block"
        >
          <Image
            src="/cta-ayurveda.jpg"
            alt="Ayurvedic herbs and therapeutic oils"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 60vw, 0vw"
          />
          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{ backgroundColor: 'rgba(0, 107, 60,0.28)' }}
            aria-hidden
          />
          <div className="grain-overlay-dark pointer-events-none absolute inset-0" aria-hidden />
          {/* Right edge gold hairline */}
          <div
            className="absolute inset-y-0 right-0 w-px"
            style={{
              background:
                'linear-gradient(to bottom, transparent, rgba(181, 138, 59,0.35), transparent)',
            }}
            aria-hidden
          />
        </motion.div>

        {/* Mobile: image band */}
        <motion.div
          variants={clipReveal('bottom', 0)}
          initial="initial"
          animate="animate"
          className="relative h-[22vh] min-h-[160px] lg:hidden"
        >
          <Image
            src="/cta-ayurveda.jpg"
            alt="Ayurvedic herbs and oils"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{ backgroundColor: 'rgba(0, 107, 60,0.32)' }}
            aria-hidden
          />
          <div
            className="absolute inset-x-0 bottom-0 h-20"
            style={{
              background: 'linear-gradient(to top, #12372D 0%, transparent 100%)',
            }}
            aria-hidden
          />
        </motion.div>

        {/* ── RIGHT: CTA content ─────────────────────── */}
        <div
          className="relative flex flex-col justify-center px-6 py-7 sm:px-10 lg:px-14 lg:py-8"
          style={{ background: 'linear-gradient(135deg, #006B3C 0%, #12372D 100%)' }}
        >
          {/* Subtle radial glow — matches the homepage FinalBookingCTA panel */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 50%, rgba(181, 138, 59,0.1) 0%, transparent 60%)',
            }}
            aria-hidden
          />

          <motion.div
            variants={staggerParent(0.12, 0.05)}
            initial="initial"
            whileInView="animate"
            viewport={inViewOnce}
            className="relative z-10 max-w-md"
          >
            <motion.span
              variants={fadeUp(0)}
              className="inline-block font-heading text-[10px] font-semibold uppercase tracking-[0.35em] text-accent"
            >
              {copy.eyebrow}
            </motion.span>

            <motion.h2
              id="commitment-heading"
              variants={fadeUp(0)}
              className="mt-3 font-heading font-extrabold leading-[1.05] text-white"
              style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.1rem)', letterSpacing: '-0.025em' }}
            >
              {copy.headlineLead}
              {copy.headlineAccent ? (
                <>
                  {' '}
                  <span className="text-accent">{copy.headlineAccent}</span>
                </>
              ) : null}
            </motion.h2>

            <motion.p
              variants={fadeUp(0)}
              className="mt-4 font-body leading-[1.6] text-white/95"
              style={{ fontSize: 'clamp(14px, 1vw, 15px)' }}
            >
              {copy.body}
            </motion.p>

            {copy.closingLine ? (
              <motion.p
                variants={fadeUp(0)}
                className="mt-2 font-body text-[13px] italic text-white/60"
              >
                {copy.closingLine}
              </motion.p>
            ) : null}

            {/* CTAs — stacked vertically */}
            <motion.div
              variants={fadeUp(0)}
              className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col"
            >
              <CTAButton
                href={copy.primaryHref}
                variant="primary"
                size="lg"
                icon={<Calendar className="h-4 w-4" />}
              >
                {copy.primaryLabel}
              </CTAButton>
              <CTAButton
                href={copy.secondaryHref}
                variant="outlineLight"
                size="lg"
                icon={<MessageCircle className="h-4 w-4" />}
              >
                {copy.secondaryLabel}
              </CTAButton>
            </motion.div>

            {/* Trust row */}
            <motion.div
              variants={fadeUp(0)}
              className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-heading text-[10px] font-medium uppercase tracking-[0.18em] text-white/30"
            >
              {copy.trustPills.map((pill, i, arr) => (
                <React.Fragment key={i}>
                  <span>{pill}</span>
                  {i < arr.length - 1 ? (
                    <span className="h-0.5 w-0.5 rounded-full bg-accent/40" />
                  ) : null}
                </React.Fragment>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
