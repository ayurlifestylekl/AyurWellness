'use client'

import { useState } from 'react'
import { addInternalNote } from '@/lib/admin/orders/actions'

export default function InternalNotesPanel({
  orderId,
  initial,
}: {
  orderId: string
  initial: string | null
}) {
  const [val, setVal] = useState(initial ?? '')
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setPending(true)
    setError(null)
    setSaved(false)
    const r = await addInternalNote(orderId, val.trim())
    setPending(false)
    if (!r.ok) setError(r.error)
    else setSaved(true)
  }

  return (
    <div className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
          Internal notes
        </h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#12372D]/55">
          Staff-only
        </span>
      </div>
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        rows={3}
        placeholder="Notes never shown to the customer."
        className="mt-2 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
      />
      {error ? <p className="mt-2 text-[12px] text-red-600">{error}</p> : null}
      {saved ? (
        <p className="mt-2 text-[12px] text-emerald-700">Saved.</p>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="mt-2 rounded-lg border border-[#006B3C]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#006B3C] disabled:opacity-50"
      >
        Save
      </button>
    </div>
  )
}
