'use client'

import { useState, useTransition } from 'react'
import { submitWholesalePaymentProof } from '@/lib/agent/wholesale-orders/actions'

export default function PaymentProofForm({
  orderId,
  existingUrl,
}: {
  orderId: string
  existingUrl: string | null
}) {
  const [url, setUrl] = useState(existingUrl ?? '')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const r = await submitWholesalePaymentProof({
        orderId,
        paymentProofUrl: url,
        note: note || undefined,
      })
      if (!r.ok) setError(r.error)
      else setSuccess(true)
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="mt-4 flex flex-col gap-2 rounded-2xl bg-white p-3"
    >
      <label className="flex flex-col gap-1">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#12372D]/70">
          Receipt URL *
        </span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a Google Drive / Dropbox link to your transfer screenshot"
          className="rounded-lg border border-[#12372D]/15 bg-white px-3 py-2 text-[13px]"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#12372D]/70">
          Payment note (optional)
        </span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Transferred 23 May, ref ABC123"
          className="rounded-lg border border-[#12372D]/15 bg-white px-3 py-2 text-[13px]"
        />
      </label>

      {existingUrl ? (
        <p className="text-[11px] text-emerald-700">
          ✓ Receipt already submitted ·{' '}
          <a
            href={existingUrl}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            view
          </a>
          . You can re-submit a new link below if needed.
        </p>
      ) : null}

      {error ? (
        <p className="text-[11.5px] text-red-700">⚠ {error}</p>
      ) : null}
      {success ? (
        <p className="text-[11.5px] text-emerald-700">
          ✓ Receipt submitted. Admin will confirm shortly.
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || !url.trim()}
          className="rounded-lg bg-[#149447] px-4 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#12372D] disabled:opacity-50"
        >
          {pending ? 'Submitting…' : existingUrl ? 'Update receipt' : 'Submit receipt'}
        </button>
      </div>
    </form>
  )
}
