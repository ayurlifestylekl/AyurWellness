import Link from 'next/link'
import type { AgentListItem } from '@/lib/admin/agents/queries'

export default function PartnersTable({ items }: { items: AgentListItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#006B3C]/15 p-12 text-center font-body text-sm italic text-[#12372D]/55">
        No partners match this filter.
      </div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#006B3C]/8 bg-white">
      <table className="min-w-[640px] w-full text-left text-[13px]">
        <thead className="bg-[#EDF4E7]/40 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          <tr>
            <th className="px-4 py-3">Partner</th>
            <th className="px-4 py-3">Referral code</th>
            <th className="px-4 py-3">Type · rate</th>
            <th className="px-4 py-3 text-right">Attributed orders</th>
            <th className="px-4 py-3 text-right">Sales generated</th>
            <th className="px-4 py-3 text-right">Commission</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#006B3C]/6">
          {items.map((a) => (
            <tr key={a.id} className="hover:bg-[#EDF4E7]/30">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/partners/${a.id}`}
                  className="font-semibold text-[#006B3C] hover:text-[#B58A3B]"
                >
                  {a.fullName ?? '—'}
                </Link>
                <div className="text-[11px] text-[#12372D]/55">{a.email ?? ''}</div>
              </td>
              <td className="px-4 py-3">
                <code className="font-mono text-[11.5px] font-semibold text-[#006B3C]">
                  {a.referralCode}
                </code>
              </td>
              <td className="px-4 py-3">
                <div className="text-[12px] capitalize">{a.commissionType}</div>
                <div className="text-[11px] text-[#12372D]/65">{a.commissionRate}%</div>
              </td>
              <td className="px-4 py-3 text-right">{a.attributedOrderCount}</td>
              <td className="px-4 py-3 text-right">
                RM {a.totalSalesRm.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-[#B58A3B]">
                RM {a.totalCommissionRm.toFixed(2)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${
                    a.status === 'active'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {a.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
