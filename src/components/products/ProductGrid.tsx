'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { staggerParent, inViewOnce } from '@/lib/motion'
import type { Product } from '@/types/content'
import ProductPlateCard from './ProductPlateCard'
import BotanicalSprig from './atmosphere/BotanicalSprig'

interface ProductGridProps {
  products: Product[]
  /** Kept for API parity — grid header reports the count now. */
  total: number
  onClearFilters: () => void
}

export default function ProductGrid({ products, onClearFilters }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center px-6 py-24 text-center">
        <BotanicalSprig
          color="#149447"
          opacity={0.1}
          className="pointer-events-none absolute bottom-0 left-1/2 h-[260px] w-[180px] -translate-x-1/2"
        />
        <h3
          className="relative font-display italic text-primary"
          style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 400 }}
        >
          No formulae match.
        </h3>
        <p className="relative mt-4 max-w-sm font-body text-[14px] leading-[1.7] text-dark/55">
          Try clearing a filter or searching a different term.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="relative mt-6 rounded-full border border-accent/50 bg-transparent px-6 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-primary transition-colors duration-300 hover:border-accent hover:bg-accent hover:text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 active:scale-[0.97]"
        >
          Clear all filters
        </button>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerParent(0.06, 0.05)}
      initial="initial"
      whileInView="animate"
      viewport={inViewOnce}
      className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3"
    >
      {products.map((p) => (
        <ProductPlateCard key={p.id} product={p} />
      ))}
    </motion.div>
  )
}
