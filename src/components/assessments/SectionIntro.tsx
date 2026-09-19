'use client'

import { motion } from 'framer-motion'
import type { QuizSection } from '@/types/quiz'

interface SectionIntroProps {
  section: QuizSection
  sectionNumber: number
  totalSections: number
}

export default function SectionIntro({
  section,
  sectionNumber,
  totalSections,
}: SectionIntroProps) {
  return (
    <motion.div
      key={`section-${section.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col items-center text-center"
    >
      <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-[#12372D]/45">
        Part {sectionNumber} of {totalSections}
      </p>
      {section.sanskrit && (
        <p
          className="mt-4 italic text-[15px] text-[#B58A3B]"
          style={{ fontFamily: 'var(--font-playfair)', letterSpacing: '0.01em' }}
        >
          {section.sanskrit}
        </p>
      )}
      <h2
        className="mt-1 font-heading text-[32px] font-bold leading-tight text-[#12372D] sm:text-[40px]"
        style={{ letterSpacing: '-0.025em' }}
      >
        {section.title}
      </h2>
      <div
        aria-hidden
        className="mt-5 h-px w-16 bg-gradient-to-r from-transparent via-[#B58A3B] to-transparent"
      />
      <p
        className="mt-5 max-w-md font-body text-[14.5px] text-[#12372D]/70"
        style={{ lineHeight: 1.7 }}
      >
        {section.intro}
      </p>
    </motion.div>
  )
}
