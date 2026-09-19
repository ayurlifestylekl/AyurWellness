'use client'

import { useState, useTransition } from 'react'
import {
  markWholesalePaid,
  markWholesaleFulfilling,
  markWholesaleShipped,
  markWholesaleDelivered,
  cancelWholesaleOrder,
  setWholesaleAdminNotes,
} from '@/lib/admin/wholesale-orders/actions'
import type { WholesaleStatus } from '@/lib/admin/wholesale-orders/queries'

export default function WholesaleActions({
  orderId,
  status,
  paymentMethod: initialPaymentMethod,
  paymentProofUrl: initialPaymentProofUrl,
  courier: initialCourier,
  trackingNumber: initialTrackingNumber,
  adminNotes: initialNotes,
}: {
  orderId: string
  status: WholesaleStatus
  paymentMethod: string | null
  paymentProofUrl: string | null
  courier: string | null
  trackingNumber: string | null
  adminNotes: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod ?? 'Bank transfer')
  const [paymentProofUrl, setPaymentProofUrl] = useState(initialPaymentProofUrl ?? '')
  const [courier, setCourier] = useState(initialCourier ?? '')
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber ?? '')
  const [cancelReason, setCancelReason] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const [notes, setNotes] = useState(initialNotes ?? '')

  function flash(ok: boolean, msg: string) {
    if (ok) setMessage(msg)
    else setError(msg)
    setTimeout(() => {
      setError(null)
      setMessage(null)
    }, 3500)
  }

  function doMarkPaid() {
    startTransition(async () => {
      const r = await markWholesalePaid({ orderId, paymentMethod, paymentProofUrl })
      if (!r.ok) flash(false, r.error)
      else location.reload()
    })
  }

  function doMarkFulfilling() {
    startTransition(async () => {
      const r = await markWholesaleFulfilling(orderId)
      if (!r.ok) flash(false, r.error)
      else location.reload()
    })
  }

  function doMarkShipped() {
    startTransition(async () => {
      const r = await markWholesaleShipped({ orderId, courier, trackingNumber })
      if (!r.ok) flash(false, r.error)
      else location.reload()
    })
  }

  function doMarkDelivered() {
    startTransition(async () => {
      const r = await markWholesaleDelivered(orderId)
      if (!r.ok) flash(false, r.error)
      else location.reload()
    })
  }

  function doCancel() {
    startTransition(async () => {
      const r = await cancelWholesaleOrder(orderId, cancelReason)
      if (!r.ok) flash(false, r.error)
      else location.reload()
    })
  }

  function saveNotes() {
    startTransition(async () => {
      const r = await setWholesaleAdminNotes(orderId, notes)
      flash(r.ok, r.ok ? 'Notes saved.' : r.error)
    })
  }

  const canCancel = !['delivered', 'cancelled'].includes(status)

  return (
    <div className="flex flex-col gap-3">
      {/* Stage 1 — pending payment → paid */}
      {status === 'pending_payment' ? (
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-heading text-[13px] font-semibold text-amber-900">
            Confirm payment received
          </h3>
          <p className="mt-1 text-[11.5px] text-amber-800/85">
            Once confirmed, stock will deduct automatically and the order can be packed.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="Payment method (e.g. Maybank transfer)"
              className="rounded-lg border border-amber-300/60 bg-white px-3 py-2 text-[12.5px]"
            />
            <input
              type="url"
              value={paymentProofUrl}
              onChange={(e) => setPaymentProofUrl(e.target.value)}
              placeholder="Proof URL (optional)"
              className="rounded-lg border border-amber-300/60 bg-white px-3 py-2 text-[12.5px]"
            />
          </div>
          <button
            type="button"
            disabled={pending || !paymentMethod.trim()}
            onClick={doMarkPaid}
            className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? 'Working…' : 'Mark paid'}
          </button>
        </article>
      ) : null}

      {/* Stage 2 — paid → fulfilling (optional intermediate) */}
      {status === 'paid' ? (
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="font-heading text-[13px] font-semibold text-emerald-900">
            Payment confirmed
          </h3>
          <p className="mt-1 text-[11.5px] text-emerald-800/85">
            Move to <strong>Packing</strong> while you prepare, or jump straight to{' '}
            <strong>Shipped</strong> once on the way.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={doMarkFulfilling}
            className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? 'Working…' : 'Start packing'}
          </button>
        </article>
      ) : null}

      {/* Stage 3 — paid|fulfilling → shipped */}
      {['paid', 'fulfilling'].includes(status) ? (
        <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="font-heading text-[13px] font-semibold text-blue-900">Ship it</h3>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="text"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              placeholder="Courier (Pos Laju, J&T, DHL…)"
              className="rounded-lg border border-blue-300/60 bg-white px-3 py-2 text-[12.5px]"
            />
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Tracking number"
              className="rounded-lg border border-blue-300/60 bg-white px-3 py-2 text-[12.5px]"
            />
          </div>
          <button
            type="button"
            disabled={pending || !courier.trim() || !trackingNumber.trim()}
            onClick={doMarkShipped}
            className="mt-3 rounded-lg bg-purple-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {pending ? 'Working…' : 'Mark shipped'}
          </button>
        </article>
      ) : null}

      {/* Stage 4 — shipped → delivered */}
      {status === 'shipped' ? (
        <article className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
          <h3 className="font-heading text-[13px] font-semibold text-purple-900">
            Shipped — awaiting delivery confirmation
          </h3>
          <p className="mt-1 text-[11.5px] text-purple-800/85">
            Mark as delivered once the partner confirms receipt.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={doMarkDelivered}
            className="mt-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? 'Working…' : 'Mark delivered'}
          </button>
        </article>
      ) : null}

      {/* Cancel + notes */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {canCancel ? (
          <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
            <h3 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
              Cancel order
            </h3>
            <p className="mt-1 text-[11.5px] text-[#12372D]/65">
              Cancelling after payment will restore stock automatically.
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() => setShowCancel(true)}
              className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Cancel order
            </button>
          </article>
        ) : null}

        <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
          <h3 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
            Admin notes
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Internal — not shown to partner."
            className="mt-2 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 font-mono text-[11.5px]"
          />
          <button
            type="button"
            disabled={pending}
            onClick={saveNotes}
            className="mt-2 rounded-lg border border-[#006B3C]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#006B3C] disabled:opacity-50"
          >
            Save notes
          </button>
        </article>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
          ⚠ {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">
          ✓ {message}
        </p>
      ) : null}

      {showCancel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
              Cancel wholesale order?
            </h2>
            <p className="mt-1 text-[12px] text-[#12372D]/65">
              If the order was already paid, stock will be restored automatically.
            </p>
            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Reason *
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
              placeholder="Why is this being cancelled?"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCancel(false)}
                className="rounded-lg border border-[#006B3C]/15 px-3 py-1.5 text-[12px]"
              >
                Keep order
              </button>
              <button
                type="button"
                disabled={pending || cancelReason.trim().length < 3}
                onClick={doCancel}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                Cancel order
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
