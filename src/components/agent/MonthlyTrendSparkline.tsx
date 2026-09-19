import type { MonthlyTrendPoint } from '@/lib/agent/dashboard/queries'

/**
 * Tiny inline SVG sparkline. Server-rendered, no library.
 * Plots commission RM over the last N months.
 */
export default function MonthlyTrendSparkline({
  points,
  width = 220,
  height = 56,
}: {
  points: MonthlyTrendPoint[]
  width?: number
  height?: number
}) {
  if (points.length === 0) return null
  const max = Math.max(1, ...points.map((p) => p.commissionRm))
  const xStep = width / Math.max(1, points.length - 1)
  const yFor = (v: number) => height - (v / max) * (height - 8) - 4

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * xStep).toFixed(1)} ${yFor(p.commissionRm).toFixed(1)}`)
    .join(' ')

  // Fill area below the line
  const fillPath = `${path} L ${(width).toFixed(1)} ${height} L 0 ${height} Z`

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="block"
      >
        <path d={fillPath} fill="#B58A3B" fillOpacity="0.15" />
        <path
          d={path}
          fill="none"
          stroke="#B58A3B"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={p.monthKey}
            cx={(i * xStep).toFixed(1)}
            cy={yFor(p.commissionRm).toFixed(1)}
            r={2.2}
            fill="#B58A3B"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[9.5px] uppercase tracking-wider text-[#12372D]/45">
        {points.map((p) => (
          <span key={p.monthKey}>{p.label}</span>
        ))}
      </div>
    </div>
  )
}
