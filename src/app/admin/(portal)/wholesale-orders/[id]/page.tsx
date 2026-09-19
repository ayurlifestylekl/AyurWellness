import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getWholesaleOrderById,
  WHOLESALE_STATUS_LABEL,
  type WholesaleStatus,
} from '@/lib/admin/wholesale-orders/queries'
import WholesaleActions from './WholesaleActions'

export const metadata = { title: 'Wholesale Order · Admin' }
export const dynamic = 'force-dynamic'

const STATUS_CLASS: Record<WholesaleStatus, string> = {
  pending_payment: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  fulfilling: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

export default async function AdminWholesaleDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const w = await getWholesaleOrderById(supabase, params.id)
  if (!w) notFound()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <Link
        href="/admin/wholesale-orders"
        className="text-[11px] uppercase tracking-wider text-[#006B3C]/55 hover:text-[#B58A3B]"
      >
        ← Back to wholesale orders
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-[24px] font-bold text-[#006B3C]">
              <code className="font-mono">{w.orderNumber}</code>
            </h1>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_CLASS[w.status] ?? ''}`}
            >
              {WHOLESALE_STATUS_LABEL[w.status]}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-[#12372D]/65">
            Received {new Date(w.createdAt).toLocaleString('en-MY')}
          </p>
        </div>
      </header>

      <WholesaleActions
        orderId={w.id}
        status={w.status}
        paymentMethod={w.paymentMethod}
        paymentProofUrl={w.paymentProofUrl}
        courier={w.courier}
        trackingNumber={w.trackingNumber}
        adminNotes={w.adminNotes}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Items + totals */}
        <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4 lg:col-span-2">
          <h2 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">Items</h2>
          <table className="mt-3 w-full text-left text-[13px]">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              <tr>
                <th className="py-2">Product</th>
                <th className="py-2">SKU</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#006B3C]/6">
              {w.items.map((it) => (
                <tr key={it.id}>
                  <td className="py-2">{it.productName}</td>
                  <td className="py-2 font-mono text-[11.5px] text-[#12372D]/60">
                    {it.productSku ?? '—'}
                  </td>
                  <td className="py-2 text-right">{it.quantity}</td>
                  <td className="py-2 text-right">RM {it.unitPriceRm.toFixed(2)}</td>
                  <td className="py-2 text-right font-semibold">
                    RM {it.lineTotalRm.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="text-[12.5px]">
              <tr>
                <td colSpan={4} className="pt-3 text-right text-[#12372D]/65">
                  Subtotal
                </td>
                <td className="pt-3 text-right">RM {w.subtotalRm.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={4} className="text-right text-[#12372D]/65">
                  Shipping
                </td>
                <td className="text-right">RM {w.shippingRm.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan={4} className="pt-1 text-right font-semibold text-[#006B3C]">
                  Total
                </td>
                <td className="pt-1 text-right font-semibold text-[#006B3C]">
                  RM {w.totalRm.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>

          {w.agentNotes ? (
            <div className="mt-4 rounded-lg border border-[#006B3C]/8 bg-[#EDF4E7]/30 p-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                Partner note
              </p>
              <p className="mt-1 text-[12px] italic text-[#12372D]/70">{w.agentNotes}</p>
            </div>
          ) : null}

          {w.cancelReason ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] text-red-800">
              <strong>Cancelled:</strong> {w.cancelReason}
            </div>
          ) : null}
        </article>

        {/* Partner + ship-to */}
        <aside className="flex flex-col gap-4">
          <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
            <h2 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">Partner</h2>
            <p className="mt-2 text-[13px] font-semibold">{w.agentName}</p>
            <p className="mt-0.5 text-[11.5px] text-[#12372D]/65">
              <code className="font-mono font-semibold text-[#B58A3B]">
                {w.agentReferralCode}
              </code>
            </p>
            {w.agentEmail ? (
              <p className="mt-1 text-[11.5px] text-[#12372D]/65">{w.agentEmail}</p>
            ) : null}
            {w.agentPhone ? (
              <p className="text-[11.5px] text-[#12372D]/65">{w.agentPhone}</p>
            ) : null}
            <Link
              href={`/admin/partners/${w.agentId}`}
              className="mt-3 inline-block text-[11.5px] font-semibold text-[#B58A3B] hover:underline"
            >
              View partner →
            </Link>
          </article>

          <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
            <h2 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
              Ship to
            </h2>
            <p className="mt-2 whitespace-pre-line text-[12.5px] text-[#12372D]/85">
              {w.shippingAddress}
            </p>
            <p className="mt-1 text-[12.5px] text-[#12372D]/65">
              {w.shippingPostcode} {w.shippingState}
            </p>
          </article>

          {w.paidAt || w.shippedAt || w.deliveredAt ? (
            <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
              <h2 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
                Timeline
              </h2>
              <ul className="mt-2 space-y-1.5 text-[11.5px] text-[#12372D]/70">
                <li>
                  Placed · {new Date(w.createdAt).toLocaleString('en-MY')}
                </li>
                {w.paidAt ? (
                  <li>
                    Paid · {new Date(w.paidAt).toLocaleString('en-MY')}
                  </li>
                ) : null}
                {w.shippedAt ? (
                  <li>
                    Shipped · {new Date(w.shippedAt).toLocaleString('en-MY')}
                    {w.courier ? ` · ${w.courier}` : ''}
                    {w.trackingNumber ? ` · ${w.trackingNumber}` : ''}
                  </li>
                ) : null}
                {w.deliveredAt ? (
                  <li>
                    Delivered · {new Date(w.deliveredAt).toLocaleString('en-MY')}
                  </li>
                ) : null}
                {w.cancelledAt ? (
                  <li className="text-red-700">
                    Cancelled · {new Date(w.cancelledAt).toLocaleString('en-MY')}
                  </li>
                ) : null}
              </ul>
            </article>
          ) : null}
        </aside>
      </section>
    </div>
  )
}
