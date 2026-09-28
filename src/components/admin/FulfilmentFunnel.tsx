interface Props {
  stages: Array<{ stage: string; count: number }>
}

export default function FulfilmentFunnel({ stages }: Props) {
  const max = Math.max(1, ...stages.map((s) => s.count))
  const isEmpty = max === 1 && stages.every((s) => s.count === 0)
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
          Fulfilment funnel · 30 days
        </h3>
      </header>
      <ul className="mt-3 space-y-2">
        {stages.map((s) => (
          <li key={s.stage}>
            <div className="flex items-baseline justify-between text-[11.5px]">
              <span className="font-heading font-semibold text-[#12372D]">{s.stage}</span>
              <span className="font-body tabular-nums text-[#12372D]/65">{s.count}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#006B3C]/[0.06]">
              <div
                className="h-full rounded-full bg-[#006B3C]"
                style={{ width: `${(s.count / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      {isEmpty && (
        <p className="mt-3 text-center font-body text-[11px] italic text-[#12372D]/45">
          Collecting data…
        </p>
      )}
    </article>
  )
}
