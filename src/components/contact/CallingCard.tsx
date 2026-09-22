'use client'

import React from 'react'
import { motion } from 'framer-motion'

import { fadeUp, inViewOnce } from '@/lib/motion'

/**
 * Zone 3 — "The Manifesto"
 * Compact dark-green band between Directory and Letterhead. Replaces the
 * doctor-led calling card with a brand-led editorial pull-quote. Asymmetric
 * layout: vertical edition stamp on the far left, main content column with
 * display quote → 2-col body → trust-promise stat row → signature, and a
 * marginalia column on the right with a wax seal + rotated location text.
 * Closes with a postscript credits band styled like a magazine masthead.
 */
export default function CallingCard() {
  return (
    <section
      id="calling-card"
      aria-labelledby="calling-card-heading"
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0B1F16 0%, #12372D 55%, #0A1A12 100%)' }}
    >
      {/* Faint gold grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(181, 138, 59,1) 1px, transparent 1px), linear-gradient(90deg, rgba(181, 138, 59,1) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* Atmospheric warm corner wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 900px 520px at 50% 50%, rgba(181, 138, 59,0.14) 0%, transparent 65%)',
        }}
      />

      {/* Edge hairlines — top + bottom */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(181, 138, 59,0.5) 25%, rgba(181, 138, 59,0.5) 75%, transparent)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(181, 138, 59,0.5) 25%, rgba(181, 138, 59,0.5) 75%, transparent)',
        }}
      />

      {/* Far-left vertical edition stamp */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-6 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 font-heading text-[9px] uppercase tracking-[0.5em] text-accent/55 lg:flex"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg) translateY(50%)' }}
      >
        <span>Vol. II</span>
        <span className="block h-8 w-px bg-accent/30" />
        <span>Plate N°II</span>
        <span className="block h-8 w-px bg-accent/30" />
        <span>MMXXVI</span>
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-6 py-10 sm:px-10 sm:py-12 lg:px-20 lg:py-14">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          {/* ═══════════ LEFT — main editorial column (8/12) ═══════════ */}
          <div className="lg:col-span-8">
            {/* Eyebrow with No. 02 */}
            <motion.div
              variants={fadeUp(0)}
              initial="initial"
              whileInView="animate"
              viewport={inViewOnce}
              className="flex items-center gap-4"
            >
              <span
                aria-hidden
                className="block h-px w-12"
                style={{
                  background:
                    'linear-gradient(to right, rgba(181, 138, 59,0.85), rgba(181, 138, 59,0))',
                }}
              />
              <span className="font-heading text-[9.5px] font-semibold uppercase tracking-[0.42em] text-accent">
                A Note · From the practice
              </span>
              <span aria-hidden className="block h-1 w-1 rounded-full bg-accent/55" />
              <span
                className="font-fell italic text-accent/85"
                style={{ fontSize: '14px', lineHeight: 1 }}
              >
                No. 02
              </span>
            </motion.div>

            {/* Display quote */}
            <motion.blockquote
              variants={fadeUp(0.05)}
              initial="initial"
              whileInView="animate"
              viewport={inViewOnce}
              id="calling-card-heading"
              className="mt-5 font-body text-white/95"
              style={{
                fontSize: 'clamp(1.7rem, 3.8vw, 2.9rem)',
                lineHeight: '1.08',
                letterSpacing: '-0.02em',
              }}
            >
              <span
                aria-hidden
                className="mr-1 inline-block align-top font-fell text-accent/55"
                style={{ fontSize: '1.4em', lineHeight: '0.6', transform: 'translateY(0.2em)' }}
              >
                &ldquo;
              </span>
              <span>Every consultation begins with a </span>
              <em className="italic text-accent">meaningful</em>
              <span> conversation.</span>
              <span
                className="mt-2 block text-white/55"
                style={{ fontSize: '0.55em', letterSpacing: '-0.015em' }}
              >
                The dispensary opens after.
              </span>
            </motion.blockquote>

            {/* Gold ornament divider */}
            <motion.div
              variants={fadeUp(0.1)}
              initial="initial"
              whileInView="animate"
              viewport={inViewOnce}
              className="mt-6 flex items-center gap-3"
              aria-hidden
            >
              <span className="block h-px w-12 bg-accent/40" />
              <span className="text-accent/80" style={{ fontSize: '13px', lineHeight: 1 }}>
                ✦
              </span>
              <span className="block h-px w-12 bg-accent/40" />
            </motion.div>

            {/* Two-column body paragraphs */}
            <motion.div
              variants={fadeUp(0.15)}
              initial="initial"
              whileInView="animate"
              viewport={inViewOnce}
              className="mt-5 grid max-w-[640px] grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-2"
            >
              <p
                className="font-body italic text-cream"
                style={{ fontSize: '13.5px', lineHeight: '1.65', color: '#EDF4E7' }}
              >
                We don&rsquo;t shortcut. We sit, listen, and read your pulse before we
                open the dispensary. The Ayurveda you&rsquo;ll receive here is unhurried
                by design — the way the Ayurvedic masters intended it, in a city that
                rarely allows for slowness.
              </p>
              <p
                className="font-body italic text-cream"
                style={{ fontSize: '13.5px', lineHeight: '1.65', color: '#EDF4E7' }}
              >
                This practice has stood on this Brickfields street. We stay
                because our patients stay; the dispensary is kept stocked the way our
                teachers kept theirs — by hand, in small batches, to proportions older
                than the building itself.
              </p>
            </motion.div>

            {/* Trust-promise stat row */}
            <motion.div
              variants={fadeUp(0.2)}
              initial="initial"
              whileInView="animate"
              viewport={inViewOnce}
              className="mt-7 grid max-w-[600px] grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6 lg:gap-8"
            >
              <div>
                <p
                  className="whitespace-nowrap font-body font-medium italic text-accent"
                  style={{ fontSize: '32px', lineHeight: 1, letterSpacing: '-0.02em' }}
                >
                  18
                </p>
                <p
                  className="mt-2 font-heading text-[9px] uppercase leading-[1.5] tracking-[0.28em]"
                  style={{ color: 'rgba(237, 244, 231, 0.75)' }}
                >
                  Years on this Brickfields street
                </p>
              </div>
              <div>
                <p
                  className="whitespace-nowrap font-body font-medium italic text-accent"
                  style={{ fontSize: '32px', lineHeight: 1, letterSpacing: '-0.02em' }}
                >
                  Certified
                </p>
                <p
                  className="mt-2 font-heading text-[9px] uppercase leading-[1.5] tracking-[0.28em]"
                  style={{ color: 'rgba(237, 244, 231, 0.75)' }}
                >
                  Practitioner-led care · never delegated
                </p>
              </div>
              <div>
                <p
                  className="whitespace-nowrap font-body font-medium italic text-accent"
                  style={{ fontSize: '32px', lineHeight: 1, letterSpacing: '-0.02em' }}
                >
                  In-house
                </p>
                <p
                  className="mt-2 font-heading text-[9px] uppercase leading-[1.5] tracking-[0.28em]"
                  style={{ color: 'rgba(237, 244, 231, 0.75)' }}
                >
                  Treatment rooms · oils pressed by hand
                </p>
              </div>
            </motion.div>

            {/* Signature */}
            <motion.div
              variants={fadeUp(0.25)}
              initial="initial"
              whileInView="animate"
              viewport={inViewOnce}
              className="mt-8 flex items-center gap-4"
            >
              <span
                aria-hidden
                className="block h-px w-16"
                style={{
                  background:
                    'linear-gradient(to right, rgba(181, 138, 59,0.7), rgba(181, 138, 59,0))',
                }}
              />
              <span className="font-heading text-[9.5px] font-semibold uppercase tracking-[0.4em] text-accent/85">
                — The Ayurvedic Wellness Centre Practice
              </span>
            </motion.div>
          </div>

          {/* ═══════════ RIGHT — marginalia column (4/12) ═══════════ */}
          <motion.div
            variants={fadeUp(0.1)}
            initial="initial"
            whileInView="animate"
            viewport={inViewOnce}
            className="hidden self-start pr-2 pt-2 lg:col-span-4 lg:flex lg:flex-col lg:items-end lg:gap-8"
          >
            {/* Wax seal */}
            <div
              aria-hidden
              className="relative h-24 w-24 rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, #FFF9F2 0%, #B58A3B 60%, #B58A3B 100%)',
                boxShadow:
                  '0 8px 18px -6px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.18)',
              }}
            >
              <div
                className="absolute inset-2 rounded-full border"
                style={{ borderColor: 'rgba(18, 55, 45,0.3)' }}
              />
              <div
                className="absolute inset-3 rounded-full border"
                style={{ borderColor: 'rgba(18, 55, 45,0.15)', borderStyle: 'dashed' }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#12372D]">
                <span className="font-devanagari italic" style={{ fontSize: '16px', lineHeight: 1 }}>
                  आयुर्वेद
                </span>
                <span className="mt-1 font-heading text-[7px] font-bold uppercase tracking-[0.2em]">
                  A · W · C
                </span>
              </div>
            </div>

            {/* Vertical location label */}
            <div
              aria-hidden
              className="font-heading text-[9px] uppercase tracking-[0.5em] text-accent/65"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Brickfields · Kuala Lumpur · Malaysia
            </div>
          </motion.div>
        </div>

        {/* Bottom postscript credits band */}
        <motion.div
          variants={fadeUp(0.3)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="mt-7 flex flex-wrap items-center justify-between gap-y-3 border-t border-accent/25 pt-4 text-white/55"
        >
          <span className="font-heading text-[9px] uppercase tracking-[0.4em]">
            Vol. II · The Correspondence
          </span>
          <span className="flex items-center gap-3 font-heading text-[9px] uppercase tracking-[0.4em]">
            <span aria-hidden className="block h-1 w-1 rotate-45 bg-accent/65" />
            Plate N°II · The Manifesto
            <span aria-hidden className="block h-1 w-1 rotate-45 bg-accent/65" />
          </span>
          <span
            className="font-fell italic text-accent/65"
            style={{ fontSize: '14px' }}
          >
            — printed in Brickfields
          </span>
        </motion.div>
      </div>
    </section>
  )
}
