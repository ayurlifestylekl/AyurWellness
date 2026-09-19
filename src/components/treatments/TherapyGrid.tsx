'use client'

import { motion } from 'framer-motion'

import TherapyCard from '@/components/treatments/TherapyCard'
import { staggerParent, inViewOnce } from '@/lib/motion'
import type { TreatmentSummary } from '@/types/treatments'

interface TherapyGridProps {
  categorySlug: string
  treatments: TreatmentSummary[]
}

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x',
                'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx']

export default function TherapyGrid({ categorySlug, treatments }: TherapyGridProps) {
  if (treatments.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20 sm:px-8 lg:px-12">
        <div className="flex flex-col items-center justify-center text-center">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full bg-accent shadow-[0_0_0_5px_rgba(181, 138, 59,0.18)]"
          />
          <p className="mt-6 font-body text-[20px] italic leading-[1.3] text-primary">
            Chapter in preparation.
          </p>
          <p className="mt-3 font-heading text-[10.5px] font-semibold uppercase tracking-[0.24em] text-dark/40">
            Awaiting therapy entries from the Centre
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerParent(0.05, 0.03)}
      initial="initial"
      whileInView="animate"
      viewport={inViewOnce}
      className="mx-auto grid max-w-5xl grid-cols-1 gap-5 px-6 pb-20 pt-10 sm:px-8 md:grid-cols-2 md:pb-28 lg:px-12"
    >
      {treatments.map((t, i) => (
        <TherapyCard
          key={t._id}
          treatment={t}
          categorySlug={categorySlug}
          romanIndex={`${ROMAN[i] ?? String(i + 1)}.`}
        />
      ))}
    </motion.div>
  )
}
