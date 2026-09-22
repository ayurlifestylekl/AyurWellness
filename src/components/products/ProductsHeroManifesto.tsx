'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_OUT_PREMIUM } from '@/lib/motion'
import BrandSigil from './atmosphere/BrandSigil'

interface ProductsHeroManifestoProps {
  productCount: number
}

/* ── motion helpers (fire once `revealed` flips true) ────── */
const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: EASE_OUT_PREMIUM },
})

/**
 * Products Hero — "Play, then reveal."
 *
 * A full-bleed video opens the page with nothing else on screen. Once it
 * finishes (it doesn't loop, so it holds on its last frame), a blurred
 * dark scrim fades in behind the text column and the headline/copy fade
 * in over it — the video IS the hero, not a backdrop behind static copy
 * from the first frame.
 */
export default function ProductsHeroManifesto({ productCount }: ProductsHeroManifestoProps) {
  const [revealed, setRevealed] = useState(false)

  return (
    <section
      aria-labelledby="products-hero-heading"
      className="relative flex h-[calc(100svh-97px)] min-h-[560px] w-full flex-col overflow-hidden bg-[#0B1F16]"
    >
      {/* ── Full-bleed video — plays once, freezes on its last frame ── */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        onEnded={() => setRevealed(true)}
      >
        <source src="/products-hero.mp4" type="video/mp4" />
      </video>

      {/* Always-on light vignette so the video isn't full-strength raw footage */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 45%, rgba(11,31,22,0.55) 100%)' }}
      />

      {/* ── Blurred reveal scrim — fades in only once the video ends ── */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.1, ease: EASE_OUT_PREMIUM }}
            className="pointer-events-none absolute inset-y-0 left-0 w-full backdrop-blur-xl md:w-[62%]"
            style={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.12) 70%, rgba(0,0,0,0) 100%)',
              maskImage: 'linear-gradient(90deg, black 0%, black 75%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(90deg, black 0%, black 75%, transparent 100%)',
            }}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* ── Content — hidden until the video ends, then fades in ─── */}
      <div
        className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 py-12 sm:px-8 lg:px-12"
      >
        <div
          className="max-w-xl transition-opacity duration-700"
          style={{ opacity: revealed ? 1 : 0, pointerEvents: revealed ? 'auto' : 'none' }}
        >
          {/* Sigil */}
          <motion.div {...(revealed ? fadeIn(0) : {})}>
            <BrandSigil size={36} />
          </motion.div>

          {/* Tiny chapter caps */}
          <motion.span
            {...(revealed ? fadeIn(0.2) : {})}
            className="mt-5 block font-heading text-[10px] font-bold uppercase tracking-[0.4em] text-accent"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.45)' }}
          >
            Vol II · Ayurvedic Apothecary
          </motion.span>

          {/* Short gold hairline */}
          <motion.span
            aria-hidden
            initial={{ scaleX: 0, opacity: 0 }}
            animate={revealed ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.4, ease: EASE_OUT_PREMIUM }}
            className="mt-4 block h-px w-10 origin-left"
            style={{
              background:
                'linear-gradient(to right, rgba(181, 138, 59,0.9), rgba(181, 138, 59,0.2))',
            }}
          />

          {/* Multi-scale headline */}
          <motion.h1
            id="products-hero-heading"
            initial={{ opacity: 0, y: 24 }}
            animate={revealed ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.5, ease: EASE_OUT_PREMIUM }}
            className="mt-7 font-display text-cream"
            style={{ lineHeight: 0.98, letterSpacing: '-0.03em', fontWeight: 400 }}
          >
            <span
              className="block"
              style={{
                fontSize: 'clamp(2.4rem, 4.5vw, 4rem)',
                color: '#FFF9F2',
                textShadow: '0 4px 24px rgba(0,0,0,0.5)',
              }}
            >
              Prescribed.
            </span>
            <span
              className="block italic text-accent"
              style={{
                fontSize: 'clamp(3.2rem, 7vw, 6rem)',
                marginTop: '-0.05em',
                textShadow: '0 4px 24px rgba(0,0,0,0.5)',
              }}
            >
              Not perfumed.
            </span>
          </motion.h1>

          {/* Voiced lede */}
          <motion.p
            {...(revealed ? fadeIn(0.7) : {})}
            className="mt-7 max-w-[44ch] font-display italic"
            style={{
              fontSize: '16px',
              lineHeight: 1.7,
              color: 'rgba(255, 249, 242,0.85)',
              textShadow: '0 2px 10px rgba(0,0,0,0.45)',
            }}
          >
            Every oil, churna and wellness kit in this index is prescribed
            from a classical Ayurvedic text. Hand-blended in small batches —
            never perfumed, never rushed.
          </motion.p>

          {/* Second gold hairline */}
          <motion.span
            aria-hidden
            initial={{ scaleX: 0, opacity: 0 }}
            animate={revealed ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.9, ease: EASE_OUT_PREMIUM }}
            className="mt-8 block h-px w-16 origin-left"
            style={{
              background:
                'linear-gradient(to right, rgba(181, 138, 59,0.8), rgba(181, 138, 59,0.15))',
            }}
          />

          {/* Byline */}
          <motion.p
            {...(revealed ? fadeIn(1.0) : {})}
            className="mt-3 font-heading text-[10px] font-bold uppercase tracking-[0.28em] text-accent"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.45)' }}
          >
            — our Vaidyas
          </motion.p>

          {/* Meta caption */}
          <motion.div
            {...(revealed ? fadeIn(1.15) : {})}
            className="mt-10 flex items-center gap-4"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.45)' }}
          >
            <span className="font-heading text-[10px] font-bold uppercase tracking-[0.35em] text-cream/80">
              {productCount} Formulae
            </span>
            <span aria-hidden className="h-px w-8 bg-accent/50" />
            <Link
              href="#products"
              className="inline-flex items-center gap-1.5 font-heading text-[10px] font-bold uppercase tracking-[0.35em] text-accent transition-colors duration-300 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-nocturne"
            >
              Begin Reading ↓
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
