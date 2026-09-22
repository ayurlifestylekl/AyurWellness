'use client'

import { motion } from 'framer-motion'
import { Leaf } from 'lucide-react'
import { fadeUp, staggerParent, inViewOnce } from '@/lib/motion'

/* ── No boxes, no connector lines — an editorial masthead instead of an
   org chart. Founder spotlighted in a magazine-style column on the left;
   the rest of the team as a clean typographic roster on the right,
   divided by hairlines. Same sage-green surface as Reviews (BG_LUXE). */
const BG_LUXE = '#DCEEDC'
const INK = '#006B3C'
const INK_DEEP = '#12372D'
const GOLD = '#B58A3B'

const roster = [
  { role: 'Centre Manager', kicker: 'Operations' },
  { role: 'Lead Vaidya', kicker: 'Clinical Care' },
  { role: 'Consulting Vaidya', kicker: 'Clinical Care' },
  { role: 'Administration', kicker: 'Front of House' },
]

export default function TeamOrgChart() {
  return (
    <section aria-labelledby="team-heading" className="relative overflow-hidden" style={{ backgroundColor: BG_LUXE }}>
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 50% at 50% 0%, rgba(181,138,59,0.1) 0%, transparent 62%)' }} />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent 4%, ${GOLD}80 50%, transparent 96%)` }} />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-10 sm:px-8 lg:py-14">
        {/* Header */}
        <motion.div variants={fadeUp(0)} initial="initial" whileInView="animate" viewport={inViewOnce} className="text-center">
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.4em]" style={{ color: GOLD }}>
            Our People
          </span>
          <h2
            id="team-heading"
            className="mt-2 font-heading font-extrabold leading-[1.1]"
            style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2.25rem)', letterSpacing: '-0.02em', color: INK_DEEP }}
          >
            The Team Behind <span className="font-display italic" style={{ color: GOLD }}>Your Care</span>
          </h2>
        </motion.div>

        {/* Masthead — founder spotlight + roster, magazine columns, no boxes */}
        <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-[0.85fr_1px_1.15fr] lg:gap-12">
          {/* Founder spotlight */}
          <motion.div
            variants={fadeUp(0)}
            initial="initial"
            whileInView="animate"
            viewport={inViewOnce}
            className="flex flex-col items-center text-center lg:items-start lg:text-left"
          >
            <svg aria-hidden viewBox="0 0 40 30" className="h-7 w-9" fill="none">
              <path d="M0 30V16.5C0 7.5 5.5 1.5 14 0L15.5 4C10 5.5 7 9 7 14H14V30H0Z" fill={GOLD} fillOpacity={0.5} />
              <path d="M22 30V16.5C22 7.5 27.5 1.5 36 0L37.5 4C32 5.5 29 9 29 14H36V30H22Z" fill={GOLD} fillOpacity={0.5} />
            </svg>
            <span className="mt-3 font-heading text-[10.5px] font-bold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
              Founder
            </span>
            <h3 className="mt-1 font-display italic" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: INK_DEEP, lineHeight: 1.05 }}>
              Founder
            </h3>
            <p className="mt-3 max-w-xs font-body text-[13.5px] leading-[1.65]" style={{ color: 'rgba(0,42,25,0.62)' }}>
              Guiding the centre&apos;s mission, standards, and every protocol we practice — rooted in classical Ayurvedic training.
            </p>
          </motion.div>

          {/* Divider */}
          <div aria-hidden className="hidden lg:block" style={{ backgroundColor: 'rgba(181,138,59,0.35)' }} />

          {/* Roster list */}
          <motion.div
            variants={staggerParent(0.06, 0.1)}
            initial="initial"
            whileInView="animate"
            viewport={inViewOnce}
            className="flex flex-col"
          >
            {roster.map((r, i) => (
              <motion.div
                key={r.role}
                variants={fadeUp(0)}
                className={`flex items-baseline justify-between gap-4 py-4 ${i > 0 ? 'border-t' : ''}`}
                style={{ borderColor: 'rgba(181,138,59,0.25)' }}
              >
                <span className="font-display font-semibold" style={{ fontSize: '18px', color: INK_DEEP }}>
                  {r.role}
                </span>
                <span className="whitespace-nowrap font-heading text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                  {r.kicker}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Closing line — therapist collective, no boxes */}
        <motion.div
          variants={fadeUp(0.15)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="mt-10 flex items-center justify-center gap-2.5 border-t pt-6 text-center lg:mt-12"
          style={{ borderColor: 'rgba(181,138,59,0.3)' }}
        >
          <Leaf className="h-3.5 w-3.5" style={{ color: GOLD }} strokeWidth={1.7} />
          <p className="font-body text-[13px] italic" style={{ color: INK }}>
            Backed by 8 KKM-registered therapists, trained in classical Ayurvedic massage and Panchakarma protocols.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
