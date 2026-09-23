'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import {
  approveProductCancellation,
  rejectProductCancellation,
} from '@/lib/product-management/actions'
import type { InFlightProductRefund, PendingCancellation } from '@/lib/product-management/queries'

export default function CancellationsClient({
  requests,
  inFlightRefunds = [],
}: {
  requests: PendingCancellation[]
  inFlightRefunds?: InFlightProductRefund[]
}) {
  const [items, setItems] = useState(requests)
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<'success' | 'warning' | 'error'>('success')
  const [pending, startTransition] = useTransition()

  function approve(id: string) {
    setMessage(null)
    startTransition(async () => {
      const result = await approveProductCancellation({ cancellationId: id })
      if (result.ok) {
        setItems((prev) => prev.filter((r) => r.id !== id))
        if (result.data?.refundNeedsAttention) {
          setMessageTone('warning')
          setMessage('Cancellation approved, but the refund needs manual follow-up — see "Refunds in progress" below.')
        } else {
          setMessageTone('success')
          setMessage('Cancellation approved.')
        }
      } else {
        setMessageTone('error')
        setMessage(result.error ?? 'Approval failed.')
      }
    })
  }

  function reject(id: string, reason: string) {
    setMessage(null)
    startTransition(async () => {
      const result = await rejectProductCancellation({ cancellationId: id, staffReason: reason })
      if (result.ok) {
        setItems((prev) => prev.filter((r) => r.id !== id))
        setMessageTone('success')
        setMessage('Cancellation rejected.')
      } else {
        setMessageTone('error')
        setMessage(result.error ?? 'Rejection failed.')
      }
    })
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div>
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          Customer service
        </span>
        <h1 className="mt-2 font-heading text-[28px] font-bold text-[#12372D]">Cancellations & Refunds</h1>
        <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
          {items.length} pending request{items.length === 1 ? '' : 's'}
        </p>
      </div>

      {message && (
        <p className={`rounded-lg px-4 py-2 text-[13px] ${
          messageTone === 'error'
            ? 'bg-red-50 text-red-700'
            : messageTone === 'warning'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-emerald-50 text-emerald-700'
        }`}>
          {message}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[#12372D]/10 bg-white">
        <table className="min-w-[640px] w-full text-left text-[13px]">
          <thead className="bg-[#EDF4E7]">
            <tr>
              <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Order</th>
              <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Customer</th>
              <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Reason</th>
              <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Amount</th>
              <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Date</th>
              <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#12372D]/8">
            {items.map((req) => (
              <CancellationRow key={req.id} request={req} onApprove={approve} onReject={reject} pending={pending} />
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="p-6 text-center text-[13px] text-[#12372D]/55">No pending cancellation requests.</p>
        )}
      </div>

      {inFlightRefunds.length > 0 && (
        <div>
          <h2 className="font-heading text-[14px] font-bold text-[#12372D]">Refunds in progress</h2>
          <p className="mt-1 font-body text-[12px] text-[#12372D]/60">
            Approved refunds still settling with HitPay, or ones that need manual follow-up. Resolves
            automatically — no action needed unless marked &ldquo;Needs attention&rdquo;.
          </p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-[#12372D]/10 bg-white">
            <table className="min-w-[640px] w-full text-left text-[13px]">
              <thead className="bg-[#EDF4E7]">
                <tr>
                  <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Order</th>
                  <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Customer</th>
                  <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Amount</th>
                  <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Status</th>
                  <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12372D]/8">
                {inFlightRefunds.map((r) => (
                  <tr key={r.id} className="hover:bg-[#EDF4E7]/40">
                    <td className="px-4 py-3 font-heading font-semibold text-[#12372D]">{r.order_number}</td>
                    <td className="px-4 py-3 text-[#12372D]/80">{r.email}</td>
                    <td className="px-4 py-3 font-heading font-semibold text-[#12372D]">RM {r.amount_rm.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {r.status === 'exception' ? (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                          Needs attention{r.failure_reason ? ` · ${r.failure_reason}` : ''}
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          Pending with HitPay
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#12372D]/65">{format(new Date(r.requested_at), 'dd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function CancellationRow({
  request,
  onApprove,
  onReject,
  pending,
}: {
  request: PendingCancellation
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  pending: boolean
}) {
  const [rejectReason, setRejectReason] = useState('')
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle')

  return (
    <tr className="hover:bg-[#EDF4E7]/40">
      <td className="px-4 py-3 font-heading font-semibold text-[#12372D]">{request.order_number}</td>
      <td className="px-4 py-3 text-[#12372D]/80">{request.email}</td>
      <td className="px-4 py-3 text-[#12372D]/80">{request.reason}</td>
      <td className="px-4 py-3 font-heading font-semibold text-[#12372D]">RM {request.amount_rm.toFixed(2)}</td>
      <td className="px-4 py-3 text-[#12372D]/65">{format(new Date(request.requested_at), 'dd MMM yyyy')}</td>
      <td className="px-4 py-3">
        {mode === 'idle' ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => setMode('approve')}
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setMode('reject')}
              className="rounded-md bg-red-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        ) : mode === 'approve' ? (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] text-[#12372D]/70">
              Refund will be sent back to the original HitPay payment method.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => onApprove(request.id)}
                className="rounded-md bg-emerald-700 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
              >
                Confirm approve
              </button>
              <button
                type="button"
                onClick={() => setMode('idle')}
                className="rounded-md bg-white px-2 py-1 text-[11px] text-[#12372D]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection"
              className="w-48 rounded-md border border-[#12372D]/15 px-2 py-1 text-[12px]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending || !rejectReason}
                onClick={() => onReject(request.id, rejectReason)}
                className="rounded-md bg-red-700 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
              >
                Confirm reject
              </button>
              <button
                type="button"
                onClick={() => setMode('idle')}
                className="rounded-md bg-white px-2 py-1 text-[11px] text-[#12372D]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </td>
    </tr>
  )
}
