'use client'

import { useState } from 'react'
import { moveOrderStatus, cancelOrderAdmin } from '@/lib/admin/orders/actions'
import { nextStatuses, type FulfillmentStatus } from '@/lib/admin/orders/status-transitions'

export default function StatusTransitionDialog({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: FulfillmentStatus
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const options = nextStatuses(currentStatus)

  async function go(to: FulfillmentStatus) {
    if (to === 'cancelled') {
      setConfirmCancel(true)
      return
    }
    setPending(true)
    setError(null)
    const r = await moveOrderStatus(orderId, to)
    setPending(false)
    if (!r.ok) setError(r.error)
    else {
      setOpen(false)
      location.reload()
    }
  }

  async function doCancel() {
    setPending(true)
    setError(null)
    const r = await cancelOrderAdmin(orderId, cancelReason)
    setPending(false)
    if (!r.ok) setError(r.error)
    else location.reload()
  }

  if (options.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[#006B3C] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#006B3C]"
      >
        Move status
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
              {confirmCancel ? 'Cancel order' : 'Move status'}
            </h2>
            {!confirmCancel ? (
              <>
                <p className="mt-1 text-[12px] text-[#12372D]/65">
                  From <strong>{currentStatus}</strong> to:
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {options.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={pending}
                      onClick={() => go(s)}
                      className={`rounded-lg border px-3 py-2 text-left text-[13px] hover:bg-[#EDF4E7]/60 ${
                        s === 'cancelled'
                          ? 'border-red-200 text-red-700'
                          : 'border-[#006B3C]/15 text-[#006B3C]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-[12px] text-[#12372D]/65">
                  Reason (at least 5 characters):
                </p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    className="rounded-lg border border-[#006B3C]/15 px-3 py-1.5 text-[12px]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={pending || cancelReason.trim().length < 5}
                    onClick={doCancel}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                  >
                    Cancel order
                  </button>
                </div>
              </>
            )}
            {error ? <p className="mt-3 text-[12px] text-red-600">{error}</p> : null}
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setConfirmCancel(false)
              }}
              className="mt-4 text-[12px] text-[#12372D]/55"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
