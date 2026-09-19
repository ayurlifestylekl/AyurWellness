'use client'

import { useState } from 'react'
import { receiveStock } from '@/lib/admin/products/actions'

export default function ReceiveStockDialog({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false)
  const [qty, setQty] = useState(0)
  const [cost, setCost] = useState('')
  const [expiry, setExpiry] = useState('')
  const [notes, setNotes] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setPending(true)
    setError(null)
    const r = await receiveStock({
      productId,
      quantity: qty,
      costPriceRm: cost ? Number(cost) : undefined,
      expiryDate: expiry || undefined,
      notes: notes || undefined,
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
        className="rounded-lg bg-[#006B3C] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#006B3C]"
      >
        Receive stock
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
              Receive stock
            </h2>
            <p className="mt-1 text-[11.5px] text-[#12372D]/65">
              Use this when stock physically arrives. The system will add the quantity and log
              the batch for traceability.
            </p>

            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Quantity received *
            </label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />

            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Cost per unit (RM, optional)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />

            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Batch expiry date (optional)
            </label>
            <input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />

            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Supplier ref, PO number, etc."
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
                disabled={pending || qty <= 0}
                onClick={submit}
                className="rounded-lg bg-[#006B3C] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                Receive
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
