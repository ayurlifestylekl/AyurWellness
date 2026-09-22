'use client'

import React from 'react'
import Link from 'next/link'

type Variant = 'primary' | 'secondary' | 'outlineLight' | 'outlineDark'
type Size = 'md' | 'lg'

interface CommonProps {
  variant?: Variant
  size?: Size
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  shimmer?: boolean
  className?: string
  children: React.ReactNode
}

interface LinkProps extends CommonProps {
  href: string
  onClick?: never
  type?: never
  ariaLabel?: string
}

interface ButtonProps extends CommonProps {
  href?: never
  onClick?: () => void
  type?: 'button' | 'submit'
  ariaLabel?: string
}

type Props = LinkProps | ButtonProps

const variantStyles: Record<Variant, string> = {
  // Deep Amber/Copper — the brand's main accent, used for primary calls to action
  primary:
    'bg-[linear-gradient(135deg,#E4C384_0%,#B8752A_100%)] text-[#12372D] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_18px_40px_-18px_rgba(184,117,42,0.75)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_22px_50px_-16px_rgba(184,117,42,0.9)] hover:-translate-y-0.5',
  // Forest green with gold wording — secondary emphasis
  secondary:
    'bg-primary text-gold shadow-[0_18px_40px_-18px_rgba(18,55,45,0.65)] hover:bg-[#12372D] hover:shadow-[0_22px_50px_-16px_rgba(18,55,45,0.85)] hover:-translate-y-0.5',
  outlineLight:
    'border border-gold/50 bg-white/5 text-gold backdrop-blur hover:bg-white/15 hover:-translate-y-0.5',
  outlineDark:
    'border border-primary/30 bg-white/40 text-primary backdrop-blur hover:border-primary hover:bg-white/80 hover:-translate-y-0.5',
}

const sizeStyles: Record<Size, string> = {
  md: 'px-6 py-3 text-[12px] gap-2',
  lg: 'px-8 py-4 text-[13px] gap-2.5',
}

/**
 * Premium CTA button with shimmer-sweep hover (reuses globals.css utility).
 * Renders as a Next.js Link when `href` is provided, otherwise a <button>.
 * Always 44px+ tall for touch target compliance.
 */
export default function CTAButton(props: Props) {
  const {
    variant = 'primary',
    size = 'lg',
    icon,
    iconRight,
    shimmer = false,
    className = '',
    children,
    ariaLabel,
  } = props

  const base =
    'group relative inline-flex min-h-[44px] items-center justify-center overflow-hidden rounded-full font-heading font-bold uppercase tracking-[0.15em] transition-all duration-300 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'

  const classes = `${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

  const inner = (
    <>
      {icon && (
        <span className="relative z-10 transition-transform duration-300 group-hover:rotate-12">
          {icon}
        </span>
      )}
      <span className="relative z-10">{children}</span>
      {iconRight && (
        <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
          {iconRight}
        </span>
      )}
      {/* Shimmer sweep — opt-in only, uses keyframes from globals.css */}
      {shimmer && (
        <span
          aria-hidden
          className="shimmer-sweep pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
            width: '60%',
          }}
        />
      )}
    </>
  )

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={classes} aria-label={ariaLabel}>
        {inner}
      </Link>
    )
  }

  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      className={classes}
      aria-label={ariaLabel}
    >
      {inner}
    </button>
  )
}
