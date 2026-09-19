'use client'

import { useState, useTransition } from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { updateProfile } from '@/actions/profile/updateProfile'

interface InitialValues {
  allergies: string | null
  current_medications: string | null
  medical_conditions: string | null
  height_cm: number | null
  weight_kg: number | null
}

interface HealthIntakeFormProps {
  initial: InitialValues
}

export default function HealthIntakeForm({ initial }: HealthIntakeFormProps) {
  const [allergies, setAllergies] = useState(initial.allergies ?? '')
  const [meds, setMeds] = useState(initial.current_medications ?? '')
  const [conditions, setConditions] = useState(initial.medical_conditions ?? '')
  const [height, setHeight] = useState(initial.height_cm?.toString() ?? '')
  const [weight, setWeight] = useState(initial.weight_kg?.toString() ?? '')
  const [isPending, startTransition] = useTransition()

  const isDirty =
    allergies !== (initial.allergies ?? '') ||
    meds !== (initial.current_medications ?? '') ||
    conditions !== (initial.medical_conditions ?? '') ||
    height !== (initial.height_cm?.toString() ?? '') ||
    weight !== (initial.weight_kg?.toString() ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const heightNum = height.trim() ? Number(height) : null
    const weightNum = weight.trim() ? Number(weight) : null

    if (heightNum !== null && (!Number.isFinite(heightNum) || heightNum < 50 || heightNum > 250)) {
      toast.error('Height must be between 50 and 250 cm.')
      return
    }
    if (weightNum !== null && (!Number.isFinite(weightNum) || weightNum < 20 || weightNum > 300)) {
      toast.error('Weight must be between 20 and 300 kg.')
      return
    }

    startTransition(async () => {
      const res = await updateProfile({
        allergies: allergies || null,
        current_medications: meds || null,
        medical_conditions: conditions || null,
        height_cm: heightNum,
        weight_kg: weightNum,
      })
      if (res.ok) {
        toast.success('Health intake updated.', {
          description: 'Vaidya now has the latest information.',
        })
      } else {
        toast.error(res.error ?? "Couldn't save.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* PDPA banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#B58A3B]/25 bg-[#EDF4E7]/55 px-4 py-3.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#B58A3B]/15">
          <ShieldCheck className="h-3.5 w-3.5 text-[#B58A3B]" strokeWidth={2} />
        </span>
        <div>
          <p className="font-heading text-[12px] font-semibold text-[#006B3C]">
            Vaidya uses this to keep you safe.
          </p>
          <p className="mt-0.5 font-body text-[11.5px] text-[#12372D]/65" style={{ lineHeight: 1.55 }}>
            Allergies, medications, and conditions are visible only to the
            clinic team. Held in confidence under the Malaysian Personal Data
            Protection Act.
          </p>
        </div>
      </div>

      {/* Allergies */}
      <div>
        <label
          htmlFor="health-allergies"
          className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55"
        >
          Allergies
        </label>
        <textarea
          id="health-allergies"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          rows={3}
          maxLength={1500}
          disabled={isPending}
          placeholder="e.g. Penicillin, peanuts, sesame oil. Write &lsquo;none known&rsquo; if none."
          className="mt-2 w-full resize-y rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-3 font-body text-[13.5px] text-[#006B3C] placeholder:text-[#12372D]/40 focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 disabled:opacity-50"
          style={{ lineHeight: 1.6 }}
        />
      </div>

      {/* Current medications */}
      <div>
        <label
          htmlFor="health-meds"
          className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55"
        >
          Current medications
        </label>
        <textarea
          id="health-meds"
          value={meds}
          onChange={(e) => setMeds(e.target.value)}
          rows={3}
          maxLength={1500}
          disabled={isPending}
          placeholder="Include over-the-counter, prescriptions, supplements, and any other herbal preparations."
          className="mt-2 w-full resize-y rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-3 font-body text-[13.5px] text-[#006B3C] placeholder:text-[#12372D]/40 focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 disabled:opacity-50"
          style={{ lineHeight: 1.6 }}
        />
      </div>

      {/* Medical conditions */}
      <div>
        <label
          htmlFor="health-conditions"
          className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55"
        >
          Medical conditions
        </label>
        <textarea
          id="health-conditions"
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
          rows={3}
          maxLength={1500}
          disabled={isPending}
          placeholder="e.g. asthma, diabetes, hypertension, recent surgery, pregnancy."
          className="mt-2 w-full resize-y rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-3 font-body text-[13.5px] text-[#006B3C] placeholder:text-[#12372D]/40 focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 disabled:opacity-50"
          style={{ lineHeight: 1.6 }}
        />
      </div>

      {/* Height + weight */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="health-height"
            className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55"
          >
            Height (cm)
          </label>
          <input
            id="health-height"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={50}
            max={250}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="e.g. 172"
            disabled={isPending}
            className="mt-2 w-full rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-2.5 font-body text-[13.5px] text-[#006B3C] placeholder:text-[#12372D]/40 focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 disabled:opacity-50"
          />
        </div>
        <div>
          <label
            htmlFor="health-weight"
            className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55"
          >
            Weight (kg)
          </label>
          <input
            id="health-weight"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={20}
            max={300}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 68"
            disabled={isPending}
            className="mt-2 w-full rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-2.5 font-body text-[13.5px] text-[#006B3C] placeholder:text-[#12372D]/40 focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="group inline-flex h-11 items-center gap-2 rounded-full bg-[#006B3C] px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-all hover:bg-[#006B3C] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save health intake'}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </form>
  )
}
