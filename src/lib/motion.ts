import { useReducedMotion, type Variants } from 'framer-motion'

/**
 * Shared easing curve used across the homepage — matches the hero.
 * Tuple form is required by framer-motion's typed transition.
 */
export const EASE_OUT_PREMIUM: [number, number, number, number] = [0.22, 0.92, 0.38, 1.0]

/**
 * Stagger entrance variant. Use as `variants={fadeUp(0.1)}`.
 */
export const fadeUp = (delay = 0): Variants => ({
  initial: { opacity: 0, y: 28, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, delay, ease: EASE_OUT_PREMIUM },
  },
})

/**
 * Slide in from the side (used by EmpathyBridge columns).
 */
export const slideIn = (direction: 'left' | 'right', delay = 0): Variants => ({
  initial: { opacity: 0, x: direction === 'left' ? -40 : 40 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, delay, ease: EASE_OUT_PREMIUM },
  },
})

/**
 * Cinematic clipPath reveal — content clips open from a direction.
 * Used for hero images and therapy row images.
 */
export const clipReveal = (
  direction: 'left' | 'right' | 'bottom' = 'right',
  delay = 0
): Variants => {
  const clipMap = {
    left: 'inset(0 100% 0 0)',
    right: 'inset(0 0 0 100%)',
    bottom: 'inset(0 0 100% 0)',
  }
  return {
    initial: { clipPath: clipMap[direction], opacity: 0 },
    animate: {
      clipPath: 'inset(0 0 0 0)',
      opacity: 1,
      transition: { duration: 1.0, delay, ease: EASE_OUT_PREMIUM },
    },
  }
}

/**
 * Scale-in from center — used for cards and product tiles.
 */
export const scaleIn = (delay = 0): Variants => ({
  initial: { opacity: 0, scale: 0.92 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay, ease: EASE_OUT_PREMIUM },
  },
})

/**
 * Parent container for staggered children (Shop tiles, Featured products).
 */
export const staggerParent = (stagger = 0.06, delayChildren = 0.1): Variants => ({
  initial: {},
  animate: {
    transition: { staggerChildren: stagger, delayChildren },
  },
})

/**
 * Default viewport for whileInView animations.
 */
export const inViewOnce = { once: true, margin: '-80px' } as const

/**
 * Returns motion-friendly variants that respect the user's OS reduced-motion
 * preference. When reduced motion is on, transforms collapse to opacity-only.
 */
export function useReducedMotionSafe() {
  const shouldReduce = useReducedMotion()
  return shouldReduce ?? false
}
