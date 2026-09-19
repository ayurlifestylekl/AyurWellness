import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getAdminOrderById } from '@/lib/admin/orders/queries'
import {
  DEMO_ADMIN_EMAIL,
  isMockOrderId,
  getMockOrderDetail,
} from '@/lib/admin/orders/mocks'
import OrderItemsTable from './OrderItemsTable'
import OrderTimeline from './OrderTimeline'
import OrderActions from './OrderActions'
import PractitionerNotePanel from './PractitionerNotePanel'
import InternalNotesPanel from './InternalNotesPanel'

export const metadata = { title: 'Order · Admin' }
export const dynamic = 'force-dynamic'

const STATUS_CLASS: Record<string, string> = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  packing:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped:    'bg-violet-50 text-violet-700 border-violet-200',
  delivered:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed:  'bg-emerald-100 text-emerald-800 border-emerald-300',
  cancelled:  'bg-red-50 text-red-700 border-red-200',
}

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const me = await getCurrentUser()
  const isDemoAdmin = me?.email === DEMO_ADMIN_EMAIL

  // Demo fallback: for demo admin + mock IDs, return synthetic data instead
  // of querying Supabase. Real orders always go through the live query.
  let order
  if (isDemoAdmin && isMockOrderId(params.id)) {
    order = getMockOrderDetail(params.id)
  } else {
    order = await getAdminOrderById(supabase, params.id)
  }
  if (!order) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o: any = order
  const isMock = isDemoAdmin && isMockOrderId(params.id)
  const cust = Array.isArray(o.customer) ? o.customer[0] : o.customer
  const ship = Array.isArray(o.shipping_address) ? o.shipping_address[0] : o.shipping_address
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refunds: any[] = Array.isArray(o.refunds) ? o.refunds : []
  const shortId = String(o.id).slice(-6).toUpperCase()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/admin/orders"
            className="text-[11px] uppercase tracking-wider text-[#006B3C]/55 hover:text-[#B58A3B]"
          >
            ← Back to orders
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="font-heading text-[24px] font-bold text-[#006B3C]">
              Order #{shortId}
            </h1>
            {isMock ? (
              <span className="rounded-full border border-[#B58A3B]/40 bg-[#EDF4E7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#B58A3B]">
                Demo data
              </span>
            ) : null}
          </div>
          <p className="text-[12px] text-[#12372D]/65">
            {new Date(o.created_at).toLocaleString('en-MY')} · channel: {o.channel}
            {o.invoice_number ? ` · Invoice ${o.invoice_number}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_CLASS[o.fulfillment_status] ?? ''}`}
            >
              {o.fulfillment_status}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${
                o.payment_status === 'paid'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : o.payment_status === 'refunded'
                    ? 'border-slate-300 bg-slate-100 text-slate-700'
                    : o.payment_status === 'failed'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              payment: {o.payment_status}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/admin/orders/${o.id}/invoice`}
            target="_blank"
            rel="noopener"
            className="rounded-lg border border-[#006B3C]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#006B3C] hover:bg-[#EDF4E7]/60"
          >
            Invoice
          </a>
          <a
            href={`/admin/orders/${o.id}/packing-slip`}
            target="_blank"
            rel="noopener"
            className="rounded-lg border border-[#006B3C]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#006B3C] hover:bg-[#EDF4E7]/60"
          >
            Packing slip
          </a>
          <a
            href={`/admin/orders/${o.id}/label`}
            target="_blank"
            rel="noopener"
            className="rounded-lg bg-[#006B3C] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#006B3C]"
          >
            Print label
          </a>
        </div>
      </header>

      <OrderActions
        orderId={o.id}
        currentStatus={o.fulfillment_status}
        totalRm={Number(o.total_amount_rm)}
        paymentStatus={o.payment_status}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article
          className="overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white lg:col-span-2"
          style={{ boxShadow: '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)' }}
        >
          <header className="border-b border-[#006B3C]/6 px-5 py-3 font-heading text-[13px] font-semibold text-[#006B3C]">
            Items
          </header>
          <OrderItemsTable items={o.order_items ?? []} />
        </article>

        <article
          className="rounded-2xl border border-[#006B3C]/8 bg-white p-5"
          style={{ boxShadow: '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)' }}
        >
          <h2 className="font-heading text-[13px] font-semibold text-[#006B3C]">Customer</h2>
          <p className="mt-2 text-[13px]">{cust?.full_name ?? '—'}</p>
          <p className="text-[12px] text-[#12372D]/65">{cust?.email}</p>
          <p className="text-[12px] text-[#12372D]/65">{cust?.phone_number}</p>
          {cust?.id ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#006B3C]/6 pt-3">
              <Link
                href={`/admin/customers/${cust.id}`}
                className="text-[11.5px] font-semibold text-[#006B3C]/70 hover:text-[#B58A3B]"
              >
                View profile →
              </Link>
              <Link
                href={`/admin/customers/${cust.id}#push-voucher`}
                className="inline-flex items-center gap-1 rounded-full bg-[#B58A3B]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#B58A3B] hover:bg-[#B58A3B]/25"
              >
                🎁 Push voucher
              </Link>
            </div>
          ) : null}
          {ship ? (
            <div className="mt-4 border-t border-[#006B3C]/6 pt-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                Ship to
              </h3>
              <p className="mt-1 text-[12.5px]">{ship.line1}</p>
              {ship.line2 ? <p className="text-[12.5px]">{ship.line2}</p> : null}
              <p className="text-[12.5px]">
                {ship.city}, {ship.state} {ship.postcode}
              </p>
              <p className="text-[12.5px]">{ship.country}</p>
            </div>
          ) : (
            <p className="mt-4 border-t border-[#006B3C]/6 pt-4 text-[11.5px] italic text-[#12372D]/55">
              No shipping address on file.
            </p>
          )}
          {o.tracking_number ? (
            <div className="mt-4 border-t border-[#006B3C]/6 pt-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
                Tracking
              </h3>
              <p className="mt-1 text-[12.5px]">
                {o.courier_service}: {o.tracking_number}
              </p>
            </div>
          ) : null}
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PractitionerNotePanel orderId={o.id} initial={o.practitioner_note} />
        <InternalNotesPanel orderId={o.id} initial={o.internal_notes} />
      </section>

      {refunds.length > 0 ? (
        <article
          className="overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white"
          style={{ boxShadow: '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)' }}
        >
          <header className="border-b border-[#006B3C]/6 px-5 py-3 font-heading text-[13px] font-semibold text-[#006B3C]">
            Refunds
          </header>
          <ul className="divide-y divide-[#006B3C]/6">
            {refunds.map((r) => (
              <li key={r.id} className="px-5 py-3 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#006B3C]">RM {Number(r.amount_rm).toFixed(2)}</span>
                  <span className="text-[11px] text-[#12372D]/55">
                    {new Date(r.created_at).toLocaleString('en-MY')}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-[#12372D]/70">{r.reason}</p>
                <p className="mt-0.5 text-[11px] text-[#12372D]/55">
                  via {r.refund_method}{r.gateway_reference ? ` · ref ${r.gateway_reference}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      <article
        className="overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white"
        style={{ boxShadow: '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)' }}
      >
        <header className="border-b border-[#006B3C]/6 px-5 py-3 font-heading text-[13px] font-semibold text-[#006B3C]">
          Timeline
        </header>
        <OrderTimeline events={o.events ?? []} />
      </article>
    </div>
  )
}
