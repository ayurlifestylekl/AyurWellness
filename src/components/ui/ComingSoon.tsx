'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { BotanicalMandala, FloatingLeaf } from '@/components/ui/Decorations'
import { fadeUp, staggerParent } from '@/lib/motion'

interface ComingSoonProps {
  /** Short label shown above the headline (e.g. "Treatments") */
  eyebrow: string
  /** Main headline */
  title: string
  /** Optional supporting line */
  subtitle?: string
  /** Where the primary back/CTA button should link */
  primaryHref?: string
  /** Label for the primary button */
  primaryLabel?: string
}

/**
 * Premium "Coming Soon" placeholder that matches the brand language.
 * Used as a stub for routes that haven't been built yet.
 */
export default function ComingSoon({
  eyebrow,
  title,
  subtitle = 'This page is being crafted with the same care as the rest of our practice. Please check back shortly.',
  primaryHref = '/',
  primaryLabel = 'Back to Home',
}: ComingSoonProps) {
  return (
    <section
      aria-labelledby="coming-soon-heading"
      className="relative flex min-h-[calc(100vh-200px)] items-center overflow-hidden bg-[#EDF4E7]"
    >
      {/* Decorative mandalas */}
      <div className="pointer-events-none absolute -left-24 -top-24 hidden h-[420px] w-[420px] md:block">
        <BotanicalMandala opacity={0.18} />
      </div>
      <div className="pointer-events-none absolute -bottom-32 -right-24 hidden h-[460px] w-[460px] md:block">
        <BotanicalMandala opacity={0.16} />
      </div>

      {/* Floating leaves */}
      <FloatingLeaf
        className="pointer-events-none absolute"
        style={{ left: '8%', top: '18%', width: 38, height: 50, transform: 'rotate(-22deg)' }}
        opacity={0.2}
      />
      <FloatingLeaf
        className="pointer-events-none absolute"
        style={{ right: '10%', bottom: '20%', width: 42, height: 56, transform: 'rotate(18deg)' }}
        opacity={0.18}
      />

      {/* Soft gold radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 640,
          height: 640,
          background:
            'radial-gradient(circle at center, rgba(181, 138, 59,0.22) 0%, rgba(181, 138, 59,0.08) 30%, transparent 65%)',
          filter: 'blur(28px)',
        }}
      />

      <motion.div
        variants={staggerParent(0.12, 0.05)}
        initial="initial"
        animate="animate"
        className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center sm:px-8 md:py-32 lg:px-12"
      >
        {/* Coming-soon badge */}
        <motion.span
          variants={fadeUp(0)}
          className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-white/60 px-4 py-1.5 backdrop-blur"
        >
          <Sparkles className="h-3 w-3 text-accent" strokeWidth={2.4} />
          <span className="font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            Coming Soon
          </span>
        </motion.span>

        <motion.span
          variants={fadeUp(0)}
          className="font-heading text-[11px] font-bold uppercase tracking-[0.32em] text-accent"
        >
          {eyebrow}
        </motion.span>

        <motion.h1
          id="coming-soon-heading"
          variants={fadeUp(0)}
          className="font-heading text-balance text-4xl font-extrabold leading-[1.05] text-primary sm:text-5xl md:text-[54px]"
        >
          {title}
        </motion.h1>

        <motion.p
          variants={fadeUp(0)}
          className="max-w-xl font-body text-[16px] leading-relaxed text-dark/70 md:text-[17px]"
        >
          {subtitle}
        </motion.p>

        <motion.div
          variants={fadeUp(0)}
          className="mt-4 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            href={primaryHref}
            className="group relative inline-flex min-h-[44px] items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-7 py-3 font-heading text-[12px] font-bold uppercase tracking-[0.15em] text-white shadow-[0_18px_40px_-18px_rgba(18,55,45,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#12372D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            {primaryLabel}
          </Link>
          <Link
            href="https://wa.me/601163393436"
            className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-primary/30 bg-white/40 px-7 py-3 font-heading text-[12px] font-bold uppercase tracking-[0.15em] text-primary backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            WhatsApp Us Instead
          </Link>
        </motion.div>

        {/* Trust row */}
        <motion.div
          variants={fadeUp(0)}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-dark/55"
        >
          <span>Brickfields, KL</span>
          <span className="h-1 w-1 rounded-full bg-accent/70" />
          <span>our Vaidyas</span>
        </motion.div>
      </motion.div>
    </section>
  )
}
