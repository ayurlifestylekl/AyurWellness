'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { fadeUp, staggerParent, inViewOnce } from '@/lib/motion'
import { categories } from '@/data/categories'

/**
 * Tightly packed, dense editorial grid.
 * Eliminates excessive empty space and gaps for a richer, continuous look.
 */
export default function ShopByCategory() {
  return (
    <section
      id="shop-by-category"
      aria-labelledby="category-heading"
      className="relative bg-[#EDF4E7] py-12 lg:py-20"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {/* Header - Tightened margins */}
        <motion.div
          variants={fadeUp(0)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="mb-8 flex flex-col items-center text-center lg:mb-12"
        >
          <span className="font-heading text-[10px] font-bold uppercase tracking-[0.4em] text-accent">
            Our Apothecary
          </span>
          <h2
            id="category-heading"
            className="mt-3 font-heading text-[clamp(2.2rem,3vw,3rem)] font-extrabold leading-[1.05] tracking-tight text-primary"
          >
            Shop by Concern
          </h2>
          <div className="mt-5 h-[1px] w-12 bg-accent/30" aria-hidden />
        </motion.div>

        {/* ── TIGHT CATEGORY GRID ── */}
        <motion.div
          variants={staggerParent(0.05, 0.1)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-6 snap-x snap-mandatory sm:mx-0 sm:gap-3 sm:px-0 lg:grid lg:grid-cols-4 lg:gap-4 xl:gap-5 lg:pb-0"
        >
          {categories.map((cat) => (
            <motion.div
              key={cat.slug}
              variants={fadeUp(0)}
              className="w-[240px] flex-shrink-0 snap-start sm:w-[280px] lg:w-auto"
            >
              <Link
                href={cat.href}
                aria-label={`Shop ${cat.label}`}
                className="group relative flex aspect-square w-full flex-col justify-end overflow-hidden rounded-xl bg-cream shadow-sm transition-all duration-500 ease-out hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:aspect-[4/5]"
              >
                {/* Image */}
                <div className="absolute inset-0 transition-transform duration-[1.5s] ease-out group-hover:scale-[1.03]">
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    sizes="(max-width: 640px) 240px, (max-width: 1024px) 280px, 25vw"
                    className="object-cover object-center"
                  />
                </div>

                {/* Dark Vignette to make text pop */}
                <div
                  className="absolute inset-0 mix-blend-multiply opacity-40 transition-opacity duration-500 group-hover:opacity-60"
                  style={{ backgroundColor: 'rgba(18, 55, 45,0.8)' }}
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Text Content */}
                <div className="relative z-10 flex items-end justify-between p-5 lg:p-6">
                  <div className="flex flex-col">
                    <span className="font-heading text-[18px] font-bold tracking-wide text-white lg:text-[22px]">
                      {cat.label}
                    </span>
                    {/* Animated Gold Underline */}
                    <span
                      className="mt-2 block h-[2px] w-8 bg-accent transition-all duration-500 ease-out group-hover:w-full"
                      aria-hidden
                    />
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all duration-300 group-hover:bg-accent">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* ── TIGHT PROMO BANNER ── */}
        <motion.div
          variants={fadeUp(0.1)}
          initial="initial"
          whileInView="animate"
          viewport={inViewOnce}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-y border-primary/10 py-5 text-center lg:mt-16 lg:py-6"
        >
          <span className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
            Free shipping over RM150
          </span>
          <span className="hidden h-3 w-px bg-primary/20 sm:block" />
          <span className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
            First-time 10% off:{' '}
            <span className="bg-accent/15 px-2 py-0.5 text-accent">
              WELCOME10
            </span>
          </span>
          <span className="hidden h-3 w-px bg-primary/20 md:block" />
          <span className="font-heading text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
            Bundle & Save 25%
          </span>
        </motion.div>

      </div>
    </section>
  )
}
