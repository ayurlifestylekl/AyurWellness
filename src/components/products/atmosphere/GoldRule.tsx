'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { inViewOnce } from '@/lib/motion'

interface GoldRuleProps {
  /** 'vertical' (scaleY from top) or 'horizontal' (scaleX from left). */
  orientation?: 'vertical' | 'horizontal'
  /** CSS length for the non-scaling axis, e.g. "60%", "80px". Default: full. */
  length?: string
  /** Tailwind-style extra classes. Use for positioning. */
  className?: string
  style?: React.CSSProperties
  /** Seconds for the draw animation. Default 1.2. */
  duration?: number
}

/**
 * A 1px gold hairline that "draws" itself on scroll-into-view.
 * Encapsulates the motion recipe used across About / Philosophy / Products.
 */
export default function GoldRule({
  orientation = 'horizontal',
  length = '100%',
  className,
  style,
  duration = 1.2,
}: GoldRuleProps) {
  const isVertical = orientation === 'vertical'
  return (
    <motion.span
      aria-hidden
      className={className}
      style={{
        display: 'block',
        background: isVertical
          ? 'linear-gradient(to bottom, rgba(181, 138, 59,0.9) 0%, rgba(181, 138, 59,0.4) 60%, rgba(181, 138, 59,0) 100%)'
          : 'linear-gradient(to right, rgba(181, 138, 59,0.9) 0%, rgba(181, 138, 59,0.4) 60%, rgba(181, 138, 59,0) 100%)',
        width: isVertical ? '1px' : length,
        height: isVertical ? length : '1px',
        transformOrigin: isVertical ? 'top' : 'left',
        ...style,
      }}
      initial={{ scaleX: isVertical ? 1 : 0, scaleY: isVertical ? 0 : 1, opacity: 0 }}
      whileInView={{ scaleX: 1, scaleY: 1, opacity: 1 }}
      viewport={inViewOnce}
      transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
    />
  )
}
