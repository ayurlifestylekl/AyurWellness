'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { EASE_OUT_PREMIUM } from '@/lib/motion'
import NocturneFrame from '../atmosphere/NocturneFrame'
import type { Product } from '@/types/content'

/**
 * Detail page main image. Uses the same NocturneFrame recipe as the
 * listing cards so the transition from listing → detail feels continuous.
 */
export default function ProductGallery({ product }: { product: Product }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.03 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.0, ease: EASE_OUT_PREMIUM }}
      className="relative"
    >
      <NocturneFrame
        src={product.image}
        alt={`${product.name} — ${product.tagline}`}
        sizes="(max-width: 1024px) 100vw, 55vw"
        priority
        aspectRatio="4 / 5"
        className="rounded-[2px]"
      >
        <span
          className="absolute left-4 top-4 rounded-sm bg-nocturne-elev/70 px-2.5 py-1 font-heading text-[9px] font-bold uppercase tracking-[0.28em] text-accent backdrop-blur"
        >
          SKU · {product.sku}
        </span>
      </NocturneFrame>
    </motion.div>
  )
}
