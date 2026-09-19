import Link from 'next/link'
import type { MarketplaceOrderListItem } from '@/lib/admin/marketplace-orders/queries'
import { EXTERNAL_CHANNEL_LABEL } from '@/lib/admin/external-sales/queries'

const STATUS_CLASS: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

const CHANNEL_CLASS: Record<string, string> = {
  tiktok_shop: 'bg-pink-50 text-pink-700 border-pink-200',
  shopee:      'bg-orange-50 text-orange-700 border-orange-200',
  lazada:      'bg-blue-50 text-blue-700 border-blue-200',
  instagram:   'bg-purple-50 text-purple-700 border-purple-200',
  whatsapp:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  other:       'bg-slate-100 text-slate-700 border-slate-300',
}

export default function AgentSubmissionsTable({
  items,
}: {
  items: MarketplaceOrderListItem[]
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#006B3C]/15 p-12 text-center font-body text-sm italic text-[#12372D]/55">
        No agent submissions in this view. When affiliates submit marketplace
        sales from their portal, they appear here for your approval.
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-[#EDF4E7]/40 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          <tr>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">Affiliate</th>
            <th className="px-4 py-3">Channel</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Marketplace ref</th>
            <th className="px-4 py-3 text-right">Items</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#006B3C]/6">
          {items.map((m) => (
            <tr
              key={m.id}
              className={`hover:bg-[#EDF4E7]/30 ${
                m.status === 'pending' ? 'bg-[#EDF4E7]/15' : ''
              }`}
            >
              <td className="px-4 py-3 text-[11.5px] text-[#12372D]/65">
                {new Date(m.createdAt).toLocaleDateString('en-MY')}
              </td>
              <td className="px-4 py-3">
                {m.referralAgentCode ? (
                  <Link
                    href={`/admin/partners/${m.referralAgentId}`}
                    className="font-mono text-[11.5px] font-semibold text-[#006B3C] hover:text-[#B58A3B]"
                  >
                    {m.referralAgentCode}
                  </Link>
                ) : (
                  <span className="text-[#12372D]/45">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${CHANNEL_CLASS[m.channel] ?? ''}`}
                >
                  {EXTERNAL_CHANNEL_LABEL[m.channel]}
                </span>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/agent-submissions/${m.id}`}
                  className="font-semibold text-[#006B3C] hover:text-[#B58A3B]"
                >
                  {m.customerName}
                </Link>
                <div className="text-[11px] text-[#12372D]/55">
                  {m.customerPhone ?? m.customerEmail ?? ''}
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-[11.5px] text-[#12372D]/65">
                {m.marketplaceOrderRef ?? '—'}
              </td>
              <td className="px-4 py-3 text-right">{m.itemCount}</td>
              <td className="px-4 py-3 text-right font-semibold">
                RM {m.totalAmountRm.toFixed(2)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_CLASS[m.status] ?? ''}`}
                >
                  {m.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
