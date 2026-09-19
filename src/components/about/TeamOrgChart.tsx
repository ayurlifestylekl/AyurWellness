'use client'

import { motion } from 'framer-motion'
import { fadeUp, staggerParent, inViewOnce } from '@/lib/motion'

/* ── Palette ───────────────────────────────────────────── */
const BURGUNDY = '#006B3C'
const GOLD     = '#B58A3B'
const GOLD_LN  = 'rgba(196,154,58,0.7)' // connector lines
const CREAM    = '#FFF9F2'
const CREAM_2  = '#FFF9F2'
const BLUSH    = '#FFF9F2'

const therapists = [1, 2, 3, 4, 5, 6, 7, 8]

/** One chart node card. `tone` = 'founder' (burgundy) | 'plain' (white). */
function Node({
  role,
  name,
  tone = 'plain',
}: {
  role: string
  /** Optional. When omitted, the role is shown on its own as the card label. */
  name?: string
  tone?: 'founder' | 'plain'
}) {
  const founder = tone === 'founder'
  return (
    <div
      className="inline-flex flex-col items-center rounded-xl px-5 py-2.5 text-center shadow-[0_8px_22px_-12px_rgba(0,107,60,0.30)]"
      style={{
        backgroundColor: founder ? BURGUNDY : '#FFFFFF',
        border: `1px solid ${founder ? GOLD : 'rgba(181,138,59,0.45)'}`,
      }}
    >
      {name ? (
        <>
          <span
            className="font-heading text-[9px] font-bold uppercase tracking-[0.22em]"
            style={{ color: founder ? '#B58A3B' : '#B58A3B' }}
          >
            {role}
          </span>
          <span
            className="font-display text-[15px] font-semibold leading-tight sm:text-base"
            style={{ color: founder ? '#FFF9F2' : BURGUNDY }}
          >
            {name}
          </span>
        </>
      ) : (
        <span
          className="font-display text-[15px] font-semibold leading-tight sm:text-base"
          style={{ color: founder ? '#FFF9F2' : BURGUNDY }}
        >
          {role}
        </span>
      )}
    </div>
  )
}

/** Vertical gold connector. */
function VConn({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`mx-auto block w-px ${className}`}
      style={{ backgroundColor: GOLD_LN, height: '22px' }}
    />
  )
}

/**
 * Organisation chart — replaces the old "Medical Authority" split.
 * Connected-tree layout (gold connectors, white cards on cream).
 * Desktop shows the full tree; on small screens it stacks gracefully.
 */
export default function TeamOrgChart() {
  return (
    <section
      aria-labelledby="team-heading"
      className="relative overflow-hidden"
      style={{ background: `radial-gradient(120% 100% at 50% 0%, ${CREAM}, ${CREAM_2})` }}
    >
      {/* gold hairlines top/bottom */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent 4%, rgba(181,138,59,0.45) 50%, transparent 96%)' }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:px-10 sm:py-20 lg:px-12">
        {/* Header */}
        <motion.header
          variants={fadeUp(0)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="flex flex-col items-center text-center"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-10" style={{ backgroundColor: GOLD, opacity: 0.55 }} aria-hidden />
            <span className="font-heading text-[11px] font-bold uppercase tracking-[0.34em]" style={{ color: '#B58A3B' }}>
              Our People
            </span>
            <span className="h-px w-10" style={{ backgroundColor: GOLD, opacity: 0.55 }} aria-hidden />
          </div>
          <h2 id="team-heading" className="mt-4 flex flex-col items-center">
            <span className="font-heading font-extrabold tracking-tight" style={{ color: BURGUNDY, fontSize: 'clamp(2rem, 4vw, 3.25rem)', lineHeight: 1.02 }}>
              The Team Behind
            </span>
            <span className="-mt-1 font-display italic" style={{ color: GOLD, fontSize: 'clamp(2.25rem, 4.6vw, 3.75rem)', lineHeight: 1 }}>
              Your Care
            </span>
          </h2>
        </motion.header>

        {/* Chart */}
        <motion.div
          variants={staggerParent(0.08, 0.1)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="mt-12 flex flex-col items-center"
        >
          {/* Founder */}
          <motion.div variants={fadeUp(0)}>
            <Node tone="founder" role="Founder" />
          </motion.div>

          <motion.div variants={fadeUp(0)}><VConn /></motion.div>

          {/* Manager */}
          <motion.div variants={fadeUp(0)}>
            <Node role="Centre Manager" name="Manager" />
          </motion.div>

          <motion.div variants={fadeUp(0)}><VConn /></motion.div>

          {/* horizontal bar to the trio (desktop) */}
          <div aria-hidden className="hidden h-px w-[72%] lg:block" style={{ backgroundColor: GOLD_LN }} />

          {/* Trio: Admin · Dr 1 · Dr 2 */}
          <motion.div variants={fadeUp(0)} className="flex flex-col items-stretch gap-3 lg:mt-0 lg:flex-row lg:items-start lg:justify-center lg:gap-16">
            {[
              { role: 'Administration', name: 'Admin' },
              { role: 'Lead Vaidya' },
              { role: 'Consulting Vaidya' },
            ].map((n) => (
              <div key={n.role} className="flex flex-col items-center">
                <VConn className="hidden lg:block" />
                <Node role={n.role} name={n.name} />
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp(0)}><VConn /></motion.div>

          {/* horizontal bar to therapists (desktop) */}
          <div aria-hidden className="hidden h-px w-[94%] lg:block" style={{ backgroundColor: GOLD_LN }} />

          {/* 8 Therapists */}
          <motion.div
            variants={fadeUp(0)}
            className="mt-3 grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4 lg:mt-0 lg:grid-cols-8 lg:gap-3"
          >
            {therapists.map((t) => (
              <div key={t} className="flex flex-col items-center">
                <span aria-hidden className="hidden w-px lg:block" style={{ backgroundColor: GOLD_LN, height: '14px' }} />
                <div
                  className="w-full rounded-lg px-2 py-2.5 text-center font-display text-[13px] font-semibold"
                  style={{ backgroundColor: BLUSH, border: '1px solid rgba(0,107,60,0.18)', color: BURGUNDY }}
                >
                  Therapist {t}
                </div>
              </div>
            ))}
          </motion.div>

          <motion.p
            variants={fadeUp(0)}
            className="mt-5 font-heading text-[10px] font-semibold uppercase tracking-[0.26em]"
            style={{ color: '#B58A3B' }}
          >
            Trained traditional Ayurveda Therapists
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
