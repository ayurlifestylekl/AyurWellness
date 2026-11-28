'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PenLine, X } from 'lucide-react'
import SignaturePad from './SignaturePad'
import { signBill } from '@/lib/counter/actions'

/**
 * "Sign for claim": the customer signs the receipt on the tablet. The receipt
 * and PDF then carry the signature and an empty box for the company stamp.
 * Only for customers who ask; other receipts stay as they are.
 */
export default function SignForClaim({ billId, customerName, signed }: { billId: string; customerName: string; signed: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [png, setPng] = useState<string | null>(null)
  const [name, setName] = useState(customerName)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const save = (value: string | null) =>
    start(async () => {
      setError(null)
      const res = await signBill(billId, value ? { png: value, name } : { png: null })
      if (!res.ok) { setError(res.error ?? 'Could not save.'); return }
      setOpen(false)
      setPng(null)
      router.refresh()
    })

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-primary/40 px-4 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary hover:bg-cream/60"
      >
        <PenLine className="h-4 w-4" /> {signed ? 'Sign again' : 'Sign for claim'}
      </button>
      {signed && (
        <button type="button" disabled={pending} onClick={() => { if (confirm('Remove the signature from this receipt?')) save(null) }} className="font-body text-[12px] text-dark/50 underline hover:text-red-700">
          Remove signature
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Sign the receipt" className="relative w-full max-w-xl rounded-2xl bg-white p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-dark/50 hover:text-primary">
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-heading text-[18px] font-extrabold text-primary">Sign the receipt</h2>
            <p className="mt-1 font-body text-[13px] text-dark/60">For an insurance or company claim. Hand the tablet to the customer to sign in the box.</p>
            <label className="mt-4 block">
              <span className="mb-1 block font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-dark/55">Name of the person signing</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className="w-full rounded-lg border border-accent/30 px-3 py-2 font-body text-[14px] focus:border-accent focus:outline-none" />
            </label>
            <div className="mt-4">
              <SignaturePad onChange={setPng} height={220} />
            </div>
            {error && <p className="mt-3 font-body text-[13px] text-red-700">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-accent/30 px-5 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-dark/70">Cancel</button>
              <button type="button" disabled={!png || !name.trim() || pending} onClick={() => save(png)} className="rounded-lg bg-primary px-5 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-40">
                {pending ? 'Saving…' : 'Save signature'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
