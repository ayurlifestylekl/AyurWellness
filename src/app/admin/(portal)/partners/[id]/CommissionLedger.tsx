import Link from 'next/link'

interface Commission {
  id: string
  order_id: string
  base_amount_rm: number
  rate_percent: number
  commission_rm: number
  status: 'pending' | 'paid' | 'reversed'
  reversal_reason: string | null
  created_at: string
  paid_at: string | null
  reversed_at: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any
}

const STATUS_CLASS: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  paid:     'bg-emerald-100 text-emerald-800 border-emerald-300',
  reversed: 'bg-slate-100 text-slate-700 border-slate-300',
}

export default function CommissionLedger({
  commissions,
}: {
  commissions: Commission[]
}) {
  if (commissions.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-[12.5px] italic text-[#12372D]/55">
        No commissions recorded yet. Commissions appear automatically when an order
        attributed to this agent is paid.
      </p>
    )
  }
  return (
    <ul className="divide-y divide-[#006B3C]/6">
      {commissions.map((c) => {
        const ord = Array.isArray(c.order) ? c.order[0] : c.order
        return (
          <li
            key={c.id}
            className="flex items-center gap-3 px-5 py-3 text-[13px]"
          >
            <Link
              href={`/admin/orders/${c.order_id}`}
              className="font-mono text-[11.5px] font-semibold text-[#006B3C] hover:text-[#B58A3B]"
            >
              #{String(c.order_id).slice(-6).toUpperCase()}
            </Link>
            <span className="flex-1 text-[12px] text-[#12372D]/65">
              {new Date(c.created_at).toLocaleDateString('en-MY')}
              {ord ? ` · order RM ${Number(ord.total_amount_rm).toFixed(2)}` : ''}
            </span>
            <span className="text-[11px] text-[#12372D]/55">{c.rate_percent}%</span>
            <span className="w-20 text-right font-semibold text-[#B58A3B]">
              RM {Number(c.commission_rm).toFixed(2)}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_CLASS[c.status] ?? ''}`}
            >
              {c.status}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
