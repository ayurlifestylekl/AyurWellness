'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { closeDay, openDay, reopenDay } from '@/lib/counter/day-actions'
import { DENOMINATIONS, breakdownTotal, cashDifference, type CashBreakdown } from '@/lib/counter/day'
import { parseRm, rm } from '@/lib/counter/rules'

const field = 'rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40'
const btn = 'rounded-lg bg-accent px-5 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-accent/90 disabled:opacity-50'

export function OpenDayForm({ day }: { day: string }) {
  const router = useRouter()
  const [float, setFloat] = useState('')
  const [byNotes, setByNotes] = useState(false)
  const [notes, setNotes] = useState<CashBreakdown>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  return (
    <div className="space-y-3">
    <CountToggle on={byNotes} setOn={setByNotes} />
    {byNotes && <CashCount value={notes} onChange={setNotes} />}
    <div className="flex flex-wrap items-end gap-3">
      {!byNotes && (
      <label>
        <span className="mb-1 block font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-dark/55">Cash float in the drawer (RM)</span>
        <input value={float} onChange={(e) => setFloat(e.target.value)} inputMode="decimal" placeholder="0.00" className={`${field} w-40 text-right tabular-nums`} />
      </label>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const v = byNotes ? breakdownTotal(notes) : float.trim() ? parseRm(float) : 0
          if (v == null) { setError('Enter an amount, e.g. 200.'); return }
          start(async () => {
            const res = await openDay({ day, floatRm: v, ...(byNotes ? { breakdown: notes } : {}) })
            if (!res.ok) { setError(res.error); return }
            router.refresh()
          })
        }}
        className={btn}
      >
        {pending ? 'Opening…' : byNotes ? `Open the day · float ${rm(breakdownTotal(notes))}` : 'Open the day'}
      </button>
      {error && <p className="w-full font-body text-[12.5px] text-red-700">{error}</p>}
    </div>
    </div>
  )
}

export function CloseDayForm({ day, expectedRm, countByNotes = false }: { day: string; expectedRm: number; countByNotes?: boolean }) {
  const router = useRouter()
  const [counted, setCounted] = useState('')
  // Counted the same way the day was opened, unless they change it.
  const [byNotes, setByNotes] = useState(countByNotes)
  const [cash, setCash] = useState<CashBreakdown>({})
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const countedRm = byNotes ? breakdownTotal(cash) : counted.trim() ? parseRm(counted) : null
  const diff = countedRm != null ? cashDifference(countedRm, expectedRm) : null
  return (
    <div className="space-y-3">
      <CountToggle on={byNotes} setOn={setByNotes} />
      {byNotes && <CashCount value={cash} onChange={setCash} />}
      <div className="flex flex-wrap items-end gap-4">
        {byNotes ? (
          <div className="font-body text-[13.5px]">
            <div className="text-dark/55">Cash counted</div>
            <div className="font-semibold tabular-nums">{rm(countedRm ?? 0)}</div>
          </div>
        ) : (
        <label>
          <span className="mb-1 block font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-dark/55">Cash counted (RM)</span>
          <input value={counted} onChange={(e) => setCounted(e.target.value)} inputMode="decimal" placeholder={expectedRm.toFixed(2)} className={`${field} w-40 text-right tabular-nums`} />
        </label>
        )}
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
            const res = await closeDay({ day, countedRm, notes, ...(byNotes ? { breakdown: cash } : {}) })
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

function CountToggle({ on, setOn }: { on: boolean; setOn: (v: boolean) => void }) {
  return (
    <label className="flex w-fit cursor-pointer items-center gap-2 font-body text-[13.5px] text-dark">
      <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="h-4 w-4 accent-accent" />
      Count by notes and coins
    </label>
  )
}

/** Quantity of each note and coin; the amount and total fill in as they type. */
export function CashCount({ value, onChange }: { value: CashBreakdown; onChange: (v: CashBreakdown) => void }) {
  const set = (key: keyof CashBreakdown, text: string) => {
    const n = text.replace(/\D/g, '').slice(0, 6)
    onChange({ ...value, [key]: n ? Number(n) : 0 })
  }
  return (
    <table className="w-full max-w-md border-collapse font-body text-[13px]">
      <thead>
        <tr className="border-b border-accent/20 text-left text-dark/55">
          <th className="py-1.5 font-semibold">Note / coin</th>
          <th className="py-1.5 text-center font-semibold">Quantity</th>
          <th className="py-1.5 text-right font-semibold">Amount</th>
        </tr>
      </thead>
      <tbody>
        {DENOMINATIONS.map((d) => {
          const q = value[d.key] ?? 0
          return (
            <tr key={d.key} className="border-b border-accent/10">
              <td className="py-1">{d.label}</td>
              <td className="py-1 text-center">
                <input
                  value={q ? String(q) : ''}
                  onChange={(e) => set(d.key, e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  aria-label={`Number of ${d.label}`}
                  className={`${field} w-20 py-1 text-center tabular-nums`}
                />
              </td>
              <td className="py-1 text-right tabular-nums">{rm((q * d.sen) / 100)}</td>
            </tr>
          )
        })}
      </tbody>
      <tfoot>
        <tr>
          <td className="pt-2 font-heading text-[12px] font-bold uppercase tracking-[0.08em] text-primary" colSpan={2}>Total</td>
          <td className="pt-2 text-right font-heading text-[15px] font-extrabold tabular-nums text-primary">{rm(breakdownTotal(value))}</td>
        </tr>
      </tfoot>
    </table>
  )
}

/** A saved breakdown, for the day report. */
export function BreakdownLines({ title, value }: { title: string; value: CashBreakdown }) {
  const rows = DENOMINATIONS.filter((d) => (value[d.key] ?? 0) > 0)
  if (!rows.length) return null
  return (
    <div className="mt-2">
      <p className="font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-dark/55">{title}</p>
      <p className="font-body text-[12.5px] text-dark/70">
        {rows.map((d) => `${d.label} × ${value[d.key]}`).join(' · ')} = <strong>{rm(breakdownTotal(value))}</strong>
      </p>
    </div>
  )
}
