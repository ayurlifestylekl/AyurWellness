'use client'

import { useState, useTransition } from 'react'
import { saveClinicalNotes } from '@/lib/staff/actions'

export default function ClinicalNotes({ id, initial }: { id: string; initial: string | null }) {
  const [notes, setNotes] = useState(initial ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const save = () => {
    setError(null)
    setSaved(false)
    start(async () => {
      const res = await saveClinicalNotes(id, notes)
      if ('error' in res) setError(res.error)
      else setSaved(true)
    })
  }

  return (
    <div className="rounded-xl border border-accent/30 bg-white p-5">
      <h3 className="mb-3 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-accent">Clinical notes</h3>
      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false) }}
        rows={6}
        placeholder="Assessment, dosha findings, plan, prescriptions…"
        className="w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
      />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={save} disabled={pending} className="rounded-lg bg-accent px-5 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.16em] text-white hover:bg-accent/90 disabled:opacity-60">
          {pending ? 'Saving…' : 'Save notes'}
        </button>
        {saved && <span className="font-body text-[12.5px] text-green-700">Saved.</span>}
        {error && <span className="font-body text-[12.5px] text-red-700">{error}</span>}
      </div>
      <p className="mt-2 font-body text-[11px] italic text-dark/45">Visible to practitioners and admin only.</p>
    </div>
  )
}
