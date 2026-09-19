'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { EASE_OUT_PREMIUM } from '@/lib/motion'
import NocturneFrame from './atmosphere/NocturneFrame'
import BrandSigil from './atmosphere/BrandSigil'

interface ProductsHeroManifestoProps {
  productCount: number
}

/* ── motion helpers (on-mount, not in-view) ────────────── */
const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: EASE_OUT_PREMIUM },
})

/**
 * Products Hero — Cinematic Editorial Spread.
 *
 * Dark nocturne-green background echoing the AboutHero palette, composed
 * asymmetrically (58/42 text/image split) as an opening spread of an
 * editorial lookbook. The right-side photograph is wrapped in the same
 * NocturneFrame recipe used by product cards below — so the hero acts
 * as the first, largest photographic plate before the grid.
 *
 * The component replaces the previous type-only "Manifesto" hero while
 * keeping the same export name + prop shape so the page route is
 * unchanged.
 */
export default function ProductsHeroManifesto({ productCount }: ProductsHeroManifestoProps) {
  return (
    <section
      aria-labelledby="products-hero-heading"
      className="relative overflow-hidden"
    >
      {/* ── Background layers ───────────────────────────── */}
      {/* Base depth gradient */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 25%, #12372D 0%, #12372D 75%)',
        }}
      />
      {/* Dark tint to unify the layers */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(18, 55, 45,0.25)' }}
      />
      {/* Radial warm gold — right-side light source */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 900px 700px at 72% 40%, rgba(181, 138, 59,0.18) 0%, transparent 60%)',
        }}
      />
      {/* Radial sage wash — bottom-left depth */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 700px 500px at 18% 88%, rgba(20, 148, 71,0.14) 0%, transparent 60%)',
        }}
      />
      {/* Film grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          mixBlendMode: 'screen',
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* Project's existing dark grain class (already tuned) */}
      <div className="grain-overlay-dark pointer-events-none absolute inset-0" aria-hidden />

      {/* ── Content ─────────────────────────────────────── */}
      <div
        className="relative mx-auto flex w-full max-w-7xl flex-col px-6 pb-14 pt-16 sm:px-8 md:min-h-[78vh] md:pb-20 md:pt-24 lg:px-12"
      >
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[58fr_42fr] md:gap-14 lg:gap-20">
          {/* ── LEFT — editorial text block ─────────────── */}
          <div className="flex flex-col">
            {/* Sigil */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0, ease: EASE_OUT_PREMIUM }}
            >
              <BrandSigil size={36} />
            </motion.div>

            {/* Tiny chapter caps */}
            <motion.span
              {...fadeIn(0.2)}
              className="mt-5 font-heading text-[10px] font-bold uppercase tracking-[0.4em] text-accent/80"
            >
              Vol II · Ayurvedic Apothecary
            </motion.span>

            {/* Short gold hairline */}
            <motion.span
              aria-hidden
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
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
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: EASE_OUT_PREMIUM }}
              className="mt-7 font-display text-cream"
              style={{ lineHeight: 0.98, letterSpacing: '-0.03em', fontWeight: 400 }}
            >
              <span
                className="block"
                style={{
                  fontSize: 'clamp(2.4rem, 4.5vw, 4rem)',
                  color: '#FFF9F2',
                }}
              >
                Prescribed.
              </span>
              <span
                className="block italic text-accent"
                style={{
                  fontSize: 'clamp(3.2rem, 7vw, 6rem)',
                  marginTop: '-0.05em',
                }}
              >
                Not perfumed.
              </span>
            </motion.h1>

            {/* Voiced lede */}
            <motion.p
              {...fadeIn(0.7)}
              className="mt-7 max-w-[44ch] font-display italic"
              style={{
                fontSize: '16px',
                lineHeight: 1.7,
                color: 'rgba(255, 249, 242,0.62)',
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
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.9, ease: EASE_OUT_PREMIUM }}
              className="mt-8 block h-px w-16 origin-left"
              style={{
                background:
                  'linear-gradient(to right, rgba(181, 138, 59,0.8), rgba(181, 138, 59,0.15))',
              }}
            />

            {/* Byline */}
            <motion.p
              {...fadeIn(1.0)}
              className="mt-3 font-heading text-[10px] font-bold uppercase tracking-[0.28em] text-accent/70"
            >
              — our Vaidyas
            </motion.p>

            {/* Meta caption */}
            <motion.div
              {...fadeIn(1.15)}
              className="mt-10 flex items-center gap-4"
            >
              <span className="font-heading text-[10px] font-bold uppercase tracking-[0.35em] text-cream/45">
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

          {/* ── RIGHT — photographic plate ────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, ease: EASE_OUT_PREMIUM }}
            className="relative"
            style={{ transformOrigin: 'center' }}
          >
            <NocturneFrame
              src="/hero-tray.png"
              alt="A warm-lit tray of hand-blended traditional Ayurvedic oils, herbs and churnas"
              sizes="(max-width: 768px) 100vw, 42vw"
              priority
              aspectRatio="3 / 4"
              intensity="soft"
              className="shadow-luxe"
            >
              {/* Tiny corner mark inside the image — editorial "plate" caption */}
              <span
                className="absolute bottom-4 left-4 font-heading text-[9px] font-bold uppercase tracking-[0.35em] text-accent/80"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
              >
                Plate I · The Tray
              </span>
            </NocturneFrame>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
