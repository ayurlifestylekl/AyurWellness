'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { staggerParent, inViewOnce, fadeUp } from '@/lib/motion'
import type { Product } from '@/types/content'
import ProductPlateCard from '../ProductPlateCard'

export default function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null
  return (
    <section aria-labelledby="related-heading" className="mt-20">
      <div className="mb-8 flex items-center gap-4">
        <span
          aria-hidden
          className="h-px flex-1"
          style={{ background: 'linear-gradient(to right, rgba(181, 138, 59,0.6), rgba(181, 138, 59,0.1), transparent)' }}
        />
        <h2
          id="related-heading"
          className="font-display italic text-primary"
          style={{ fontSize: '24px', fontWeight: 400 }}
        >
          Read together.
        </h2>
        <span
          aria-hidden
          className="h-px flex-1"
          style={{ background: 'linear-gradient(to left, rgba(181, 138, 59,0.6), rgba(181, 138, 59,0.1), transparent)' }}
        />
      </div>
      <motion.div
        variants={staggerParent(0.06, 0.04)}
        initial="initial"
        whileInView="animate"
        viewport={inViewOnce}
        className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3"
      >
        {products.map((p) => (
          <motion.div key={p.id} variants={fadeUp(0)}>
            <ProductPlateCard product={p} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
