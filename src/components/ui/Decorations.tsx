import React from 'react'

/**
 * Floating leaf SVG used as scattered background accents.
 * Mirrors the leaf component embedded in HeroSection so other
 * sections can reuse the same visual language.
 */
export function FloatingLeaf({
  className,
  style,
  color = '#006B3C',
  strokeColor = '#006B3C',
  opacity = 0.7,
}: {
  className?: string
  style?: React.CSSProperties
  color?: string
  strokeColor?: string
  opacity?: number
}) {
  return (
    <svg
      viewBox="0 0 56 74"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ opacity, ...style }}
    >
      <path
        d="M28 72 C6 54, 0 34, 8 16 C14 4, 42 -2, 50 14 C58 30, 52 56, 28 72Z"
        fill={color}
      />
      <path
        d="M28 72 C28 52, 28 28, 28 8"
        stroke={strokeColor}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={0.5}
      />
      <path
        d="M28 56 C20 48, 12 44, 10 36"
        stroke={strokeColor}
        strokeWidth="0.8"
        opacity={0.35}
        strokeLinecap="round"
      />
      <path
        d="M28 44 C20 38, 14 32, 12 24"
        stroke={strokeColor}
        strokeWidth="0.8"
        opacity={0.35}
        strokeLinecap="round"
      />
      <path
        d="M28 52 C36 46, 42 40, 44 32"
        stroke={strokeColor}
        strokeWidth="0.8"
        opacity={0.35}
        strokeLinecap="round"
      />
      <path
        d="M28 40 C36 34, 42 28, 44 20"
        stroke={strokeColor}
        strokeWidth="0.8"
        opacity={0.35}
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Botanical mandala — concentric rings, radial spokes, and petals.
 * Used as a sacred-geometry decorative motif on dark surfaces.
 */
export function BotanicalMandala({
  opacity = 0.12,
  stroke = '#B58A3B',
  className,
}: {
  opacity?: number
  stroke?: string
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
      style={{ opacity }}
    >
      <circle cx="100" cy="100" r="90" stroke={stroke} strokeWidth="0.6" />
      <circle cx="100" cy="100" r="72" stroke={stroke} strokeWidth="0.4" />
      <circle cx="100" cy="100" r="54" stroke={stroke} strokeWidth="0.6" />
      <circle cx="100" cy="100" r="36" stroke={stroke} strokeWidth="0.4" />
      <circle cx="100" cy="100" r="18" stroke={stroke} strokeWidth="0.8" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180
        const x1 = (100 + Math.cos(angle) * 18).toFixed(4)
        const y1 = (100 + Math.sin(angle) * 18).toFixed(4)
        const x2 = (100 + Math.cos(angle) * 90).toFixed(4)
        const y2 = (100 + Math.sin(angle) * 90).toFixed(4)
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={stroke}
            strokeWidth="0.4"
          />
        )
      })}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180
        const cx = (100 + Math.cos(angle) * 54).toFixed(4)
        const cy = (100 + Math.sin(angle) * 54).toFixed(4)
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx="8"
            ry="14"
            transform={`rotate(${i * 45 + 90}, ${cx}, ${cy})`}
            stroke={stroke}
            strokeWidth="0.5"
          />
        )
      })}
      <circle cx="100" cy="100" r="3" fill={stroke} opacity={0.6} />
    </svg>
  )
}
