'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, MessageCircle, ArrowUpRight } from 'lucide-react'
import { fadeUp, inViewOnce, EASE_OUT_PREMIUM } from '@/lib/motion'
import { faqs as defaultFaqs, type FAQ } from '@/data/faqs'

interface FAQsProps {
  items?: FAQ[]
  eyebrow?: string
  title?: string
  subtitle?: string
  id?: string
}

/* ── Warm parchment — deliberately warmer/more saturated than the pale ivory/mint
   used by the sections above and below it, so the seam is actually visible ── */
const BG_SAGE    = '#F3E6CE'
const TEXT_DARK  = '#006B3C'
const TEXT_MUTED = 'rgba(0, 107, 60,0.70)'
const GOLD       = '#B58A3B'
const GOLD_SOFT  = 'rgba(181, 138, 59, 0.22)'
const LOTUS      = '#E91E73'

export default function FAQs({
  items = defaultFaqs,
  eyebrow = 'Common Questions',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  title: _title = 'Before You Book',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subtitle: _subtitle,
  id = 'faqs',
}: FAQsProps = {}) {
  const [index, setIndex] = useState(0)
  const active = items[index]

  const go = (dir: 1 | -1) => {
    setIndex((prev) => (prev + dir + items.length) % items.length)
  }

  return (
    <section
      id={id}
      aria-labelledby="faq-heading"
      className="relative overflow-hidden py-12 sm:py-14 lg:py-16"
      style={{ background: BG_SAGE, color: TEXT_DARK }}
    >
      {/* explicit seam markers — don't rely on color contrast alone to show the section boundary */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent 5%, ${GOLD} 50%, transparent 95%)`, opacity: 0.55 }} />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px" style={{ background: `linear-gradient(to right, transparent 5%, ${GOLD} 50%, transparent 95%)`, opacity: 0.55 }} />

      {/* paper grain — gives the flat sage bg enough depth for the card to read as separate */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5] mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(rgba(0,107,60,0.07) 1px, transparent 1px)',
          backgroundSize: '3px 3px',
        }}
      />

      <div className="relative mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">

          {/* ── LEFT: Title + copy + CTA ── */}
          <motion.aside
            variants={fadeUp(0)}
            initial="initial"
            whileInView="animate"
            viewport={inViewOnce}
            className="lg:col-span-5"
          >
            <span className="font-heading text-[11px] font-bold uppercase tracking-[0.36em]" style={{ color: GOLD }}>
              {eyebrow}
            </span>

            <h2
              id="faq-heading"
              className="mt-3 font-display"
              style={{ fontSize: 'clamp(2.1rem, 4vw, 3rem)', lineHeight: 1.05, letterSpacing: '-0.02em', color: TEXT_DARK }}
            >
              Before You{' '}
              <span className="italic" style={{ color: LOTUS, textShadow: '0 3px 22px rgba(233, 30, 115,0.18)' }}>
                Book.
              </span>
            </h2>

            <p
              className="mt-4 max-w-md font-body leading-[1.65]"
              style={{ color: TEXT_MUTED, fontSize: 'clamp(14px, 1.05vw, 16px)' }}
            >
              The questions guests ask us most often. Still curious? Reach out — our
              team responds within the hour.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a
                href="https://wa.me/601163393436"
                className="group inline-flex items-center gap-2.5 rounded-full px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.22em] transition-all duration-300 hover:-translate-y-0.5"
                style={{ backgroundColor: TEXT_DARK, color: '#EDF4E7', boxShadow: `0 14px 30px -14px ${TEXT_DARK}aa` }}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp Us
              </a>

              <a
                href="/contact"
                className="group inline-flex items-center gap-1.5 font-heading text-[11px] font-bold uppercase tracking-[0.22em] transition-colors"
                style={{ color: LOTUS }}
              >
                Or send an enquiry
                <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </motion.aside>

          {/* ── RIGHT: Spotlight reader — one question at a time, not another accordion ── */}
          <motion.div
            variants={fadeUp(0.1)}
            initial="initial"
            whileInView="animate"
            viewport={inViewOnce}
            className="lg:col-span-7"
          >
            <div
              className="relative overflow-hidden rounded-3xl px-7 py-9 sm:px-10 sm:py-11"
              style={{
                backgroundColor: '#FFFFFF',
                border: `1px solid ${GOLD_SOFT}`,
                boxShadow: '0 24px 48px -28px rgba(0,107,60,0.28), 0 2px 10px rgba(0,107,60,0.08)',
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -left-1 -top-3 select-none font-display"
                style={{ fontSize: '90px', lineHeight: 1, color: GOLD_SOFT }}
              >
                &ldquo;
              </span>

              <div className="relative min-h-[190px] sm:min-h-[170px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: EASE_OUT_PREMIUM }}
                  >
                    <h3
                      className="font-display italic"
                      style={{ fontSize: 'clamp(19px, 2vw, 23px)', lineHeight: 1.4, color: TEXT_DARK }}
                    >
                      {active.question}
                    </h3>
                    <p
                      className="mt-4 max-w-lg font-body leading-relaxed"
                      style={{ color: TEXT_MUTED, fontSize: '14.5px', lineHeight: 1.7 }}
                    >
                      {active.answer}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Prev / next + position dots — the section's own, un-shared interaction */}
              <div className="relative mt-7 flex items-center justify-between border-t pt-6" style={{ borderColor: GOLD_SOFT }}>
                <span className="font-heading text-[10px] font-bold uppercase tracking-[0.32em] tabular-nums" style={{ color: 'rgba(0,107,60,0.4)' }}>
                  {String(index + 1).padStart(2, '0')}
                  <span className="mx-1" style={{ color: GOLD_SOFT }}>/</span>
                  {String(items.length).padStart(2, '0')}
                </span>

                <div className="flex items-center gap-2">
                  {items.map((faq, i) => (
                    <button
                      key={faq.id}
                      type="button"
                      aria-label={`Question ${i + 1}`}
                      onClick={() => setIndex(i)}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === index ? '20px' : '6px',
                        height: '6px',
                        backgroundColor: i === index ? GOLD : GOLD_SOFT,
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous question"
                    onClick={() => go(-1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:-translate-x-0.5"
                    style={{ border: `1px solid ${GOLD_SOFT}`, color: GOLD }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next question"
                    onClick={() => go(1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:translate-x-0.5"
                    style={{ border: `1px solid ${GOLD_SOFT}`, color: GOLD }}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
