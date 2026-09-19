'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

import { fadeUp, staggerParent } from '@/lib/motion'

interface CategoryPageHeaderProps {
  title: string
  description: string | null
  order: number | null
  treatmentCount: number
}

export default function CategoryPageHeader({
  title,
  description,
  order,
  treatmentCount,
}: CategoryPageHeaderProps) {
  const chapterNumber =
    order != null ? String(order + 1).padStart(2, '0') : '—'

  return (
    <motion.header
      variants={staggerParent(0.08, 0.05)}
      initial="initial"
      animate="animate"
      className="relative mx-auto max-w-5xl px-6 pt-12 sm:px-8 sm:pt-16 lg:px-12"
    >
      {/* Breadcrumb */}
      <motion.nav
        variants={fadeUp(0)}
        aria-label="Breadcrumb"
        className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-dark/50"
      >
        <Link href="/treatments" className="text-accent transition-colors hover:text-primary">
          Treatments
        </Link>
        <span className="mx-2 text-dark/30">/</span>
        <span>{title}</span>
      </motion.nav>

      <motion.div
        variants={fadeUp(0)}
        className="mt-6 font-heading text-[14px] font-black tracking-[0.18em] text-accent"
      >
        CHAPTER {chapterNumber}
      </motion.div>

      <motion.h1
        variants={fadeUp(0)}
        className="mt-2 font-heading font-extrabold leading-[1.05] tracking-[-0.025em] text-primary"
        style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)' }}
      >
        {title}
      </motion.h1>

      {description && (
        <motion.p
          variants={fadeUp(0)}
          className="mt-4 max-w-2xl font-body text-[17px] italic leading-[1.6] text-dark/72"
        >
          {description}
        </motion.p>
      )}

      <motion.div
        variants={fadeUp(0)}
        className="mt-9 h-px"
        style={{
          background:
            'linear-gradient(to right, rgba(181, 138, 59,0.5), rgba(181, 138, 59,0.1) 60%, transparent)',
        }}
        aria-hidden
      />

      <motion.div
        variants={fadeUp(0)}
        className="mt-6 font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-dark/50"
      >
        {treatmentCount} {treatmentCount === 1 ? 'Therapy' : 'Therapies'} in this chapter
      </motion.div>
    </motion.header>
  )
}
