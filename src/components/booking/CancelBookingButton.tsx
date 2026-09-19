'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelBooking } from '@/lib/booking/actions'

export default function CancelBookingButton({ id, token }: { id: string; token?: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const doCancel = () => {
    setError(null)
    start(async () => {
      const res = await cancelBooking(id, token)
      if ('error' in res) setError(res.error)
      else router.refresh()
    })
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full rounded-xl border border-red-300 px-6 py-3 font-heading text-[10.5px] font-bold uppercase tracking-[0.2em] text-red-600 hover:bg-red-50"
      >
        Cancel booking
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-4">
      <p className="font-body text-[13px] text-red-800">
        Cancel this booking? Your held slot will be released — no payment has been made, so there is nothing to refund.
      </p>
      {error && <p className="mt-2 font-body text-[12.5px] text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button onClick={doCancel} disabled={pending} className="rounded-lg bg-red-600 px-4 py-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.16em] text-white hover:bg-red-700 disabled:opacity-60">
          {pending ? 'Cancelling…' : 'Yes, cancel'}
        </button>
        <button onClick={() => setConfirming(false)} disabled={pending} className="rounded-lg border border-dark/20 px-4 py-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.16em] text-dark/60 hover:bg-white">
          Keep it
        </button>
      </div>
    </div>
  )
}
