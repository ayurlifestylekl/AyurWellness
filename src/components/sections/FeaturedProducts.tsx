'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeUp, staggerParent, inViewOnce } from '@/lib/motion'
import { featuredProducts } from '@/data/featuredProducts'
import type { FeaturedProduct, ProductBadge } from '@/types/content'

/* ── Palette — deep forest-black backdrop, gold foil accents, ivory cards ── */
const GOLD       = '#B58A3B'
const GOLD_LIGHT = '#E4C384'
const IVORY      = '#FFF9F2'
const CARD_INK   = '#006B3C'
/* the enhanced product photos share this exact warm-ivory studio backdrop —
   matching it on the card means the photo blends into the card with no seam */
const PHOTO_IVORY = '#F8EFE1'

const badgeStyles: Record<ProductBadge, { bg: string; color: string }> = {
  NEW:        { bg: '#75B843',                color: '#FFFFFF' },
  BESTSELLER: { bg: GOLD,                      color: '#FFFFFF' },
  SALE:       { bg: '#B58A3B',                 color: '#FFFFFF' },
  COMBO:      { bg: 'rgba(117,184,67,0.85)',   color: GOLD      },
}

export default function FeaturedProducts() {
  const [activeCategory, setActiveCategory] = useState<string>('All')

  const categories = useMemo(() => {
    const cats = Array.from(new Set(featuredProducts.map(p => p.category)))
    return ['All', ...cats]
  }, [])

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return featuredProducts
    return featuredProducts.filter(p => p.category === activeCategory)
  }, [activeCategory])

  return (
    <section
      id="curated-collection"
      aria-labelledby="collection-heading"
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0B1F16 0%, #12372D 55%, #0A1A12 100%)' }}
    >
      {/* atmospheric gold + rose glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(45% 55% at 88% 0%, rgba(181,138,59,0.22) 0%, transparent 62%), radial-gradient(45% 45% at 6% 100%, rgba(184,117,42,0.10) 0%, transparent 60%)',
        }}
      />
      {/* fine gold grain, screen-blended so it lifts off the dark surface */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-screen"
        style={{
          backgroundImage: 'radial-gradient(rgba(228,195,132,0.8) 1px, transparent 1px)',
          backgroundSize: '3px 3px',
        }}
      />

      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent 4%, ${GOLD}80 50%, transparent 96%)` }} />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 py-8 sm:px-10 lg:px-12 lg:py-10">

        {/* ── HEADER ── */}
        <motion.header
          variants={fadeUp(0)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-xl">
            <span className="font-heading text-[10px] font-medium uppercase tracking-[0.42em]" style={{ color: GOLD_LIGHT }}>
              Curated Collection
            </span>
            <h2
              id="collection-heading"
              className="mt-2 font-display"
              style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)', lineHeight: 1.04, color: IVORY, fontWeight: 400 }}
            >
              Our best{' '}
              <span
                className="italic"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD} 55%, ${GOLD_LIGHT})`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  textShadow: '0 3px 30px rgba(181,138,59,0.35)',
                }}
              >
                sellers
              </span>
            </h2>
            <p className="mt-2 max-w-md font-body text-[13px] font-light leading-[1.6]" style={{ color: 'rgba(237,244,231,0.6)' }}>
              Hand-blended in small batches, prescribed by our Vaidyas and bottled fresh at our apothecary.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 sm:justify-end">
            {categories.map((cat) => {
              const isActive = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="whitespace-nowrap rounded-full px-3.5 py-1.5 font-heading text-[10px] font-bold uppercase tracking-[0.18em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={
                    isActive
                      ? { backgroundColor: GOLD, color: '#0B1F16', border: `1px solid ${GOLD}`, boxShadow: `0 10px 26px -12px ${GOLD}bb` }
                      : { backgroundColor: 'rgba(237,244,231,0.05)', color: 'rgba(237,244,231,0.7)', border: `1px solid ${GOLD}40` }
                  }
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </motion.header>

        {/* ── PRODUCT ROW — all products, one row on desktop ── */}
        <motion.div
          variants={staggerParent(0.08, 0.05)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mt-7 lg:grid-cols-5 lg:gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}

function ProductCard({ product }: { product: FeaturedProduct }) {
  const badge = product.badge ? badgeStyles[product.badge] : null

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-2"
      style={{ backgroundColor: PHOTO_IVORY, boxShadow: '0 26px 50px -26px rgba(0,0,0,0.5)' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 32px 60px -22px rgba(0,0,0,0.55)' }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 26px 50px -26px rgba(0,0,0,0.5)' }}
    >
      {/* ── Photo — full-bleed, seamless into the card (same studio backdrop tone) ── */}
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
        />

        <span
          className="absolute left-3 top-3 rounded-full px-2 py-1 font-heading text-[8px] font-bold uppercase tracking-[0.16em] backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(255,249,242,0.82)', color: CARD_INK }}
        >
          {product.category}
        </span>

        {badge && product.badge && (
          <span
            className="absolute right-3 top-3 rounded-full px-2 py-1 font-heading text-[7.5px] font-bold uppercase tracking-[0.18em]"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {product.badge}
          </span>
        )}

        {/* bottom fade so the info panel below reads as one continuous surface */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-10"
          style={{ background: `linear-gradient(180deg, transparent, ${PHOTO_IVORY})` }}
        />
      </div>

      {/* ── INFO — same backdrop tone as the photo, no seam ── */}
      <div className="flex flex-grow flex-col justify-between px-3.5 pb-4 pt-2.5 sm:px-4">
        <div className="flex flex-col">
          <h3
            className="font-heading text-[13px] font-extrabold leading-tight sm:text-[14.5px]"
            style={{ color: CARD_INK, letterSpacing: '-0.005em' }}
          >
            {product.name}
          </h3>
          <p
            className="mt-1 font-display italic line-clamp-1"
            style={{ color: 'rgba(0,107,60,0.6)', fontSize: '11.5px' }}
          >
            {product.tagline}
          </p>
          <span aria-hidden className="mt-2.5 block h-px w-8 transition-[width] duration-500 group-hover:w-14" style={{ backgroundColor: GOLD }} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 sm:mt-3.5">
          <span
            className="font-heading text-[8.5px] font-semibold uppercase tracking-[0.14em] sm:text-[9px]"
            style={{ color: 'rgba(0,107,60,0.42)' }}
          >
            Coming Soon
          </span>
          <button
            type="button"
            aria-label={`Notify me when ${product.name} is available`}
            className="rounded-full px-3.5 py-1.5 font-heading text-[8.5px] font-bold uppercase tracking-[0.16em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:px-4 sm:py-2 sm:text-[9.5px]"
            style={{ backgroundColor: CARD_INK, color: '#FFFFFF' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#004d2c'
              e.currentTarget.style.boxShadow = `0 10px 22px -10px ${CARD_INK}bb`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = CARD_INK
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Notify Me
          </button>
        </div>
      </div>
    </article>
  )
}
