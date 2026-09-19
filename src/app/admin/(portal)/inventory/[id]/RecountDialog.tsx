'use client'

import { useState } from 'react'
import { recountStock } from '@/lib/admin/products/actions'

export default function RecountDialog({
  productId,
  currentSystemQty,
}: {
  productId: string
  currentSystemQty: number
}) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(currentSystemQty)
  const [reason, setReason] = useState('Physical recount')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const delta = count - currentSystemQty

  async function submit() {
    setPending(true)
    setError(null)
    const r = await recountStock({
      productId,
      newPhysicalCount: count,
      reason,
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
        className="rounded-lg border border-[#006B3C]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#006B3C] hover:bg-[#EDF4E7]/60"
      >
        Recount
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
              Recount stock
            </h2>
            <p className="mt-1 text-[11.5px] text-[#12372D]/65">
              Use this after a physical count. System will create an adjustment movement to
              reconcile system with physical.
            </p>

            <p className="mt-3 text-[12px] text-[#12372D]/65">
              System currently shows:{' '}
              <strong className="text-[#006B3C]">{currentSystemQty}</strong>
            </p>

            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Physical count *
            </label>
            <input
              type="number"
              min="0"
              value={count}
              onChange={(e) => setCount(Math.max(0, Number(e.target.value)))}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />
            {delta !== 0 ? (
              <p
                className={`mt-1 text-[11.5px] font-semibold ${
                  delta > 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                Will adjust by {delta > 0 ? '+' : ''}
                {delta}
              </p>
            ) : (
              <p className="mt-1 text-[11.5px] text-[#12372D]/55">No adjustment needed.</p>
            )}

            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Reason
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
                disabled={pending || delta === 0}
                onClick={submit}
                className="rounded-lg bg-[#006B3C] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
