import { ArrowDown, ArrowUp } from 'lucide-react'

interface Movement {
  id: string
  movement_type: string
  quantity_delta: number
  reason: string | null
  cost_price_rm: number | null
  expiry_date: string | null
  notes: string | null
  created_at: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actor: any
}

const HUMAN: Record<string, string> = {
  received:       'Received',
  sold:           'Sold',
  returned:       'Returned',
  write_off:      'Write-off',
  recount_adjust: 'Recount',
  reserved:       'Reserved',
  unreserved:     'Unreserved',
}

export default function StockMovementsLog({ movements }: { movements: Movement[] }) {
  if (movements.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-[12.5px] italic text-[#12372D]/55">
        No stock movements yet.
      </p>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[420px] w-full text-left text-[13px]">
        <thead className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          <tr>
            <th className="px-5 py-3">When</th>
            <th className="px-5 py-3">Type</th>
            <th className="px-5 py-3 text-right">Delta</th>
            <th className="px-5 py-3">Reason / notes</th>
            <th className="px-5 py-3">By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#006B3C]/6">
          {movements.map((m) => {
            const positive = m.quantity_delta >= 0
            const actor = Array.isArray(m.actor) ? m.actor[0] : m.actor
            return (
              <tr key={m.id}>
                <td className="px-5 py-3 text-[12px] text-[#12372D]/65">
                  {new Date(m.created_at).toLocaleString('en-MY')}
                </td>
                <td className="px-5 py-3">{HUMAN[m.movement_type] ?? m.movement_type}</td>
                <td
                  className={`px-5 py-3 text-right font-semibold ${
                    positive ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {positive ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {Math.abs(m.quantity_delta)}
                  </span>
                </td>
                <td className="px-5 py-3 text-[12px] text-[#12372D]/70">
                  {m.reason ?? m.notes ?? '—'}
                  {m.cost_price_rm != null ? (
                    <span className="ml-2 text-[11px] text-[#12372D]/55">
                      @ RM {Number(m.cost_price_rm).toFixed(2)}
                    </span>
                  ) : null}
                  {m.expiry_date ? (
                    <span className="ml-2 text-[11px] text-[#12372D]/55">
                      exp {m.expiry_date}
                    </span>
                  ) : null}
                </td>
                <td className="px-5 py-3 text-[12px] text-[#12372D]/65">
                  {actor?.full_name ?? 'System'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
