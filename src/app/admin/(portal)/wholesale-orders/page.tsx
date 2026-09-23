import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  listWholesaleOrders,
  WHOLESALE_STATUS_LABEL,
  type WholesaleStatus,
} from '@/lib/admin/wholesale-orders/queries'
import WholesaleFilters from './WholesaleFilters'

export const metadata = { title: 'Wholesale Orders · Admin' }
export const dynamic = 'force-dynamic'

const STATUS_CLASS: Record<WholesaleStatus, string> = {
  pending_payment: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  fulfilling: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

interface PageProps {
  searchParams: { status?: string; q?: string }
}

export default async function AdminWholesaleOrdersPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const status = (searchParams.status as WholesaleStatus | 'all') ?? 'pending_payment'
  const { items, total } = await listWholesaleOrders(supabase, {
    status,
    search: searchParams.q,
    limit: 200,
  })

  const pendingValue = items
    .filter((i) => i.status === 'pending_payment')
    .reduce((s, i) => s + i.totalRm, 0)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header>
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          Reseller channel
        </span>
        <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C]">
          Wholesale orders
        </h1>
        <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
          {total} order{total === 1 ? '' : 's'} in this view
          {pendingValue > 0
            ? ` · RM ${pendingValue.toFixed(2)} pending payment confirmation`
            : ''}
          .
        </p>
      </header>

      <section className="rounded-2xl border border-[#006B3C]/10 bg-white p-4 text-[12.5px] text-[#12372D]/70">
        <p className="font-semibold text-[#006B3C]">How wholesale works</p>
        <p className="mt-1">
          Reseller-capable partners place orders at wholesale prices from their portal. Mark them{' '}
          <strong>paid</strong> once you confirm the bank transfer / payment proof — stock deducts
          automatically. Then pack, mark <strong>shipped</strong> with tracking, and ship to the
          partner&apos;s address.
        </p>
      </section>

      <WholesaleFilters active={status} q={searchParams.q ?? ''} />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#006B3C]/15 p-12 text-center font-body text-sm italic text-[#12372D]/55">
          No wholesale orders in this view.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#006B3C]/8 bg-white">
          <table className="min-w-[640px] w-full text-left text-[13px]">
            <thead className="bg-[#EDF4E7]/40 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#006B3C]/6">
              {items.map((w) => (
                <tr
                  key={w.id}
                  className={`hover:bg-[#EDF4E7]/30 ${
                    w.status === 'pending_payment' ? 'bg-[#EDF4E7]/15' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/wholesale-orders/${w.id}`}
                      className="font-mono text-[11.5px] font-semibold text-[#006B3C] hover:text-[#B58A3B]"
                    >
                      {w.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-[#12372D]/65">
                    {new Date(w.createdAt).toLocaleDateString('en-MY')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[12.5px] font-semibold text-[#006B3C]">
                      {w.agentName}
                    </div>
                    <div className="font-mono text-[11px] text-[#B58A3B]">
                      {w.agentReferralCode}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">{w.itemCount}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    RM {w.totalRm.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_CLASS[w.status] ?? ''}`}
                    >
                      {WHOLESALE_STATUS_LABEL[w.status]}
                    </span>
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
