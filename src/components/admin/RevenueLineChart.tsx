import { linePath } from '@/lib/admin/charts'

interface Props {
  data: Array<{ date: string; revenue: number }>
}

export default function RevenueLineChart({ data }: Props) {
  const w = 320
  const h = 90
  const { d: pathD, max, points } = linePath(data.map((p) => p.revenue), w, h)
  const isEmpty = max === 1 && data.every((p) => p.revenue === 0)
  return (
    <article
      className="overflow-hidden rounded-[24px] border border-[#12372D]/[0.06] bg-white p-5"
      style={{
        boxShadow:
          '0 1px 2px rgba(18,55,45,0.04), 0 24px 48px -32px rgba(18,55,45,0.35)',
      }}
    >
      <header className="flex items-baseline justify-between">
        <h3 className="font-heading text-[13px] font-semibold text-[#12372D]">
          Revenue · last 30 days
        </h3>
        <span className="font-body text-[11px] text-[#12372D]/55">
          Peak day RM {max.toFixed(0)}
        </span>
      </header>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-3 h-24 w-full"
        preserveAspectRatio="none"
        aria-label="Revenue over the last 30 days"
      >
        <path d={pathD} fill="none" stroke="#B58A3B" strokeWidth={1.8} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={1.5} fill="#B58A3B" />
        ))}
      </svg>
      {isEmpty && (
        <p className="mt-2 text-center font-body text-[11px] italic text-[#12372D]/45">
          Collecting data…
        </p>
      )}
    </article>
  )
}
