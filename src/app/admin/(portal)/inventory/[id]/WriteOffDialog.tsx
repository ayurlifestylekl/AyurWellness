'use client'

import { useState } from 'react'
import { writeOffStock } from '@/lib/admin/products/actions'

export default function WriteOffDialog({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false)
  const [qty, setQty] = useState(0)
  const [reason, setReason] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setPending(true)
    setError(null)
    const r = await writeOffStock({ productId, quantity: qty, reason })
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
        Write off
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
              Write off stock
            </h2>
            <p className="mt-1 text-[11.5px] text-[#12372D]/65">
              For damaged, expired, or lost stock. This decreases stock and is permanent.
            </p>

            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Quantity to write off *
            </label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />

            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Damaged in transit, expired, etc."
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
                disabled={pending || qty <= 0 || reason.trim().length < 3}
                onClick={submit}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                Write off
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
