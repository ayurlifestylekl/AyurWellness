'use client'

import { useState } from 'react'
import { markOrderShipped } from '@/lib/admin/orders/actions'
import { supportedCarriers, type Carrier } from '@/lib/admin/orders/tracking-urls'

export default function TrackingDialog({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const [carrier, setCarrier] = useState<Carrier>('Pos Laju')
  const [tracking, setTracking] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setPending(true)
    setError(null)
    const r = await markOrderShipped(orderId, carrier, tracking.trim())
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
        Add tracking + ship
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">Tracking</h2>
            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Carrier
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value as Carrier)}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            >
              {supportedCarriers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Tracking number
            </label>
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
              placeholder="e.g. PL123456789MY"
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
                disabled={pending || !tracking.trim()}
                onClick={submit}
                className="rounded-lg bg-[#006B3C] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                Save + mark shipped
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
