'use client'

import { motion } from 'framer-motion'

import CategoryBox from '@/components/treatments/CategoryBox'
import { staggerParent, inViewOnce } from '@/lib/motion'
import type { TreatmentCategory } from '@/types/treatments'

interface CategoryGridProps {
  categories: TreatmentCategory[]
}

const diamondPattern = {
  backgroundImage: `
    radial-gradient(circle, rgba(0,107,60,0.028) 1px, transparent 1px),
    radial-gradient(circle, rgba(0,107,60,0.028) 1px, transparent 1px)
  `,
  backgroundSize: '32px 32px',
  backgroundPosition: '0 0, 16px 16px',
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section
      id="category-grid"
      aria-labelledby="categories-heading"
      className="relative overflow-hidden bg-cream"
    >
      <div className="pointer-events-none absolute inset-0" style={diamondPattern} aria-hidden />

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-8 md:py-28 lg:px-12">
        <div className="mb-12 max-w-2xl">
          <div className="font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
            The Catalogue
          </div>
          <h2
            id="categories-heading"
            className="mt-3 font-heading text-[2rem] font-extrabold leading-tight tracking-[-0.02em] text-primary sm:text-[2.4rem]"
          >
            Therapy categories
          </h2>
          <div
            className="mt-4 h-px w-20"
            style={{
              background:
                'linear-gradient(to right, rgba(181, 138, 59,0.6), transparent)',
            }}
            aria-hidden
          />
        </div>

        {categories.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-8 py-20 text-center">
            <span
              aria-hidden
              className="h-2 w-2 rounded-full bg-accent shadow-[0_0_0_5px_rgba(181, 138, 59,0.18)]"
            />
            <p className="mt-6 font-body text-[20px] italic leading-[1.3] text-primary">
              Catalogue in preparation.
            </p>
            <p className="mt-3 font-heading text-[10.5px] font-semibold uppercase tracking-[0.24em] text-dark/40">
              Awaiting category entries from the Centre
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerParent(0.06, 0.04)}
            initial="initial"
            whileInView="animate"
            viewport={inViewOnce}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {categories.map((cat, i) => (
              <CategoryBox key={cat._id} category={cat} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}
