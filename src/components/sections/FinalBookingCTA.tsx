'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Calendar, MessageCircle } from 'lucide-react'
import CTAButton from '@/components/ui/CTAButton'
import { clipReveal, fadeUp, staggerParent, inViewOnce } from '@/lib/motion'

/* ── Palette ── */
const EMERALD       = '#006B3C'
const EMERALD_DEEP  = '#12372D'
const SAFFRON       = '#B58A3B'
const SAFFRON_SOFT  = '#B58A3B'
const LOTUS          = '#F17CA5'

/**
 * Cinematic close — split layout:
 * Left: atmospheric photograph with warm tint + grain (saffron rim)
 * Right: emerald gradient CTA panel with saffron glow
 */
export default function FinalBookingCTA() {
  return (
    <section
      id="booking"
      aria-labelledby="booking-heading"
      className="relative overflow-hidden"
    >
      <div className="grid min-h-[280px] grid-cols-1 lg:grid-cols-[3fr_2fr]">
        {/* ── LEFT: Ambient looping shot — Shirodhara oil drip, matches the hero's visual world.
            Clean full-bleed edge against the CTA panel: fading warm brass into saturated emerald
            always turns murky olive, so the seam is a deliberate gold rim instead of a gradient. */}
        <motion.div
          variants={clipReveal('left', 0)}
          initial="initial"
          animate="animate"
          className="relative hidden min-h-[220px] lg:block"
        >
          <video
            className="absolute inset-0 h-full w-full object-cover"
            poster="/cta-herbs-poster.png"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/cta-herbs.mp4" type="video/mp4" />
          </video>
          {/* Grain overlay */}
          <div className="grain-overlay-dark absolute inset-0" aria-hidden />
          {/* Gold rim at the seam — a deliberate edge, not a blend */}
          <div
            className="absolute inset-y-0 right-0 w-px"
            style={{
              background:
                'linear-gradient(to bottom, transparent 0%, rgba(181,138,59,0.6) 50%, transparent 100%)',
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
            src="/cta-herbs-poster.png"
            alt="Shirodhara oil drip into a bowl of lotus and jasmine"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{ backgroundColor: 'rgba(0,107,60,0.26)' }}
            aria-hidden
          />
          {/* Bottom fade to emerald */}
          <div
            className="absolute inset-x-0 bottom-0 h-20"
            style={{
              background: `linear-gradient(to top, ${EMERALD} 0%, transparent 100%)`,
            }}
            aria-hidden
          />
        </motion.div>

        {/* ── RIGHT: CTA content ─────────────────────── */}
        <div
          className="relative flex flex-col justify-center px-6 py-7 sm:px-10 lg:px-14 lg:py-8"
          style={{
            background: `linear-gradient(135deg, ${EMERALD} 0%, ${EMERALD_DEEP} 100%)`,
          }}
        >

          {/* Saffron radial glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 15% 10%, rgba(181, 138, 59,0.18), transparent 60%), radial-gradient(ellipse 50% 55% at 90% 95%, rgba(181, 138, 59,0.10), transparent 65%)',
            }}
            aria-hidden
          />

          {/* Subtle grain */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-overlay"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '3px 3px',
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
            {/* Eyebrow with line */}
            <motion.div variants={fadeUp(0)} className="flex items-center gap-3">
              <span
                aria-hidden
                className="inline-block h-px w-10"
                style={{ backgroundColor: SAFFRON_SOFT, opacity: 0.7 }}
              />
              <span
                className="font-heading text-[11px] font-bold uppercase tracking-[0.36em]"
                style={{ color: SAFFRON_SOFT }}
              >
                Begin Your Journey
              </span>
            </motion.div>

            {/* Headline — Montserrat + Playfair italic */}
            <motion.h2
              id="booking-heading"
              variants={fadeUp(0)}
              className="mt-3 flex flex-col"
            >
              <span
                className="font-heading font-extrabold text-white"
                style={{
                  fontSize: 'clamp(1.6rem, 2.8vw, 2.1rem)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.025em',
                }}
              >
                Your first step toward
              </span>
              <span
                className="font-display italic"
                style={{
                  color: LOTUS,
                  fontSize: 'clamp(1.8rem, 3.4vw, 2.5rem)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.015em',
                  textShadow: '0 3px 22px rgba(241, 124, 165,0.28)',
                }}
              >
                lasting wellness.
              </span>
            </motion.h2>

            <motion.p
              variants={fadeUp(0)}
              className="mt-4 font-body leading-[1.6] text-white/95"
              style={{ fontSize: 'clamp(14px, 1vw, 15px)' }}
            >
              Book a 30-minute consultation with our{' '}
              <span className="font-semibold text-white">certified Vaidyas</span>{' '}
              at our Brickfields Centre. We&apos;ll assess your dosha and design a
              protocol you can live with.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp(0)}
              className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col"
            >
              <CTAButton
                href="/book/consultation"
                variant="primary"
                size="lg"
                icon={<Calendar className="h-4 w-4" />}
              >
                Book a Consultation
              </CTAButton>
              <CTAButton
                href="https://wa.me/601163393436"
                variant="outlineLight"
                size="lg"
                icon={<MessageCircle className="h-4 w-4" />}
              >
                WhatsApp Us
              </CTAButton>
            </motion.div>

            {/* Trust row — no specific Vaidya name */}
            <motion.div
              variants={fadeUp(0)}
              className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-white/45"
            >
              <span>Brickfields, KL</span>
              <span
                aria-hidden
                className="h-1 w-1 rotate-45"
                style={{ backgroundColor: SAFFRON, opacity: 0.7 }}
              />
              <span>Certified Vaidyas</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
