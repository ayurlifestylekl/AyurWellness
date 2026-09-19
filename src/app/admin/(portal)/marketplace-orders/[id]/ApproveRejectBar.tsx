'use client'

import { useState, useTransition } from 'react'
import {
  approveMarketplaceOrder,
  rejectMarketplaceOrder,
} from '@/lib/admin/marketplace-orders/actions'

export default function ApproveRejectBar({
  marketplaceOrderId,
  status,
  createdOrderId,
}: {
  marketplaceOrderId: string
  status: 'pending' | 'approved' | 'rejected'
  createdOrderId: string | null
}) {
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function approve() {
    setError(null)
    startTransition(async () => {
      const r = await approveMarketplaceOrder(marketplaceOrderId)
      if (!r.ok) setError(r.error)
      else location.reload()
    })
  }

  function reject() {
    setError(null)
    startTransition(async () => {
      const r = await rejectMarketplaceOrder(marketplaceOrderId, reason)
      if (!r.ok) setError(r.error)
      else location.reload()
    })
  }

  if (status === 'approved') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
        ✓ Approved — order has been created in the system.
        {createdOrderId ? (
          <>
            {' '}
            <a
              href={`/admin/orders/${createdOrderId}`}
              className="font-semibold underline"
            >
              View order →
            </a>
          </>
        ) : null}
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
        ✗ Rejected.
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#B58A3B]/30 bg-[#EDF4E7] p-3">
      <span className="text-[12px] font-semibold text-[#006B3C]">
        Pending approval — review and choose:
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={approve}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? 'Working…' : 'Approve & create order'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setShowReject(true)}
        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        Reject
      </button>
      {error ? (
        <span className="text-[11.5px] text-red-700">{error}</span>
      ) : null}

      {showReject ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
              Reject marketplace order
            </h2>
            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
              placeholder="e.g. fraudulent order, customer cancelled, duplicate"
            />
            {error ? <p className="mt-2 text-[12px] text-red-600">{error}</p> : null}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowReject(false)}
                className="rounded-lg border border-[#006B3C]/15 px-3 py-1.5 text-[12px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending || reason.trim().length < 3}
                onClick={reject}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
