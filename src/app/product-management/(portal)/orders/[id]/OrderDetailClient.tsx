'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { updateProductOrderStatus } from '@/lib/product-management/actions'
import type { ProductOrderDetail } from '@/lib/product-management/queries'

export default function OrderDetailClient({ order }: { order: ProductOrderDetail }) {
  const [status, setStatus] = useState(order.status)
  const [tracking, setTracking] = useState(order.tracking_number ?? '')
  const [courier, setCourier] = useState(order.courier ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function change(newStatus: string) {
    setMessage(null)
    startTransition(async () => {
      const result = await updateProductOrderStatus({
        orderId: order.id,
        status: newStatus,
        trackingNumber: tracking,
        courier,
      })
      if (result.ok) {
        setStatus(newStatus)
        setMessage('Order updated.')
      } else {
        setMessage(result.error ?? 'Update failed.')
      }
    })
  }

  const paid = order.payment_status === 'paid'

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
            Order {order.order_number}
          </span>
          <h1 className="mt-1 font-heading text-[28px] font-bold text-[#12372D]">
            {order.email}
          </h1>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#12372D]/10 bg-white p-5">
          <h2 className="font-heading text-[14px] font-bold uppercase tracking-wider text-[#12372D]/70">Items</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-[13px]">
                <span>
                  {item.product_name} {item.product_sku ? `(${item.product_sku})` : ''} × {item.quantity}
                </span>
                <span className="font-heading font-semibold text-[#12372D]">RM {item.line_total_rm.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-[#12372D]/10 pt-3 text-[13px]">
            <div className="flex justify-between text-[#12372D]/70">
              <span>Subtotal</span>
              <span>RM {order.subtotal_rm.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#12372D]/70">
              <span>Shipping</span>
              <span>RM {order.shipping_rm.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-heading text-[16px] font-bold text-[#12372D]">
              <span>Total</span>
              <span>RM {order.total_rm.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#12372D]/10 bg-white p-5">
          <h2 className="font-heading text-[14px] font-bold uppercase tracking-wider text-[#12372D]/70">Shipping address</h2>
          {order.address ? (
            <div className="mt-3 text-[13px] text-[#12372D]/80">
              <p className="font-semibold text-[#12372D]">{order.address.name}</p>
              <p>{order.address.line_1}</p>
              {order.address.line_2 && <p>{order.address.line_2}</p>}
              <p>
                {order.address.postcode} {order.address.city}, {order.address.state}
              </p>
              <p>{order.address.country}</p>
              {order.shipping_country_code && (
                <p className="text-[11px] uppercase text-[#12372D]/55">
                  Country code: {order.shipping_country_code}
                  {order.shipping_zone_name ? ` · Zone: ${order.shipping_zone_name}` : ''}
                </p>
              )}
              <p className="mt-2">{order.address.email}</p>
              {order.address.phone && <p>{order.address.phone}</p>}
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-[#12372D]/55">No address on file.</p>
          )}
        </div>
      </div>

      {paid && status !== 'cancelled' && status !== 'refunded' && (
        <div className="rounded-2xl border border-[#12372D]/10 bg-white p-5">
          <h2 className="font-heading text-[14px] font-bold uppercase tracking-wider text-[#12372D]/70">Fulfillment</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1 text-[12px]">
              <span className="font-semibold text-[#12372D]/70">Courier</span>
              <input value={courier} onChange={(e) => setCourier(e.target.value)} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1 text-[12px]">
              <span className="font-semibold text-[#12372D]/70">Tracking number</span>
              <input value={tracking} onChange={(e) => setTracking(e.target.value)} className={inputCls} />
            </label>
            <div className="flex items-end gap-2">
              {status !== 'processing' && (
                <ActionButton onClick={() => change('processing')} pending={pending} label="Mark processing" />
              )}
              {status !== 'shipped' && (
                <ActionButton onClick={() => change('shipped')} pending={pending} label="Mark shipped" />
              )}
              {status !== 'delivered' && (
                <ActionButton onClick={() => change('delivered')} pending={pending} label="Mark delivered" />
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/product-management/orders/${order.id}/label?format=a4`}
              target="_blank"
              className="rounded-md bg-[#12372D] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#12372D]/90"
            >
              Print A4 label
            </Link>
            <Link
              href={`/product-management/orders/${order.id}/label?format=thermal`}
              target="_blank"
              className="rounded-md border border-[#12372D]/20 bg-white px-3 py-2 text-[12px] font-semibold text-[#12372D] hover:bg-[#EDF4E7]/60"
            >
              Print 4×6 label
            </Link>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#12372D]/10 bg-white p-5">
        <h2 className="font-heading text-[14px] font-bold uppercase tracking-wider text-[#12372D]/70">Status history</h2>
        <ul className="mt-3 space-y-2 text-[13px]">
          {order.history.length === 0 && <li className="text-[#12372D]/55">No history entries yet.</li>}
          {order.history.map((h) => (
            <li key={h.id} className="flex justify-between">
              <span>
                {h.event_type.replace(/_/g, ' ')}
                {h.from_status && h.to_status && ` · ${h.from_status} → ${h.to_status}`}
              </span>
              <span className="text-[11px] text-[#12372D]/55">{format(new Date(h.created_at), 'dd MMM yyyy HH:mm')}</span>
            </li>
          ))}
        </ul>
      </div>

      {message && (
        <p className={`text-[13px] ${message.includes('failed') ? 'text-red-700' : 'text-emerald-700'}`}>{message}</p>
      )}

      <div className="flex gap-3">
        <Link href="/product-management/orders" className="text-[13px] text-[#12372D] hover:underline">
          ← Back to orders
        </Link>
      </div>
    </div>
  )
}

function ActionButton({ onClick, pending, label }: { onClick: () => void; pending: boolean; label: string }) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className="rounded-md bg-[#12372D] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#12372D]/90 disabled:opacity-60"
    >
      {pending ? 'Saving…' : label}
    </button>
  )
}

const inputCls =
  'w-full rounded-lg border border-[#12372D]/15 bg-white px-3 py-2 text-[13px] focus:border-[#12372D] focus:outline-none'

function StatusBadge({ status }: { status: string }) {
  const colour =
    status === 'paid'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'awaiting_payment'
        ? 'bg-amber-100 text-amber-800'
        : status === 'cancelled' || status === 'refunded'
          ? 'bg-red-100 text-red-800'
          : 'bg-slate-100 text-slate-800'
  return (
    <span className={`rounded-full px-3 py-1 text-[12px] font-semibold capitalize ${colour}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
