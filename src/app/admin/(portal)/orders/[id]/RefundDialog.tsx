'use client'

import { useState } from 'react'
import { recordRefund } from '@/lib/admin/orders/actions'

type RefundMethod = 'cash' | 'bank_transfer' | 'billplz' | 'fpx' | 'card' | 'cod'

export default function RefundDialog({
  orderId,
  totalRm,
}: {
  orderId: string
  totalRm: number
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(totalRm.toString())
  const [reason, setReason] = useState('')
  const [method, setMethod] = useState<RefundMethod>('bank_transfer')
  const [ref, setRef] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setPending(true)
    setError(null)
    const r = await recordRefund({
      orderId,
      amountRm: Number(amount),
      reason,
      refundMethod: method,
      gatewayRef: ref || undefined,
    })
    setPending(false)
    if (!r.ok) setError(r.error)
    else location.reload()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-700 hover:bg-red-100"
      >
        Record refund
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
              Record refund
            </h2>
            <p className="mt-1 text-[11px] text-[#12372D]/55">
              Order total: RM {totalRm.toFixed(2)}. The actual money movement
              must be processed via HitPay / bank separately.
            </p>

            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Amount (RM)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />

            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />

            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as RefundMethod)}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            >
              <option value="bank_transfer">Bank transfer</option>
              <option value="cash">Cash</option>
              <option value="billplz">Billplz</option>
              <option value="fpx">FPX</option>
              <option value="card">Card</option>
              <option value="cod">COD</option>
            </select>

            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Reference (optional)
            </label>
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="HitPay refund ID or bank ref"
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />

            {error ? <p className="mt-3 text-[12px] text-red-600">{error}</p> : null}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-[#006B3C]/15 px-3 py-1.5 text-[12px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending || !reason.trim() || !amount}
                onClick={submit}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                Record
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
