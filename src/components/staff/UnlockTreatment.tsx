'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { unlockTreatment } from '@/lib/staff/actions'

/**
 * Shown on a consultation appointment. The practitioner records the outcome
 * and clears the patient for treatment. The customer can then raise the
 * treatment booking from their signed status link.
 */
export default function UnlockTreatment({
  consultationId,
  treatmentId,
  unlocked,
  outcome,
}: {
  consultationId: string
  treatmentId: string | null
  unlocked: boolean
  outcome: string | null
}) {
  const router = useRouter()
  const [note, setNote] = useState(outcome ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  // Pre-select the consulted treatment when known, so the customer doesn't re-pick.
  const bookingLink = treatmentId
    ? `/book/treatment?from=${consultationId}&id=${treatmentId}`
    : `/book/treatment?from=${consultationId}`

  const run = () => {
    setError(null)
    start(async () => {
      const res = await unlockTreatment(consultationId, note)
      if ('error' in res) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-accent/30 bg-white p-5">
      <h3 className="mb-3 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-accent">Clear for treatment</h3>
      {unlocked ? (
        <div className="space-y-3">
          <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 font-body text-[13px] text-green-800">
            Cleared for treatment. {outcome && <span className="block text-green-700">“{outcome}”</span>}
          </p>
          <a href={bookingLink} className="inline-flex rounded-lg bg-accent px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-accent/90">
            Start treatment booking →
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Outcome / recommended treatment & precautions"
            className="w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          <button onClick={run} disabled={pending || !note.trim()} className="rounded-lg bg-accent px-5 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.16em] text-white hover:bg-accent/90 disabled:opacity-60">
            {pending ? 'Saving…' : 'Clear for treatment'}
          </button>
          {error && <p className="font-body text-[12.5px] text-red-700">{error}</p>}
        </div>
      )}
    </div>
  )
}
