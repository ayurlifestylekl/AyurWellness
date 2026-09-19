import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { getOrderById } from '@/lib/dashboard/order-queries'

import OrderTimeline from '@/components/account/OrderTimeline'
import OrderItemsTable from '@/components/account/OrderItemsTable'
import TrackingPanel from '@/components/account/TrackingPanel'
import PaymentPanel from '@/components/account/PaymentPanel'
import PractitionerNoteChip from '@/components/account/PractitionerNoteChip'
import OrderActions from '@/components/account/OrderActions'

export const metadata = {
  title: 'Order Details',
}

const dateFormat = new Intl.DateTimeFormat('en-MY', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function shortId(id: string): string {
  return id.slice(-6).toUpperCase()
}

function titleForStatus(
  payment: 'pending' | 'paid' | 'failed' | 'refunded',
  fulfillment: 'pending' | 'processing' | 'packing' | 'shipped' | 'delivered' | 'completed' | 'cancelled'
): string {
  if (fulfillment === 'cancelled') return 'Cancelled.'
  if (payment === 'refunded') return 'Refunded.'
  if (payment === 'failed') return 'Order cancelled.'
  if (payment === 'pending') return 'Awaiting payment.'
  if (fulfillment === 'completed') return 'Completed.'
  if (fulfillment === 'delivered') return 'Delivered.'
  if (fulfillment === 'shipped') return 'On the way.'
  if (fulfillment === 'packing') return 'Being packed.'
  return 'Being prepared.'
}

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const me = await getCurrentUser()
  const customerId = me?.authId ?? ''

  // UUID-ish guard — short-circuit obviously bad IDs before hitting the DB
  if (!params.id || params.id.length < 8) {
    notFound()
  }

  const supabase = await createClient()
  const order = await getOrderById(supabase, customerId, params.id)

  if (!order) {
    notFound()
  }

  // Refunds RLS auto-scopes to this customer's orders
  const { data: refundsRaw } = await supabase
    .from('refunds')
    .select('id, amount_rm, reason, refund_method, created_at')
    .eq('order_id', params.id)
    .order('created_at', { ascending: false })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refunds: any[] = (refundsRaw ?? []) as any[]

  const title = titleForStatus(order.payment_status, order.fulfillment_status)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:gap-5">
      {/* ── Back link ─────────────────────────────────────────────── */}
      <Link
        href="/account/orders"
        className="group inline-flex w-fit items-center gap-1.5 font-heading text-[11.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55 transition-colors hover:text-[#B58A3B]"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
        All orders
      </Link>

      {/* ── Header ────────────────────────────────────────────────── */}
      <header>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[#006B3C]/60">
          Order #{shortId(order.id)}
        </span>
        <h1
          className="mt-1.5 font-heading text-[26px] font-bold leading-tight text-[#006B3C] sm:text-[30px]"
          style={{ letterSpacing: '-0.02em' }}
        >
          {title}
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-[#12372D]/55">
          Placed on {dateFormat.format(new Date(order.created_at))}
        </p>
      </header>

      {/* ── Practitioner note (only renders when Vaidya has added one) ── */}
      <PractitionerNoteChip note={order.practitioner_note} />

      {/* ── Timeline ───────────────────────────────────────────── */}
      <OrderTimeline
        paymentStatus={order.payment_status}
        fulfillmentStatus={order.fulfillment_status}
      />

      {/* ── Items + side column (Tracking + Payment) ──────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="lg:col-span-7">
          <OrderItemsTable
            items={order.items}
            orderTotal={Number(order.total_amount_rm)}
          />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-5 lg:gap-5">
          <TrackingPanel
            courier={order.courier_service}
            trackingNumber={order.tracking_number}
            fulfillmentStatus={order.fulfillment_status}
          />
          <PaymentPanel
            paymentStatus={order.payment_status}
            total={Number(order.total_amount_rm)}
          />
        </div>
      </div>

      {/* ── Refunds (only when present) ──────────────────────────── */}
      {refunds.length > 0 ? (
        <section
          className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
          style={{
            boxShadow:
              '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
          }}
        >
          <header className="border-b border-[#006B3C]/6 px-5 py-3 font-heading text-[13px] font-semibold text-[#006B3C] sm:px-6">
            Refunds
          </header>
          <ul className="divide-y divide-[#006B3C]/6">
            {refunds.map((r) => (
              <li key={r.id} className="px-5 py-3 sm:px-6">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-[14px] font-semibold text-[#006B3C]">
                    RM {Number(r.amount_rm).toFixed(2)}
                  </span>
                  <span className="font-body text-[11px] text-[#12372D]/55">
                    {dateFormat.format(new Date(r.created_at))}
                  </span>
                </div>
                <p className="mt-1 font-body text-[12.5px] text-[#12372D]/70">
                  {r.reason}
                </p>
                <p className="mt-0.5 font-body text-[11px] text-[#12372D]/55">
                  Refunded via {String(r.refund_method).replace('_', ' ')}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ── Actions ───────────────────────────────────────────────── */}
      <OrderActions
        orderId={order.id}
        orderShortId={shortId(order.id)}
        paymentStatus={order.payment_status}
        fulfillmentStatus={order.fulfillment_status}
        items={order.items}
      />
    </div>
  )
}
