'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addVisitRemark } from '@/lib/staff/patient-file-actions'

export interface RemarkItem {
  id: string
  body: string
  authorName: string | null
  createdAt: string
}

/** A visit's record stays as it was; staff add dated remarks underneath instead. */
export default function VisitRemarks({ appointmentId, remarks }: { appointmentId: string; remarks: RemarkItem[] }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const add = () => {
    setError(null)
    start(async () => {
      const res = await addVisitRemark({ appointmentId, body })
      if (!res.ok) { setError(res.error); return }
      setBody('')
      router.refresh()
    })
  }

  return (
    <section className="rounded-2xl border border-accent/20 bg-white p-4">
      <h2 className="font-heading text-[15px] font-bold text-primary">Remarks</h2>
      <p className="font-body text-[12px] text-dark/50">This visit’s record can’t be changed. Add a remark to note anything after the fact.</p>
      {remarks.length > 0 && (
        <ul className="mt-3 space-y-2">
          {remarks.map((r) => (
            <li key={r.id} className="rounded-lg border border-accent/15 bg-cream/40 px-3 py-2">
              <p className="whitespace-pre-wrap font-body text-[13.5px] text-dark">{r.body}</p>
              <p className="mt-1 font-body text-[11px] text-dark/45">
                {r.authorName ?? 'Staff'} · {new Date(r.createdAt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </li>
          ))}
        </ul>
      )}
      <textarea
        rows={2}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1000}
        placeholder="Add a remark…"
        aria-label="New remark"
        className="mt-3 w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[13.5px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
      />
      {error && <p className="mt-1 font-body text-[12.5px] text-red-700">{error}</p>}
      <button
        type="button"
        onClick={add}
        disabled={pending || !body.trim()}
        className="mt-2 rounded-lg bg-accent px-4 py-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-white hover:bg-accent/90 disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add remark'}
      </button>
    </section>
  )
}
