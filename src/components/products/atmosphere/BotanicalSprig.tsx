'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { inViewOnce } from '@/lib/motion'

interface BotanicalSprigProps {
  /** Stroke color — defaults to the project gold accent. */
  color?: string
  /** Final opacity — defaults to 0.18. */
  opacity?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * Single hand-drawn botanical sprig in SVG line-art. Used as a subtle
 * corner watermark on editorial sections. Animates in once per scroll.
 */
export default function BotanicalSprig({
  color = '#B58A3B',
  opacity = 0.18,
  className,
  style,
}: BotanicalSprigProps) {
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 200 260"
      fill="none"
      stroke={color}
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity, y: 0 }}
      viewport={inViewOnce}
      transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={style}
    >
      <path d="M 100 250 C 100 190, 112 140, 105 85 C 100 48, 90 20, 100 5" />
      <path d="M 108 200 C 136 195, 156 184, 170 164" />
      <path d="M 108 200 C 138 206, 158 214, 170 164" />
      <path d="M 103 150 C 74 145, 54 133, 40 112" />
      <path d="M 103 150 C 74 154, 54 162, 40 112" />
      <path d="M 106 100 C 132 94, 152 84, 166 62" />
      <path d="M 106 100 C 134 104, 154 112, 166 62" />
      <path d="M 101 55 C 78 50, 62 42, 50 26" />
      <path d="M 101 55 C 78 60, 62 66, 50 26" />
      <circle cx="100" cy="6" r="3" />
    </motion.svg>
  )
}
