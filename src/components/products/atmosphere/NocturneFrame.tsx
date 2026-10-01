'use client'

import React from 'react'
import Image from 'next/image'

interface NocturneFrameProps {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
  /** CSS aspect-ratio string, default '4 / 5'. */
  aspectRatio?: string
  /** 'normal' applies full atmosphere; 'soft' halves the darken intensity. */
  intensity?: 'normal' | 'soft'
  /** Positioned inside the frame on top of the atmosphere — e.g. name + price overlay. */
  children?: React.ReactNode
  /** Optional outer class (rounded-*, ring-*, etc.). */
  className?: string
  /** Optional class applied to the image itself — e.g. group-hover:scale-[1.04]. */
  imageClassName?: string
  /** True → desaturate + dim (used for out-of-stock state). */
  dimmed?: boolean
}

/**
 * The core Photographic Plate treatment. Wraps an `<Image>` inside a
 * fixed aspect-ratio container and stacks the Nocturne overlay recipe:
 *   1. Dark-green multiply (mood)
 *   2. Radial gold top-right (warm rim-light)
 *   3. Radial sage bottom-left (depth)
 *   4. Film grain via inline SVG (screen blend)
 *
 * This is reused by the listing cards and the detail-page main image.
 * The page background stays cream everywhere — only the contents of
 * this frame go dark.
 */
export default function NocturneFrame({
  src,
  alt,
  sizes,
  priority,
  aspectRatio = '4 / 5',
  intensity = 'normal',
  children,
  className,
  imageClassName,
  dimmed,
}: NocturneFrameProps) {
  // Kept deliberately light: this multiply sits over the product photography,
  // and at heavier values it washed out the printed label on the bottle, which
  // is the one thing a customer is trying to read on a product card.
  const darkOpacity = intensity === 'soft' ? 0.1 : 0.18
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        aspectRatio,
        overflow: 'hidden',
        filter: dimmed ? 'saturate(0.4) brightness(0.85)' : undefined,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={imageClassName}
        style={{ objectFit: 'cover' }}
      />
      {/* 1 — dark green multiply */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: '#12372D',
          mixBlendMode: 'multiply',
          opacity: darkOpacity,
        }}
      />
      {/* 2 — radial gold top-right (rim light) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 75% 20%, rgba(181, 138, 59,0.38) 0%, transparent 55%)',
          mixBlendMode: 'screen',
        }}
      />
      {/* 3 — radial sage bottom-left (depth) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 85%, rgba(20, 148, 71,0.22) 0%, transparent 55%)',
          mixBlendMode: 'screen',
        }}
      />
      {/* 4 — film grain */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/%3E%3C/svg%3E\")",
          mixBlendMode: 'screen',
          opacity: 0.12,
        }}
      />
      {/* 5 — bottom scrim, only when something is overlaid on the frame.
          The name/price sit directly on the photograph, so on a pale product
          shot (a cream label on a light backdrop) the cream text had almost
          nothing to read against. This gives the overlay a consistent dark
          footing whatever the image is doing behind it. */}
      {children && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%]"
          style={{
            background:
              'linear-gradient(to top, rgba(8,24,17,0.82) 0%, rgba(8,24,17,0.5) 40%, transparent 100%)',
          }}
        />
      )}
      {children}
    </div>
  )
}
