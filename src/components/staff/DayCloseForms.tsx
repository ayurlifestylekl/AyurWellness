'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { closeDay, openDay, reopenDay } from '@/lib/counter/day-actions'
import { cashDifference } from '@/lib/counter/day'
import { parseRm, rm } from '@/lib/counter/rules'

const field = 'rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40'
const btn = 'rounded-lg bg-accent px-5 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-accent/90 disabled:opacity-50'

export function OpenDayForm({ day }: { day: string }) {
  const router = useRouter()
  const [float, setFloat] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label>
        <span className="mb-1 block font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-dark/55">Cash float in the drawer (RM)</span>
        <input value={float} onChange={(e) => setFloat(e.target.value)} inputMode="decimal" placeholder="0.00" className={`${field} w-40 text-right tabular-nums`} />
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const v = float.trim() ? parseRm(float) : 0
          if (v == null) { setError('Enter an amount, e.g. 200.'); return }
          start(async () => {
            const res = await openDay({ day, floatRm: v })
            if (!res.ok) { setError(res.error); return }
            router.refresh()
          })
        }}
        className={btn}
      >
        {pending ? 'Opening…' : 'Open the day'}
      </button>
      {error && <p className="w-full font-body text-[12.5px] text-red-700">{error}</p>}
    </div>
  )
}

export function CloseDayForm({ day, expectedRm }: { day: string; expectedRm: number }) {
  const router = useRouter()
  const [counted, setCounted] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const countedRm = counted.trim() ? parseRm(counted) : null
  const diff = countedRm != null ? cashDifference(countedRm, expectedRm) : null
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        <label>
          <span className="mb-1 block font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-dark/55">Cash counted (RM)</span>
          <input value={counted} onChange={(e) => setCounted(e.target.value)} inputMode="decimal" placeholder={expectedRm.toFixed(2)} className={`${field} w-40 text-right tabular-nums`} />
        </label>
        <div className="font-body text-[13.5px]">
          <div className="text-dark/55">Expected</div>
          <div className="font-semibold tabular-nums">{rm(expectedRm)}</div>
        </div>
        {diff != null && (
          <div className="font-body text-[13.5px]">
            <div className="text-dark/55">Difference</div>
            <div className={`font-semibold tabular-nums ${diff === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {diff === 0 ? 'Balanced' : `${diff > 0 ? 'Over' : 'Short'} ${rm(Math.abs(diff))}`}
            </div>
          </div>
        )}
      </div>
      <label className="block">
        <span className="mb-1 block font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-dark/55">Notes {diff ? '(required — explain the difference)' : '(optional)'}</span>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} className={`${field} w-full`} />
      </label>
      {error && <p className="font-body text-[12.5px] text-red-700">{error}</p>}
      <button
        type="button"
        disabled={pending || countedRm == null}
        onClick={() => {
          if (countedRm == null) return
          if (!confirm('Close the day? The figures are saved as they are now.')) return
          start(async () => {
            const res = await closeDay({ day, countedRm, notes })
            if (!res.ok) { setError(res.error); return }
            router.refresh()
          })
        }}
        className={btn}
      >
        {pending ? 'Closing…' : 'Close the day'}
      </button>
    </div>
  )
}

export function ReopenDayButton({ day }: { day: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('Reopen this day? The closing count will be cleared and done again.')) return
        start(async () => {
          const res = await reopenDay(day)
          if (!res.ok) alert(res.error)
          router.refresh()
        })
      }}
      className="rounded-lg border border-accent/30 px-4 py-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary hover:bg-cream/60 disabled:opacity-50"
    >
      {pending ? 'Reopening…' : 'Reopen day (admin)'}
    </button>
  )
}
