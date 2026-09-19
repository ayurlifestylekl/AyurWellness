import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { listAgentMarketplaceOrders } from '@/lib/agent/marketplace-orders/queries'
import { EXTERNAL_CHANNEL_LABEL } from '@/lib/admin/external-sales/queries'
import PayPendingBanner from './PayPendingBanner'

export const metadata = { title: 'Marketplace Sales · Partner' }
export const dynamic = 'force-dynamic'

const STATUS_CLASS: Record<string, string> = {
  pending_payment: 'bg-amber-50 text-amber-800 border-amber-300',
  pending: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  pending: 'Pending admin review',
  approved: 'Approved',
  rejected: 'Rejected',
}

const CHANNEL_CLASS: Record<string, string> = {
  tiktok_shop: 'bg-pink-50 text-pink-700 border-pink-200',
  shopee:      'bg-orange-50 text-orange-700 border-orange-200',
  lazada:      'bg-blue-50 text-blue-700 border-blue-200',
  instagram:   'bg-purple-50 text-purple-700 border-purple-200',
  whatsapp:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  other:       'bg-slate-100 text-slate-700 border-slate-300',
}

export default async function AgentMarketplaceOrdersPage() {
  const supabase = await createClient()
  const items = await listAgentMarketplaceOrders(supabase)

  const counts = {
    pending_payment: items.filter((i) => i.status === 'pending_payment').length,
    pending: items.filter((i) => i.status === 'pending').length,
    approved: items.filter((i) => i.status === 'approved').length,
    rejected: items.filter((i) => i.status === 'rejected').length,
  }
  const unpaidOrders = items.filter((i) => i.status === 'pending_payment')
  const unpaidTotal = unpaidOrders.reduce((s, i) => s + i.totalAmountRm, 0)
  const approvedTotal = items
    .filter((i) => i.status === 'approved')
    .reduce((s, i) => s + i.totalAmountRm, 0)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
            Multi-channel sales
          </span>
          <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#12372D]">
            Marketplace sales
          </h1>
          <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
            {counts.pending_payment} awaiting payment · {counts.pending} pending review ·{' '}
            {counts.approved} approved · {counts.rejected} rejected · RM{' '}
            {approvedTotal.toFixed(2)} approved
          </p>
        </div>
        <Link
          href="/agent/marketplace-orders/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#149447] px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-[#12372D]"
        >
          <Plus className="h-3.5 w-3.5" />
          Submit sale
        </Link>
      </header>

      {/* Pay-pending banner */}
      {unpaidOrders.length > 0 ? (
        <PayPendingBanner
          orders={unpaidOrders.map((o) => ({
            id: o.id,
            channel: o.channel,
            customerName: o.customerName,
            totalAmountRm: o.totalAmountRm,
            createdAt: o.createdAt,
          }))}
          total={unpaidTotal}
        />
      ) : null}

      <section className="rounded-2xl border border-[#12372D]/10 bg-white p-4 text-[12.5px] text-[#12372D]/70">
        <p className="font-semibold text-[#12372D]">How this works</p>
        <ol className="mt-1 list-decimal space-y-1 pl-4">
          <li>Submit each marketplace order — it lands in <strong>Awaiting payment</strong>.</li>
          <li>
            When ready, pay the clinic the lump sum for all unpaid orders and upload{' '}
            <strong>one receipt link</strong>.
          </li>
          <li>Orders flip to <strong>Pending admin review</strong>.</li>
          <li>Admin verifies the bank deposit, approves, and ships to your customers.</li>
          <li>Commission is added to your next monthly payout.</li>
        </ol>
      </section>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#12372D]/15 p-12 text-center font-body text-sm italic text-[#12372D]/55">
          No marketplace sales yet. Click <strong>Submit sale</strong> after your next order.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#12372D]/8 bg-white">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#EDF4E7]/40 text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#12372D]/6">
              {items.map((m) => (
                <tr
                  key={m.id}
                  className={`hover:bg-[#EDF4E7]/30 ${
                    m.status === 'pending_payment' ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-[11.5px] text-[#12372D]/65">
                    {new Date(m.createdAt).toLocaleDateString('en-MY')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${CHANNEL_CLASS[m.channel] ?? ''}`}
                    >
                      {EXTERNAL_CHANNEL_LABEL[m.channel]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#12372D]">{m.customerName}</div>
                    <div className="text-[11px] text-[#12372D]/55">{m.customerPhone ?? ''}</div>
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
                      {STATUS_LABEL[m.status] ?? m.status}
                    </span>
                    {m.status === 'rejected' && m.rejectionReason ? (
                      <div className="mt-1 text-[11px] italic text-red-700">
                        {m.rejectionReason}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
