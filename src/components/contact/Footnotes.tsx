'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'

import { EASE_OUT_PREMIUM, fadeUp, inViewOnce } from '@/lib/motion'
import { contactFaqs as contactFaqsFallback } from '@/data/contactFaqs'
import type { FAQ } from '@/data/faqs'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

interface FootnotesProps {
  items?: FAQ[]
}

/**
 * Zone 6 — "The Footnotes"
 * Pinned handwritten note (left, sticky, tilted) + compact accordion of
 * frequently asked questions (right, single-open). Closes with a trimmed
 * letter-style sign-off rather than a centred banner.
 */
export default function Footnotes({ items = contactFaqsFallback }: FootnotesProps = {}) {
  const contactFaqs = items
  const [open, setOpen] = useState<string | null>(null)

  return (
    <section
      id="footnotes"
      aria-labelledby="footnotes-heading"
      className="relative overflow-hidden bg-cream py-10 sm:py-12 lg:py-14"
    >
      {/* L0  Gold dot grid — subtle, on cream */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(181, 138, 59,0.18) 1px, transparent 1px), radial-gradient(circle, rgba(181, 138, 59,0.18) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px',
        }}
      />

      {/* L1  Atmospheric warm radials */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 900px 700px at 88% 0%, rgba(181, 138, 59,0.14) 0%, transparent 55%), radial-gradient(ellipse 700px 500px at 12% 100%, rgba(0, 107, 60,0.08) 0%, transparent 60%), radial-gradient(ellipse 500px 380px at 50% 50%, rgba(181, 138, 59,0.05) 0%, transparent 60%)',
        }}
      />

      {/* L2  Botanical engraving — bottom-left, faded */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -left-12 -bottom-12 h-[420px] w-[420px] opacity-[0.09]"
        viewBox="0 0 420 420"
        fill="none"
        stroke="#006B3C"
        strokeWidth="0.6"
      >
        <g strokeLinecap="round">
          {/* Stem */}
          <path d="M210 420 Q205 320 208 240 Q200 150 205 60" />
          {/* Leaves alternating */}
          <path d="M208 360 Q170 340 130 320 Q170 335 208 345" />
          <path d="M208 340 Q250 320 290 300 Q250 315 208 325" />
          <path d="M207 280 Q160 260 120 250 Q160 270 207 270" />
          <path d="M207 260 Q250 245 290 240 Q250 255 207 257" />
          <path d="M205 195 Q165 180 125 175 Q165 195 205 192" />
          <path d="M207 185 Q255 175 295 175 Q255 185 207 183" />
          <path d="M203 130 Q165 120 130 120 Q165 135 203 130" />
          <path d="M205 120 Q255 115 295 120 Q255 125 205 122" />
          {/* Flower at top */}
          <g transform="translate(205 60)">
            <circle r="22" />
            <circle r="14" />
            <circle r="6" />
            <path d="M-22 0 L-32 0 M22 0 L32 0 M0 -22 L0 -32 M0 22 L0 32 M-15 -15 L-22 -22 M15 15 L22 22 M15 -15 L22 -22 M-15 15 L-22 22" />
          </g>
        </g>
      </svg>

      {/* L3  Botanical engraving — top-right, smaller, faded */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-[320px] w-[320px] opacity-[0.07]"
        viewBox="0 0 320 320"
        fill="none"
        stroke="#006B3C"
        strokeWidth="0.6"
      >
        <g strokeLinecap="round" transform="rotate(180 160 160)">
          <path d="M160 320 Q155 240 158 180 Q150 100 155 40" />
          <path d="M158 260 Q125 245 95 230 Q125 245 158 250" />
          <path d="M158 240 Q195 225 225 215 Q195 230 158 235" />
          <path d="M157 180 Q125 165 95 160 Q125 175 157 175" />
          <path d="M157 160 Q195 145 225 145 Q195 155 157 158" />
          <g transform="translate(155 40)">
            <circle r="16" />
            <circle r="9" />
            <path d="M-16 0 L-22 0 M16 0 L22 0 M0 -16 L0 -22 M0 16 L0 22" />
          </g>
        </g>
      </svg>

      {/* L4  Grain overlay */}
      <div aria-hidden className="grain-overlay pointer-events-none absolute inset-0 opacity-60" />

      {/* L5  Gold double-frame border + L-bracket corners (editorial spread) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-4 sm:inset-6 md:inset-8 lg:inset-10"
      >
        <div className="absolute inset-0 rounded-[2px] border border-accent/40" />
        <div className="absolute inset-3 rounded-[2px] border border-accent/20" />
        <div className="absolute -left-[1px] -top-[1px] h-4 w-4 border-l-2 border-t-2 border-accent/70" />
        <div className="absolute -right-[1px] -top-[1px] h-4 w-4 border-r-2 border-t-2 border-accent/70" />
        <div className="absolute -bottom-[1px] -left-[1px] h-4 w-4 border-b-2 border-l-2 border-accent/70" />
        <div className="absolute -bottom-[1px] -right-[1px] h-4 w-4 border-b-2 border-r-2 border-accent/70" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-8 sm:px-10 lg:px-8">
        {/* Eyebrow */}
        <motion.div
          variants={fadeUp(0)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="flex items-center justify-center gap-4 text-center"
        >
          <span
            aria-hidden
            className="h-px w-14 sm:w-20"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(181, 138, 59,0.7))',
            }}
          />
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.4em] text-accent">
            The Footnotes
          </span>
          <span
            aria-hidden
            className="h-px w-14 sm:w-20"
            style={{
              background: 'linear-gradient(to left, transparent, rgba(181, 138, 59,0.7))',
            }}
          />
        </motion.div>

        {/* 2-column body */}
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10 lg:mt-7">
          {/* LEFT — pinned note */}
          <motion.aside
            variants={fadeUp(0)}
            initial="initial"
            whileInView="animate"
            viewport={inViewOnce}
            className="md:col-span-5 lg:col-span-4"
          >
            <div className="md:sticky md:top-28">
              <NoteCard />
            </div>
          </motion.aside>

          {/* RIGHT — accordion */}
          <motion.div
            variants={fadeUp(0.05)}
            initial="initial"
            whileInView="animate"
            viewport={inViewOnce}
            className="md:col-span-7 lg:col-span-8"
          >
            {/* Section title */}
            <div className="flex items-baseline justify-between gap-4">
              <h2
                id="footnotes-heading"
                className="font-heading font-extrabold leading-[1.05] tracking-[-0.025em] text-primary"
                style={{ fontSize: 'clamp(1.4rem, 2.4vw, 1.75rem)' }}
              >
                Questions,{' '}
                <span className="font-body italic font-normal text-accent">answered.</span>
              </h2>
              <span className="hidden shrink-0 font-body text-[11px] italic text-dark/45 sm:inline">
                Tap to read
              </span>
            </div>

            <span
              aria-hidden
              className="mt-3 block h-px w-full"
              style={{
                background:
                  'linear-gradient(to right, rgba(181, 138, 59,0.7) 0%, rgba(181, 138, 59,0.1) 100%)',
              }}
            />

            {/* Accordion list */}
            <ul className="mt-1 flex flex-col">
              {contactFaqs.map((faq, idx) => {
                const isOpen = open === faq.id
                const isLast = idx === contactFaqs.length - 1
                return (
                  <li key={faq.id}>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : faq.id)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${faq.id}`}
                      className="group flex w-full items-center gap-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                    >
                      {/* Footnote mark — tiny superscript numeral */}
                      <span
                        aria-hidden
                        className="flex w-7 shrink-0 items-start justify-center pt-1"
                      >
                        <span
                          className="font-body italic leading-none"
                          style={{
                            fontSize: '12px',
                            letterSpacing: '-0.02em',
                            color: isOpen
                              ? 'rgb(212, 175, 55)'
                              : 'rgba(181, 138, 59,0.55)',
                          }}
                        >
                          {ROMAN[idx] ?? idx + 1}.
                        </span>
                      </span>

                      {/* Question */}
                      <span
                        className="flex-1 font-heading font-semibold leading-[1.4] tracking-[-0.01em] transition-colors duration-300"
                        style={{
                          fontSize: '14.5px',
                          color: isOpen
                            ? 'rgb(110, 16, 35)'
                            : 'rgba(18, 55, 45,0.85)',
                        }}
                      >
                        {faq.question}
                      </span>

                      {/* Plus / minus indicator */}
                      <motion.span
                        aria-hidden
                        className="shrink-0 text-accent"
                        initial={false}
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.3, ease: EASE_OUT_PREMIUM }}
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="answer"
                          id={`faq-panel-${faq.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.32, ease: EASE_OUT_PREMIUM }}
                          className="overflow-hidden"
                        >
                          <div className="relative ml-7 border-l border-accent/40 pb-4 pl-4 pr-2">
                            <p className="max-w-[58ch] font-body text-[13px] leading-[1.7] text-dark/75">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Asterism divider */}
                    {!isLast && (
                      <div
                        aria-hidden
                        className="flex items-center justify-center py-0.5 text-[7px] tracking-[0.8em] text-accent/40"
                      >
                        * * *
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>

            {/* Letter-style sign-off */}
            <div className="mt-5 flex flex-col items-end gap-0.5 text-right">
              <p className="font-body text-[13px] italic text-primary/75">
                Yours in wellness,
              </p>
              <p
                className="font-body italic text-accent"
                style={{ fontSize: '18px', letterSpacing: '-0.02em', lineHeight: 1.1 }}
              >
                — Ayurvedic Wellness Centre
              </p>
              <p className="mt-1 max-w-[42ch] font-body text-[10px] italic leading-[1.5] text-dark/40">
                Ayurvedic Wellness Centre · Reg. [BUSINESS REGISTRATION NO.] · No. 37, Jalan
                Thamby Abdullah-1, Brickfields 50470 KL
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────── */

function NoteCard() {
  return (
    <div
      className="relative mx-auto max-w-[320px] bg-white px-6 py-6 shadow-elevated md:mx-0 md:-rotate-[1.5deg]"
      style={{ transformOrigin: 'center' }}
    >
      {/* Washi-tape corners — top-left + bottom-right */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-3 -top-2 h-3.5 w-12 rotate-[-18deg]"
        style={{
          background:
            'linear-gradient(135deg, rgba(181, 138, 59,0.65) 0%, rgba(181, 138, 59,0.35) 60%, rgba(181, 138, 59,0.55) 100%)',
          boxShadow:
            'inset 0 0 0 1px rgba(255,255,255,0.25), 0 1px 2px rgba(0,0,0,0.08)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-2 -right-3 h-3.5 w-12 rotate-[-18deg]"
        style={{
          background:
            'linear-gradient(135deg, rgba(181, 138, 59,0.65) 0%, rgba(181, 138, 59,0.35) 60%, rgba(181, 138, 59,0.55) 100%)',
          boxShadow:
            'inset 0 0 0 1px rgba(255,255,255,0.25), 0 1px 2px rgba(0,0,0,0.08)',
        }}
      />

      {/* Inner paper hairline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-2 border border-accent/15"
      />

      <h3
        className="relative font-heading font-extrabold leading-[1.05] tracking-[-0.025em] text-primary"
        style={{ fontSize: '1.35rem' }}
      >
        A Few Things{' '}
        <span className="font-body italic font-normal text-accent">Worth Knowing.</span>
      </h3>

      <span
        aria-hidden
        className="relative my-3 block h-px w-16"
        style={{
          background:
            'linear-gradient(to right, rgba(181, 138, 59,0.85), rgba(181, 138, 59,0.15))',
        }}
      />

      <blockquote className="relative">
        <p
          className="font-body italic leading-[1.55] text-dark/80"
          style={{ fontSize: '13px' }}
        >
          Therapies Are Strictly Same-Gender. All Bookings Carry a 48-Hour Cancellation
          Notice; The Advance Deposit Is Non-Refundable.
        </p>
      </blockquote>

      {/* Brand-led signature */}
      <div className="relative mt-4">
        <span
          className="font-body italic text-accent"
          style={{ fontSize: '18px', letterSpacing: '-0.02em', lineHeight: 1.15 }}
        >
          — the Ayurvedic Wellness Centre
        </span>
      </div>

      <svg
        aria-hidden
        viewBox="0 0 180 14"
        className="relative mt-1 h-3 w-[120px] text-accent/70"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M2 10 C 16 4, 34 12, 54 7 S 96 2, 118 9 S 156 12, 172 6"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
