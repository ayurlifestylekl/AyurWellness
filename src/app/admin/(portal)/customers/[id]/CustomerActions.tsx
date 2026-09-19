'use client'

import { useState, useTransition } from 'react'
import {
  blockCustomer,
  unblockCustomer,
  sendPasswordResetForCustomer,
} from '@/lib/admin/customers/actions'

export default function CustomerActions({
  customerId,
  isBlocked,
  blockedReason,
}: {
  customerId: string
  isBlocked: boolean
  blockedReason: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [reason, setReason] = useState('')

  function showResult(ok: boolean, msg: string) {
    if (ok) setMessage(msg)
    else setError(msg)
    setTimeout(() => {
      setMessage(null)
      setError(null)
    }, 4000)
  }

  function doReset() {
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const r = await sendPasswordResetForCustomer(customerId)
      showResult(r.ok, r.ok ? 'Password reset email sent.' : r.error)
    })
  }

  function doBlock() {
    setError(null)
    startTransition(async () => {
      const r = await blockCustomer(customerId, reason)
      if (r.ok) {
        setConfirmBlock(false)
        showResult(true, 'Customer blocked.')
        location.reload()
      } else {
        setError(r.error)
      }
    })
  }

  function doUnblock() {
    startTransition(async () => {
      const r = await unblockCustomer(customerId)
      showResult(r.ok, r.ok ? 'Customer unblocked.' : r.error)
      if (r.ok) location.reload()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={doReset}
        className="rounded-lg border border-[#006B3C]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#006B3C] hover:bg-[#EDF4E7]/60 disabled:opacity-50"
      >
        Send password reset
      </button>
      <a
        href={`/admin/customers/${customerId}/export`}
        target="_blank"
        rel="noopener"
        className="rounded-lg border border-[#006B3C]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#006B3C] hover:bg-[#EDF4E7]/60"
      >
        Export PDPA data
      </a>
      {isBlocked ? (
        <button
          type="button"
          disabled={pending}
          onClick={doUnblock}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        >
          Unblock
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmBlock(true)}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          Block
        </button>
      )}

      {message ? (
        <span className="text-[11.5px] text-emerald-700">{message}</span>
      ) : null}
      {error ? (
        <span className="text-[11.5px] text-red-700">{error}</span>
      ) : null}

      {isBlocked && blockedReason ? (
        <p className="basis-full text-[11.5px] italic text-red-700">
          Blocked reason: {blockedReason}
        </p>
      ) : null}

      {confirmBlock ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h2 className="font-heading text-[16px] font-semibold text-[#006B3C]">
              Block this customer?
            </h2>
            <p className="mt-1 text-[11.5px] text-[#12372D]/65">
              They won&apos;t be able to sign in. Reversible at any time.
            </p>
            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />
            {error ? <p className="mt-2 text-[12px] text-red-600">{error}</p> : null}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmBlock(false)}
                className="rounded-lg border border-[#006B3C]/15 px-3 py-1.5 text-[12px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending || reason.trim().length < 3}
                onClick={doBlock}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
