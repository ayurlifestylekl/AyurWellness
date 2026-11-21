'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Receipt } from 'lucide-react'
import { createBill } from '@/lib/counter/actions'

/** Opens a bill (cart) for a saved patient or a visit and goes straight to it. */
export default function StartBillButton({ patientId, appointmentId, label = 'New bill' }: { patientId?: string; appointmentId?: string; label?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null)
            const res = await createBill({ patientId, appointmentId })
            if (!res.ok) { setError(res.error); return }
            router.push(`/console/checkout/${res.id}`)
          })
        }
        className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-primary/40 bg-white px-4 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary hover:bg-cream/60 disabled:opacity-60"
      >
        <Receipt className="h-4 w-4" /> {pending ? 'Opening…' : label}
      </button>
      {error && <span className="mt-1 max-w-[220px] font-body text-[11.5px] text-red-700">{error}</span>}
    </span>
  )
}
