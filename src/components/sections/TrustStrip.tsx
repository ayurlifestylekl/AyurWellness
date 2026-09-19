'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { HeartHandshake, Leaf, Flower2 } from 'lucide-react'
import { fadeUp, staggerParent, inViewOnce } from '@/lib/motion'

const items = [
  {
    icon: HeartHandshake,
    title: 'Personalised Care',
    body: 'Tailored wellness plans for your unique needs',
  },
  {
    icon: Leaf,
    title: 'Traditional Therapies',
    body: 'Time-tested Ayurvedic treatments for natural healing',
  },
  {
    icon: Flower2,
    title: 'Holistic Wellness',
    body: 'Nurturing mind, body and spirit for a balanced life',
  },
]

/**
 * Soft-sage credential strip — sits between Hero and EmpathyBridge.
 * Light green background with circular icon badges and divider hairlines,
 * breaking up the dark hero/stats-bar band above it.
 */
export default function TrustStrip() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="relative"
      style={{ backgroundColor: '#DCEEDC' }}
    >
      <h2 id="trust-heading" className="sr-only">
        Why Ayurvedic Wellness Centre
      </h2>

      <motion.div
        variants={staggerParent(0.08, 0.05)}
        initial="initial"
        whileInView="animate"
        viewport={inViewOnce}
        className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-8 sm:py-12 lg:px-12"
      >
        {items.map((item, i) => (
          <React.Fragment key={item.title}>
            <motion.div
              variants={fadeUp(0)}
              className="sm:flex-1"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
                <item.icon className="h-4 w-4 text-primary" strokeWidth={1.8} />
              </span>
              <p className="mt-3 font-heading text-[15px] font-bold text-dark">
                {item.title}
              </p>
              <p className="mt-0.5 font-body text-[13px] leading-snug text-dark/55">
                {item.body}
              </p>
            </motion.div>

            {/* Divider between items (desktop only) */}
            {i < items.length - 1 && (
              <div aria-hidden className="hidden h-16 w-px shrink-0 bg-primary/15 sm:mx-8 sm:block lg:mx-10" />
            )}
          </React.Fragment>
        ))}
      </motion.div>
    </section>
  )
}
