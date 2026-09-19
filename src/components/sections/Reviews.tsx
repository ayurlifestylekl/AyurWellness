'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { reviews } from '@/data/reviews'
import {
  fadeUp,
  inViewOnce,
} from '@/lib/motion'

// Elegant, premium palette
const BG_LUXE     = '#DCEEDC' // deliberately more saturated than the pale ivory token — that read as white
const TEXT_DARK   = '#12372D' // Deep Charcoal
const TEXT_MUTED  = '#12372D' // Soft Charcoal
const GOLD        = '#B58A3B' // Elegant Gold
const BORDER      = 'rgba(181, 138, 59, 0.15)'

// Duplicate reviews to ensure enough content to loop seamlessly
const marqueeItems = [...reviews, ...reviews, ...reviews, ...reviews]

export default function Reviews() {
  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="relative overflow-hidden py-12 lg:py-16"
      style={{ backgroundColor: BG_LUXE, color: TEXT_DARK }}
    >
      {/* Top Hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(to right, transparent 5%, ${BORDER} 50%, transparent 95%)`,
        }}
      />
      {/* Bottom Hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background: `linear-gradient(to right, transparent 5%, ${BORDER} 50%, transparent 95%)`,
        }}
      />

      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-6 sm:px-8 lg:px-12">
        {/* Header Section */}
        <motion.div
          variants={fadeUp(0)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-end"
        >
          <div>
            <div className="flex items-center gap-3 font-heading text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: GOLD }}>
              <span>Words of Trust</span>
              <span className="h-[3px] w-[3px] rotate-45" style={{ backgroundColor: GOLD }} />
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" fill={GOLD} stroke="none" />
                <span>5.0</span>
              </span>
            </div>
            
            <h2
              id="reviews-heading"
              className="mt-3 font-display italic"
              style={{
                fontSize: 'clamp(2.2rem, 4vw, 3.25rem)',
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
              }}
            >
              Guest Experiences
            </h2>
          </div>

          <a
            href="https://www.google.com/search?q=Ayurvedic+Wellness+Centre+Brickfields+KL+reviews"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 border-b border-transparent pb-1 font-heading text-[10px] font-bold uppercase tracking-[0.2em] transition-colors hover:border-[#12372D]"
            style={{ color: TEXT_DARK }}
          >
            Read all on Google Reviews
          </a>
        </motion.div>

        {/* Marquee Section */}
        <div className="relative mt-12 w-full overflow-hidden sm:mt-16">
          {/* Fading Edges for Marquee */}
          <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-16 sm:w-32" style={{ background: `linear-gradient(to right, ${BG_LUXE}, transparent)` }} />
          <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-16 sm:w-32" style={{ background: `linear-gradient(to left, ${BG_LUXE}, transparent)` }} />

          <motion.div
            className="flex w-max gap-8 sm:gap-12"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {marqueeItems.map((review, i) => (
              <div
                key={`${review.id}-${i}`}
                className="flex w-[300px] shrink-0 flex-col justify-between sm:w-[380px]"
              >
                <div>
                  <div className="mb-5 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5" fill={GOLD} stroke="none" />
                    ))}
                  </div>
                  <blockquote
                    className="font-display italic"
                    style={{
                      fontSize: 'clamp(16px, 1.5vw, 19px)',
                      lineHeight: 1.6,
                      color: TEXT_MUTED,
                    }}
                  >
                    &quot;{review.text}&quot;
                  </blockquote>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: BORDER, color: GOLD }}>
                    <span className="font-heading text-xs font-bold">{review.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-heading text-[10px] font-bold uppercase tracking-[0.2em]">
                      {review.name}
                    </h3>
                    <p className="mt-0.5 font-display text-[11px] italic" style={{ color: TEXT_MUTED }}>
                      {review.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
