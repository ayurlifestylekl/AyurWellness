'use client'

import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'

type DivMotionProps = React.ComponentProps<typeof motion.div>
type Target = NonNullable<DivMotionProps['animate']>
type MarginType = NonNullable<Parameters<typeof useInView>[1]>['margin']
type TransitionType = DivMotionProps['transition']

const TAGS = {
  div: motion.div,
  span: motion.span,
  p: motion.p,
  blockquote: motion.blockquote,
  header: motion.header,
  aside: motion.aside,
  ol: motion.ol,
  svg: motion.svg,
} as const

interface RevealProps {
  as?: keyof typeof TAGS
  /** Named variants (from lib/motion.ts helpers). Mutually exclusive with initial/animate. */
  variants?: Variants
  /** Raw initial target, for the few spots that don't use named variants. */
  initial?: Target
  /** Raw revealed-state target, paired with `initial`. */
  animate?: Target
  transition?: TransitionType
  /** IntersectionObserver root margin — matches the site's previous `inViewOnce` default. */
  margin?: string // widened for caller convenience; cast to MarginType internally
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  [key: string]: unknown
}

/**
 * Drop-in replacement for `motion.div ... initial="initial" whileInView="animate"
 * viewport={...}` (or the inline-object equivalent `initial={{...}} whileInView={{...}}`).
 *
 * framer-motion's declarative `whileInView` prop can silently never apply its
 * end state on some real viewport/layout combinations, even though the
 * browser's own IntersectionObserver correctly reports the element as
 * visible — reproduced on this site (narrow viewports left the founder photo
 * and other sections permanently at opacity: 0, confirmed with a parallel
 * native IntersectionObserver that fired correctly while whileInView never
 * updated the DOM). The `useInView` hook is a different, reliable code path;
 * a timed fallback additionally guarantees content is never stuck invisible.
 */
export default function Reveal({
  as = 'div',
  variants,
  initial,
  animate,
  transition,
  margin = '-80px',
  className,
  style,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: margin as MarginType })
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const revealed = inView || timedOut
  const Tag = TAGS[as]
  const motionState = variants
    ? { variants, initial: 'initial', animate: revealed ? 'animate' : 'initial' }
    : { initial: initial ?? {}, animate: revealed ? (animate ?? {}) : (initial ?? {}) }

  return (
    <Tag ref={ref} {...motionState} transition={transition} className={className} style={style} {...rest}>
      {children}
    </Tag>
  )
}
