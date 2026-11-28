'use client'

import { Pill, Plus } from 'lucide-react'

export interface PrescribedLine {
  medicine: string
  dose: string
  duration: string
  /** The shop product it matches, if any. */
  productId: string | null
  productName: string | null
  onBill: boolean
}

/**
 * The doctor's latest prescription for this patient, on the bill. Medicines
 * that match a product the centre sells can be added in one tap.
 */
export default function PrescriptionPanel({
  lines,
  sheetDate,
  doctor,
  disabled,
  onAdd,
}: {
  lines: PrescribedLine[]
  sheetDate: string
  doctor: string | null
  disabled?: boolean
  onAdd: (productId: string) => void
}) {
  if (!lines.length) return null
  const when = new Date(`${sheetDate}T00:00:00+08:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' })
  return (
    <section className="mb-4 rounded-2xl border border-emerald-700/25 bg-emerald-50/60 p-4" aria-label="Prescribed by the doctor">
      <h2 className="flex items-center gap-2 font-heading text-[13px] font-bold text-primary">
        <Pill className="h-4 w-4 text-emerald-700" aria-hidden /> Prescribed by the doctor
        <span className="font-body text-[12px] font-normal text-dark/55">· case sheet of {when}{doctor ? ` · ${doctor}` : ''}</span>
      </h2>
      <ul className="mt-2 divide-y divide-emerald-700/10">
        {lines.map((l, i) => (
          <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
            <span className="min-w-0 flex-1">
              <span className="block font-body text-[13.5px] font-semibold text-dark">{l.medicine}</span>
              <span className="block font-body text-[12px] text-dark/60">{[l.dose, l.duration].filter(Boolean).join(' · ') || '—'}</span>
            </span>
            {l.productId ? (
              l.onBill ? (
                <span className="font-body text-[12px] font-semibold text-emerald-700">✓ On the bill</span>
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onAdd(l.productId!)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 font-heading text-[10.5px] font-bold uppercase tracking-[0.08em] text-white hover:bg-emerald-800 disabled:opacity-50"
                  title={l.productName ?? undefined}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden /> Add {l.productName}
                </button>
              )
            ) : (
              <span className="font-body text-[12px] italic text-dark/45">Not a shop product: add it under Products or Billing items</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
