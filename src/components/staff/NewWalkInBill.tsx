'use client'

import { useState, useTransition } from 'react'
import { useStaffBase } from '@/lib/staff/use-staff-base'
import { useRouter } from 'next/navigation'
import ClientLookup from './ClientLookup'
import { createBill } from '@/lib/counter/actions'

const field = 'w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40'

/** Start a bill for anyone at the counter: find a returning client or type a name. */
export default function NewWalkInBill() {
  const base = useStaffBase()
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const go = () =>
    start(async () => {
      setError(null)
      const res = await createBill({ customerName: name, customerPhone: phone || undefined })
      if (!res.ok) { setError(res.error); return }
      router.push(`${base}/checkout/${res.id}`)
    })
  return (
    <section className="rounded-2xl border border-accent/20 bg-white p-4">
      <h2 className="font-heading text-[15px] font-bold text-primary">New bill</h2>
      <div className="mt-3">
        <ClientLookup onPick={(c) => { setName(c.name); setPhone(c.phone ?? '') }} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="block">
          <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">Customer name *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">Phone (to find their packages)</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={field} />
        </label>
        <button type="button" onClick={go} disabled={pending || !name.trim()} className="h-[42px] rounded-lg bg-accent px-5 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-accent/90 disabled:opacity-50">
          {pending ? 'Opening…' : 'Start bill'}
        </button>
      </div>
      {error && <p className="mt-2 font-body text-[12.5px] text-red-700">{error}</p>}
    </section>
  )
}
