'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { wellnessFocusAreas } from '@/data/about'
import { fadeUp, staggerParent, inViewOnce } from '@/lib/motion'

const GOLD = '#B58A3B'
const GOLD_LIGHT = '#E4C384'

/**
 * Wellness Focus — a static two-column editorial menu of all eight
 * rituals at once, not a click-to-reveal index-plus-detail picker (that
 * interaction, and the giant background numeral that went with it, read
 * too much like the old site's therapy-picker pattern). Same dark
 * charcoal-green + gold surface as the rest of this page's dark sections.
 */
export default function WellnessFocus() {
  const items = wellnessFocusAreas

  return (
    <section
      aria-labelledby="wellness-heading"
      className="relative overflow-hidden text-cream"
      style={{ background: 'linear-gradient(160deg, #0B1F16 0%, #12372D 55%, #0A1A12 100%)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(880px 600px at 82% 0%, rgba(181, 138, 59,0.16), transparent 62%)',
            'radial-gradient(1080px 700px at 10% 100%, rgba(0, 107, 60,0.22), transparent 64%)',
          ].join(', '),
        }}
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent 4%, ${GOLD}70 50%, transparent 96%)` }} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 sm:px-8 md:py-10 lg:px-12">
        {/* Header — centered, matching this page's other section headers */}
        <motion.div variants={fadeUp(0)} initial="initial" whileInView="animate" viewport={inViewOnce} className="mx-auto max-w-xl text-center">
          <div className="flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8" style={{ backgroundColor: GOLD_LIGHT, opacity: 0.7 }} />
            <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.4em]" style={{ color: GOLD_LIGHT }}>
              The Wellness Atelier
            </span>
            <span aria-hidden className="h-px w-8" style={{ backgroundColor: GOLD_LIGHT, opacity: 0.7 }} />
          </div>
          <h2
            id="wellness-heading"
            className="mt-3 font-heading font-extrabold leading-[1.1] text-cream"
            style={{ fontSize: 'clamp(1.5rem, 2.4vw, 2rem)', letterSpacing: '-0.02em' }}
          >
            Therapies for every{' '}
            <span className="font-body italic font-medium" style={{ color: GOLD_LIGHT }}>
              stage of life.
            </span>
          </h2>
          <p className="mt-2 font-body text-[13px] italic leading-[1.5]" style={{ color: 'rgba(237,244,231,0.6)' }}>
            Eight living rituals — one for each season of the body.
          </p>
        </motion.div>

        {/* Menu — all eight, two columns, hairline-divided, no picker */}
        <motion.div
          variants={staggerParent(0.04, 0.1)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="mx-auto mt-6 grid max-w-5xl grid-cols-1 md:grid-cols-2 md:gap-x-10"
        >
          {items.map((area, i) => {
            const Icon = area.icon
            const isLeftCol = i % 2 === 0
            return (
              <motion.div
                key={area.id}
                variants={fadeUp(0)}
                className="flex items-start gap-3 border-t py-3"
                style={{ borderColor: 'rgba(181,138,59,0.22)' }}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: GOLD }} strokeWidth={1.6} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <h3 className="font-heading text-[13.5px] font-bold tracking-[-0.01em] text-cream">
                      {area.label}
                    </h3>
                    {area.highlighted && (
                      <span aria-hidden className="text-[9px]" style={{ color: GOLD_LIGHT }}>
                        {'★'}
                      </span>
                    )}
                    <span className="font-body text-[10px] italic" style={{ color: GOLD_LIGHT, letterSpacing: '0.06em' }}>
                      — {area.kicker}
                    </span>
                  </div>
                  <p className="mt-0.5 max-w-md font-body text-[12px] leading-[1.45]" style={{ color: 'rgba(237,244,231,0.55)' }}>
                    {area.body}
                  </p>
                </div>
                {/* Vertical hairline between columns on desktop */}
                {isLeftCol && <span aria-hidden className="hidden self-stretch md:ml-7 md:block md:w-px" style={{ backgroundColor: 'rgba(181,138,59,0.22)' }} />}
              </motion.div>
            )
          })}
        </motion.div>

        {/* Closing CTA */}
        <motion.div variants={fadeUp(0.1)} initial="initial" whileInView="animate" viewport={inViewOnce} className="mt-6 flex justify-center">
          <Link
            href="/treatments"
            className="group inline-flex items-center gap-2 border px-5 py-2.5 transition-[background-color,border-color] duration-500 hover:bg-white/5"
            style={{ borderColor: `${GOLD}90` }}
          >
            <span className="font-heading text-[10px] font-bold uppercase" style={{ color: GOLD_LIGHT, letterSpacing: '0.24em' }}>
              Explore All Treatments
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-1" style={{ color: GOLD_LIGHT }} strokeWidth={1.5} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
