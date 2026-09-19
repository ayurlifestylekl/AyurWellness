'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface BrandSigilProps {
  /** Size in pixels. Default 36. */
  size?: number
  /** Stroke color — defaults to project gold accent. */
  color?: string
  /** Stroke weight in SVG units (viewBox is 40×40). Default 1.1. */
  strokeWidth?: number
  /** Mount-draw duration in seconds. Default 1.2. */
  duration?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * Editorial brand sigil — a thin gold circle containing an interlocked
 * monogram with a small dot above. Plays a stroke-draw animation on mount
 * so the mark feels drawn rather than stamped.
 *
 * Uses on-mount (`animate`) rather than in-view — hero-only element so
 * it should reveal as the page loads, not when scrolled to.
 */
export default function BrandSigil({
  size = 36,
  color = '#B58A3B',
  strokeWidth = 1.1,
  duration = 1.2,
  className,
  style,
}: BrandSigilProps) {
  const draw = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
  }

  return (
    <motion.svg
      aria-label="Ayurvedic Wellness Centre sigil"
      role="img"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      initial="initial"
      animate="animate"
    >
      {/* outer circle */}
      <motion.circle
        cx="20"
        cy="20"
        r="17"
        variants={draw}
        transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* top dot — like a classical bindi / anusvara over the mark */}
      <motion.circle
        cx="20"
        cy="6.5"
        r="0.8"
        fill={color}
        stroke="none"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: duration * 0.8, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* left glyph — left vertical + upper & lower diagonals */}
      <motion.path
        d="M 13 12 L 13 28"
        variants={draw}
        transition={{ delay: duration * 0.25, duration: duration * 0.55, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.path
        d="M 13 20 L 18 12"
        variants={draw}
        transition={{ delay: duration * 0.35, duration: duration * 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.path
        d="M 13 20 L 18 28"
        variants={draw}
        transition={{ delay: duration * 0.35, duration: duration * 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* right glyph — interlocked with the left: two legs + crossbar */}
      <motion.path
        d="M 20 28 L 24 12"
        variants={draw}
        transition={{ delay: duration * 0.5, duration: duration * 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.path
        d="M 24 12 L 28 28"
        variants={draw}
        transition={{ delay: duration * 0.55, duration: duration * 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.path
        d="M 21.7 22 L 26.3 22"
        variants={draw}
        transition={{ delay: duration * 0.7, duration: duration * 0.4, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.svg>
  )
}
