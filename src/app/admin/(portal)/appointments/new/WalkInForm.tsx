'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createWalkInAppointment } from '@/lib/admin/appointments/actions'

type Mode = 'in-person' | 'virtual'
type Gender = 'male' | 'female' | ''
type GenderReq = 'any' | 'men_only' | 'ladies_only'

export default function WalkInForm({
  treatmentOptions,
}: {
  treatmentOptions: string[]
}) {
  const router = useRouter()
  const [walkInName, setWalkInName] = useState('')
  const [walkInPhone, setWalkInPhone] = useState('')
  const [walkInEmail, setWalkInEmail] = useState('')
  const [walkInGender, setWalkInGender] = useState<Gender>('')
  const [treatmentName, setTreatmentName] = useState(treatmentOptions[0] ?? '')
  const [doctorName, setDoctorName] = useState('our Vaidya')
  const [whenISO, setWhenISO] = useState(() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  })
  const [durationMins, setDurationMins] = useState(60)
  const [mode, setMode] = useState<Mode>('in-person')
  const [room, setRoom] = useState('')
  const [advance, setAdvance] = useState('')
  const [notes, setNotes] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [genderRequirement, setGenderRequirement] = useState<GenderReq>('any')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Live warning if requirement set and customer gender doesn't match
  const genderWarning = (() => {
    if (genderRequirement === 'any' || !walkInGender) return null
    if (genderRequirement === 'men_only' && walkInGender !== 'male') {
      return 'This treatment is men-only but customer is female.'
    }
    if (genderRequirement === 'ladies_only' && walkInGender !== 'female') {
      return 'This treatment is ladies-only but customer is male.'
    }
    return null
  })()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!walkInPhone.trim()) return setError('Phone is required so we can send booking notifications.')
    if (!walkInEmail.trim()) return setError('Email is required so we can send booking notifications.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(walkInEmail.trim())) return setError('Please enter a valid email address.')
    startTransition(async () => {
      const r = await createWalkInAppointment({
        customerId: null,
        walkInName,
        walkInPhone: walkInPhone.trim(),
        walkInEmail: walkInEmail.trim(),
        walkInGender: walkInGender || undefined,
        treatmentName,
        doctorName,
        appointmentDateTime: new Date(whenISO).toISOString(),
        durationMins,
        mode,
        room: room || undefined,
        advancePaymentRm: advance ? Number(advance) : undefined,
        notes: notes || undefined,
        internalNote: internalNote || undefined,
        genderRequirement,
      })
      if (!r.ok) {
        setError(r.error)
        return
      }
      const id = (r as { ok: true; data?: { appointmentId: string } }).data?.appointmentId
      if (id) router.push(`/admin/appointments/${id}`)
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <legend className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          Customer (walk-in)
        </legend>
        <input
          required
          placeholder="Full name *"
          value={walkInName}
          onChange={(e) => setWalkInName(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
        />
        <input
          required
          placeholder="Phone *"
          value={walkInPhone}
          onChange={(e) => setWalkInPhone(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
        />
        <input
          type="email"
          required
          placeholder="Email *"
          value={walkInEmail}
          onChange={(e) => setWalkInEmail(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
        />
        <label className="mt-2 flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
            Gender (needed for gender-segregated therapies)
          </span>
          <select
            value={walkInGender}
            onChange={(e) => setWalkInGender(e.target.value as Gender)}
            className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
          >
            <option value="">Not specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <legend className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          Treatment + slot
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Treatment *
            </span>
            <input
              list="treatment-options"
              required
              value={treatmentName}
              onChange={(e) => setTreatmentName(e.target.value)}
              className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />
            <datalist id="treatment-options">
              {treatmentOptions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Vaidya
            </span>
            <input
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />
          </label>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              When *
            </span>
            <input
              type="datetime-local"
              required
              value={whenISO}
              onChange={(e) => setWhenISO(e.target.value)}
              className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Duration (min)
            </span>
            <input
              type="number"
              min="15"
              step="15"
              value={durationMins}
              onChange={(e) => setDurationMins(Number(e.target.value))}
              className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Mode
            </span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            >
              <option value="in-person">In-person</option>
              <option value="virtual">Virtual</option>
            </select>
          </label>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            placeholder="Room (optional)"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Advance payment (RM, optional)"
            value={advance}
            onChange={(e) => setAdvance(e.target.value)}
            className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
          />
        </div>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
            Gender rule (clinic policy: gender-segregated therapies)
          </span>
          <select
            value={genderRequirement}
            onChange={(e) => setGenderRequirement(e.target.value as GenderReq)}
            className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
          >
            <option value="any">Any gender — consultations, online sessions</option>
            <option value="men_only">Men only — therapy for male customers</option>
            <option value="ladies_only">Ladies only — therapy for female customers</option>
          </select>
          {genderWarning ? (
            <p className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11.5px] text-amber-800">
              ⚠️ {genderWarning} The system will block creation.
            </p>
          ) : null}
        </label>
      </fieldset>

      <fieldset className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <legend className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          Notes
        </legend>
        <label className="mt-2 flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
            Customer note (visible to customer)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
          />
        </label>
        <label className="mt-2 flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
            Internal note (staff-only)
          </span>
          <textarea
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            rows={2}
            className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
          />
        </label>
      </fieldset>

      {error ? <p className="text-[12px] text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={pending || !walkInName || !walkInPhone || !walkInEmail || !treatmentName || !whenISO}
        className="rounded-lg bg-[#006B3C] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#006B3C] disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Create walk-in appointment'}
      </button>
    </form>
  )
}
