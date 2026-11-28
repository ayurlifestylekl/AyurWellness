'use client'

import { useState, useTransition } from 'react'
import { useStaffBase } from '@/lib/staff/use-staff-base'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { recordBalanceEntry } from '@/lib/counter/actions'
import { BALANCE_KINDS, BALANCE_LABEL, PAYMENT_METHODS, balanceText, parseRm, type BalanceKind } from '@/lib/counter/rules'
import type { BalanceEntry } from '@/lib/counter/queries'

const input = 'w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[13.5px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40'
const when = (iso: string) => new Date(iso).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' })

/** Money that "comes in" at the counter for these: ask how it was paid. */
function takesMoney(kind: BalanceKind, direction: 'add' | 'deduct') {
  return (direction === 'add' && (kind === 'deposit' || kind === 'gift_card')) || (direction === 'deduct' && kind === 'outstanding')
}

/**
 * A patient's credit, deposit, gift card, points and outstanding amount, with
 * a history and a form to add or deduct (front desk + admin).
 */
export default function BalancesPanel({ patientId, totals, entries }: { patientId: string; totals: Record<BalanceKind, number>; entries: BalanceEntry[] }) {
  const base = useStaffBase()
  const router = useRouter()
  const [kind, setKind] = useState<BalanceKind>('deposit')
  const [direction, setDirection] = useState<'add' | 'deduct'>('add')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<string>('cash')
  const [note, setNote] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const money = takesMoney(kind, direction)

  const save = () => {
    const value = parseRm(amount)
    if (value == null || value <= 0) { setError('Enter an amount, e.g. 50 or 50.00.'); return }
    setError(null)
    start(async () => {
      const res = await recordBalanceEntry({ patientId, kind, direction, amount: value, note, paymentMethod: money ? method : null })
      if (!res.ok) { setError(res.error); return }
      setAmount('')
      setNote('')
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <section className="rounded-2xl border border-accent/20 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-[15px] font-bold text-primary">Balances</h2>
        <button type="button" onClick={() => setOpen((o) => !o)} className="rounded-lg border border-accent/30 px-3 py-1.5 font-heading text-[10px] font-bold uppercase tracking-[0.12em] text-primary hover:bg-cream/60">
          {open ? 'Close' : 'Add / deduct'}
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {BALANCE_KINDS.map((k) => (
          <div key={k} className={`rounded-xl border px-3 py-2 ${k === 'outstanding' && totals[k] > 0 ? 'border-amber-300 bg-amber-50' : 'border-accent/15 bg-cream/40'}`}>
            <dt className="font-heading text-[9.5px] font-bold uppercase tracking-[0.12em] text-dark/55">{BALANCE_LABEL[k]}</dt>
            <dd className={`mt-0.5 font-body text-[15px] font-semibold tabular-nums ${k === 'outstanding' && totals[k] > 0 ? 'text-amber-800' : 'text-primary'}`}>{balanceText(k, totals[k])}</dd>
          </div>
        ))}
      </dl>

      {open && (
        <div className="mt-3 grid gap-2 rounded-xl border border-accent/20 bg-cream/30 p-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.12em] text-dark/55">Balance</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as BalanceKind)} className={input}>
              {BALANCE_KINDS.map((k) => <option key={k} value={k}>{BALANCE_LABEL[k]}</option>)}
            </select>
          </label>
          <div>
            <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.12em] text-dark/55">Action</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(['add', 'deduct'] as const).map((d) => (
                <button key={d} type="button" aria-pressed={direction === d} onClick={() => setDirection(d)} className={`rounded-lg border px-2 py-2 font-body text-[13px] ${direction === d ? 'border-accent bg-accent text-white' : 'border-accent/25 bg-white hover:bg-cream'}`}>
                  {kind === 'outstanding' ? (d === 'add' ? 'Add owed' : 'Settle') : d === 'add' ? 'Add' : 'Deduct'}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.12em] text-dark/55">{kind === 'points' ? 'Points' : 'Amount (RM)'}</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" className={`${input} text-right tabular-nums`} />
          </label>
          {money ? (
            <label className="block">
              <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.12em] text-dark/55">Paid by</span>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={input}>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </label>
          ) : (
            <div className="hidden sm:block" />
          )}
          <label className="block sm:col-span-2">
            <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.12em] text-dark/55">Reason {money ? '(optional)' : ''}</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder={money ? 'e.g. Deposit for 5-session course' : 'e.g. Birthday credit, refund as credit'} className={input} />
          </label>
          {error && <p className="font-body text-[12.5px] text-red-700 sm:col-span-2">{error}</p>}
          <button type="button" onClick={save} disabled={pending} className="rounded-lg bg-accent px-4 py-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-white hover:bg-accent/90 disabled:opacity-60 sm:col-span-2">
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      {entries.length > 0 && (
        <ul className="mt-3 divide-y divide-accent/10">
          {entries.slice(0, 15).map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-3 py-2 font-body text-[12.5px]">
              <span className="min-w-0">
                <span className="font-semibold text-dark">{BALANCE_LABEL[e.kind]}</span>
                <span className="text-dark/55"> · {e.note ?? (e.saleId ? 'Bill' : 'Adjustment')}</span>
                {e.paymentMethod && <span className="text-dark/55"> · {PAYMENT_METHODS.find((m) => m.value === e.paymentMethod)?.label}</span>}
                <span className="block text-[11px] text-dark/40">
                  {when(e.createdAt)}
                  {e.staffName ? ` · ${e.staffName}` : ''}
                  {e.saleId && <> · <Link href={`${base}/checkout/${e.saleId}/receipt`} className="text-accent underline">receipt</Link></>}
                </span>
              </span>
              <span className={`flex-none font-semibold tabular-nums ${e.amount < 0 ? 'text-dark/60' : 'text-primary'}`}>
                {e.amount > 0 ? '+' : '−'}{balanceText(e.kind, Math.abs(e.amount))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
