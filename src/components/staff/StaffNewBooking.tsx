'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { BookingKind, Gender } from '@/types/booking'
import type { Therapist } from '@/lib/staff/therapist-format'
import { createBookingRequest, createGroupBooking, type GroupGuest } from '@/lib/booking/actions'

interface TreatmentOption {
  id: string
  title: string
  bookingType?: string | null
}

interface Props {
  treatments: TreatmentOption[]
  therapists: Therapist[]
}

export default function StaffNewBooking({ treatments, therapists }: Props) {
  const router = useRouter()
  const [kind, setKind] = useState<BookingKind>('treatment')
  const [treatmentId, setTreatmentId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [preferredAt, setPreferredAt] = useState('')
  const [notes, setNotes] = useState('')
  const [partySize, setPartySize] = useState(1)
  const [extraGuests, setExtraGuests] = useState<{ name: string; gender: Gender | ''; therapistCode: string }[]>([])
  const [assignedTherapist, setAssignedTherapist] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  // Walk-in bookings exclude enquiry-only therapies.
  const bookable = treatments.filter((t) => t.bookingType !== 'enquiry')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!gender) return setError('Select a gender for therapist matching.')
    if (!preferredAt) return setError('Choose a date & time.')
    if (kind === 'treatment' && !treatmentId) return setError('Choose a treatment.')

    start(async () => {
      const iso = new Date(preferredAt).toISOString()
      const healthIntake = notes ? { notes } : {}

      const allGuests: GroupGuest[] = []
      if (name.trim() && gender) {
        allGuests.push({ name: name.trim(), gender, preferredAt: iso, treatmentId, healthIntake, assignedTherapistCode: assignedTherapist.trim() || null })
      }
      for (const g of extraGuests) {
        if (g.name.trim() && g.gender) {
          allGuests.push({ name: g.name.trim(), gender: g.gender, preferredAt: iso, treatmentId, healthIntake, assignedTherapistCode: g.therapistCode.trim() || null })
        }
      }

      const res = partySize > 1
        ? await createGroupBooking({
            treatmentId,
            patientPhone: phone,
            patientEmail: email,
            isGuest: true,
            acceptedPolicies: true,
            guests: allGuests,
          })
        : await createBookingRequest({
            treatmentId: kind === 'treatment' ? treatmentId : null,
            bookingKind: kind,
            preferredAt: iso,
            patientName: name,
            patientPhone: phone,
            patientEmail: email,
            patientGender: gender,
            isGuest: true,
            healthIntake,
            acceptedPolicies: true,
          })
      if ('error' in res) setError(res.error)
      else router.push(`/console/${res.id}`)
    })
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4 rounded-xl border border-accent/30 bg-white p-6">
      <div className="flex gap-2">
        {(['treatment', 'consultation'] as BookingKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-full border px-4 py-1.5 font-heading text-[11px] font-bold uppercase tracking-[0.12em] ${
              kind === k ? 'border-accent bg-accent text-white' : 'border-accent/30 text-dark/60'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {kind === 'treatment' && (
        <Field label="Treatment">
          <select value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)} className={inp}>
            <option value="">Select…</option>
            {bookable.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Patient name"><input value={name} onChange={(e) => setName(e.target.value)} className={inp} required /></Field>
        <Field label="Contact number"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} required /></Field>
        <Field label="Email (optional)"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={inp} /></Field>
        <Field label="Gender">
          <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className={inp}>
            <option value="">Select…</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </Field>
        <Field label="Therapist">
          <select value={assignedTherapist} onChange={(e) => setAssignedTherapist(e.target.value)} className={inp}>
            <option value="">Auto / later</option>
            {therapists.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Preferred date & time"><input type="datetime-local" value={preferredAt} onChange={(e) => setPreferredAt(e.target.value)} className={inp} /></Field>
        <Field label="Party size">
          <select value={partySize} onChange={(e) => { const n = Number(e.target.value); setPartySize(n); setExtraGuests(Array.from({ length: Math.max(0, n - 1) }, () => ({ name: '', gender: '' as Gender | '', therapistCode: '' }))) }} className={inp}>
            {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>)}
          </select>
        </Field>
      </div>

      {partySize > 1 && (
        <div className="space-y-3 rounded-xl border border-accent/20 bg-cream/40 p-4">
          <p className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-dark/60">Additional guests</p>
          {extraGuests.map((g, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-3">
              <Field label={`Guest ${i + 2} name`}><input value={g.name} onChange={(e) => setExtraGuests((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className={inp} /></Field>
              <Field label={`Guest ${i + 2} gender`}>
                <select value={g.gender} onChange={(e) => setExtraGuests((prev) => prev.map((x, j) => j === i ? { ...x, gender: e.target.value as Gender } : x))} className={inp}>
                  <option value="">Select…</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </Field>
              <Field label={`Guest ${i + 2} therapist`}>
                <select value={g.therapistCode} onChange={(e) => setExtraGuests((prev) => prev.map((x, j) => j === i ? { ...x, therapistCode: e.target.value } : x))} className={inp}>
                  <option value="">Auto / later</option>
                  {therapists.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
                </select>
              </Field>
            </div>
          ))}
        </div>
      )}

      <Field label="Notes (optional)"><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inp} placeholder="Health notes, requests…" /></Field>

      {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 font-body text-[13px] text-red-700">{error}</p>}

      <button disabled={pending} className="rounded-xl bg-accent px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-white hover:bg-accent/90 disabled:opacity-60">
        {pending ? 'Creating…' : 'Create booking'}
      </button>
    </form>
  )
}

const inp = 'w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">{label}</span>
      {children}
    </label>
  )
}
