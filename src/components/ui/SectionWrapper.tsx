'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { fadeUp, inViewOnce } from '@/lib/motion'

type PaddingVariant = 'tight' | 'standard' | 'immersive'

const paddingStyles: Record<PaddingVariant, string> = {
  tight: 'py-10 md:py-14',
  standard: 'py-14 md:py-20',
  immersive: 'py-0',
}

interface SectionWrapperProps {
  id?: string
  eyebrow?: string
  title?: string
  subtitle?: string
  align?: 'left' | 'center'
  padding?: PaddingVariant
  className?: string
  innerClassName?: string
  headerActions?: React.ReactNode
  children: React.ReactNode
  ariaLabel?: string
}

/**
 * Consistent section shell:
 *  - max-width container with generous vertical padding
 *  - optional animated header (eyebrow + h2 + subtitle)
 *  - reuses the hero's fadeUp pattern for the header reveal
 */
export default function SectionWrapper({
  id,
  eyebrow,
  title,
  subtitle,
  align = 'center',
  padding = 'standard',
  className = '',
  innerClassName = '',
  headerActions,
  children,
  ariaLabel,
}: SectionWrapperProps) {
  const headerId = id ? `${id}-heading` : undefined
  const alignment =
    align === 'center' ? 'items-center text-center' : 'items-start text-left'

  return (
    <section
      id={id}
      aria-labelledby={headerId}
      aria-label={!title ? ariaLabel : undefined}
      className={`relative ${className}`}
    >
      <div
        className={`mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 ${paddingStyles[padding]} ${innerClassName}`}
      >
        {(eyebrow || title || subtitle) && (
          <motion.div
            variants={fadeUp(0)}
            initial="initial"
            whileInView="animate"
            viewport={inViewOnce}
            className={`mb-14 flex flex-col gap-4 ${alignment} ${
              align === 'left'
                ? 'md:flex-row md:items-end md:justify-between md:gap-10'
                : ''
            }`}
          >
            <div className={`flex flex-col gap-4 ${alignment}`}>
              {eyebrow && (
                <span className="font-heading text-[11px] font-bold uppercase tracking-[0.28em] text-accent">
                  {eyebrow}
                </span>
              )}
              {title && (
                <h2
                  id={headerId}
                  className="font-heading text-balance text-3xl font-extrabold leading-[1.1] text-primary sm:text-4xl md:text-5xl"
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p
                  className={`max-w-2xl font-body text-base leading-relaxed text-dark/70 md:text-[17px] ${
                    align === 'center' ? 'mx-auto' : ''
                  }`}
                >
                  {subtitle}
                </p>
              )}
            </div>
            {headerActions && (
              <div className="flex shrink-0 items-center">{headerActions}</div>
            )}
          </motion.div>
        )}

        {children}
      </div>
    </section>
  )
}
