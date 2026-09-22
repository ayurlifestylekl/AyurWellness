'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { requestProductCancellation } from '@/lib/checkout/actions'
import type { ProductOrderDetail } from '@/lib/product-management/queries'

export default function AccountOrderDetailClient({ order }: { order: ProductOrderDetail }) {
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const canCancel = !['cancelled', 'refunded', 'delivered'].includes(order.status)

  function submitCancel(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await requestProductCancellation({ orderId: order.id, reason })
      if (result.ok) {
        setMessage('Cancellation request submitted. We will review it shortly.')
        setReason('')
      } else {
        setMessage(result.error ?? 'Request failed.')
      }
    })
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="font-heading text-[28px] font-bold text-[#12372D]">Order {order.order_number}</h1>
        <p className="mt-1 text-[13px] text-[#12372D]/65">
          Placed on {format(new Date(order.created_at), 'dd MMM yyyy')}
        </p>
      </div>

      <div className="rounded-2xl border border-[#12372D]/10 bg-white p-5">
        <h2 className="font-heading text-[14px] font-bold uppercase tracking-wider text-[#12372D]/70">Items</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-[13px]">
              <span>
                {item.product_name} × {item.quantity}
              </span>
              <span className="font-heading font-semibold">RM {item.line_total_rm.toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-[#12372D]/10 pt-3 text-right font-heading text-[16px] font-bold text-[#12372D]">
          Total RM {order.total_rm.toFixed(2)}
        </div>
      </div>

      <div className="rounded-2xl border border-[#12372D]/10 bg-white p-5">
        <h2 className="font-heading text-[14px] font-bold uppercase tracking-wider text-[#12372D]/70">Status</h2>
        <p className="mt-2 capitalize text-[#12372D]/80">{order.status.replace(/_/g, ' ')}</p>
        {order.tracking_number && (
          <p className="mt-1 text-[13px] text-[#12372D]/65">
            Tracking: {order.tracking_number} {order.courier && `(${order.courier})`}
          </p>
        )}
      </div>

      {canCancel && (
        <form onSubmit={submitCancel} className="rounded-2xl border border-[#12372D]/10 bg-white p-5">
          <h2 className="font-heading text-[14px] font-bold uppercase tracking-wider text-[#12372D]/70">Request cancellation</h2>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why do you want to cancel this order?"
            className="mt-3 min-h-[80px] w-full rounded-lg border border-[#12372D]/15 px-3 py-2 text-[13px] focus:border-[#12372D] focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-3 rounded-md bg-[#12372D] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#12372D]/90 disabled:opacity-60"
          >
            {pending ? 'Submitting…' : 'Request cancellation / refund'}
          </button>
          {message && <p className="mt-2 text-[13px] text-[#12372D]/70">{message}</p>}
        </form>
      )}

      <Link href="/account/product-orders" className="text-[13px] text-[#12372D] hover:underline">
        ← Back to my orders
      </Link>
    </div>
  )
}
