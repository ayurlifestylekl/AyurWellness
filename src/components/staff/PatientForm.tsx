'use client'

import { useState, useTransition } from 'react'
import { useStaffBase } from '@/lib/staff/use-staff-base'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { savePatient } from '@/lib/staff/patient-actions'
import type { PatientFormValues } from '@/lib/staff/patient-form'

export type { PatientFormValues }

/** Add or edit a patient record (front desk + admin). */
export default function PatientForm({ initial, cancelHref }: { initial: PatientFormValues; cancelHref: string }) {
  const base = useStaffBase()
  const router = useRouter()
  const [v, setV] = useState<PatientFormValues>(initial)
  const [error, setError] = useState<string | null>(null)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const set = (k: keyof PatientFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((prev) => ({ ...prev, [k]: e.target.value }))
  const today = new Date().toISOString().slice(0, 10)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setExistingId(null)
    start(async () => {
      const res = await savePatient(v)
      if (res.ok) {
        router.push(`${base}/patients/${res.id}`)
        router.refresh()
      } else {
        setError(res.error)
        setExistingId(res.existingId ?? null)
      }
    })
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6 rounded-xl border border-accent/30 bg-white p-6">
      <section>
        <h3 className="mb-3 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-accent">Patient details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" required>
            <input value={v.fullName} onChange={set('fullName')} className={inp} required maxLength={120} autoComplete="off" />
          </Field>
          <Field label="Phone number" required>
            <input value={v.phone} onChange={set('phone')} className={inp} required maxLength={30} inputMode="tel" placeholder="e.g. 016-234 5678" autoComplete="off" />
          </Field>
          <Field label="Email">
            <input value={v.email} onChange={set('email')} className={inp} type="email" maxLength={254} placeholder="For booking emails and receipts" autoComplete="off" />
          </Field>
          <Field label="Gender" required>
            <select value={v.gender} onChange={set('gender')} className={inp} required>
              <option value="">Select…</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </Field>
          <Field label="Date of birth">
            <input value={v.dateOfBirth} onChange={set('dateOfBirth')} className={inp} type="date" min="1900-01-01" max={today} />
          </Field>
          <Field label="Age (years)">
            <input
              value={v.dateOfBirth ? String(ageFromDob(v.dateOfBirth, today)) : v.age}
              onChange={set('age')}
              disabled={!!v.dateOfBirth}
              className={inp}
              inputMode="numeric"
              maxLength={3}
              placeholder="If no date of birth"
              title={v.dateOfBirth ? 'Worked out from the date of birth' : undefined}
            />
          </Field>
          <Field label="Address">
            <input value={v.address} onChange={set('address')} className={inp} maxLength={300} placeholder="Optional" autoComplete="off" />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-1 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-accent">Health</h3>
        <p className="mb-3 font-body text-[12.5px] text-dark/55">Visible to front desk, the Vaidya and admin. Leave blank if none.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Existing conditions">
            <textarea value={v.conditions} onChange={set('conditions')} rows={2} className={inp} maxLength={1000} placeholder="e.g. High blood pressure, back pain" />
          </Field>
          <Field label="Allergies">
            <textarea value={v.allergies} onChange={set('allergies')} rows={2} className={inp} maxLength={1000} placeholder="e.g. Sesame oil, nuts" />
          </Field>
          <Field label="Current medications">
            <textarea value={v.medications} onChange={set('medications')} rows={2} className={inp} maxLength={1000} />
          </Field>
          <Field label="Notes">
            <textarea value={v.notes} onChange={set('notes')} rows={2} className={inp} maxLength={2000} placeholder="Preferences, how they found us…" />
          </Field>
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 font-body text-[13px] text-red-700">
          {error}
          {existingId && (
            <>
              {' '}
              <Link href={`${base}/patients/${existingId}`} className="font-semibold underline">
                Open their page →
              </Link>
            </>
          )}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button disabled={pending} className="rounded-xl bg-accent px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-white hover:bg-accent/90 disabled:opacity-60">
          {pending ? 'Saving…' : v.id ? 'Save changes' : 'Add patient'}
        </button>
        <Link href={cancelHref} className="rounded-xl border border-accent/30 px-6 py-3 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-dark/60 hover:text-primary">
          Cancel
        </Link>
      </div>
    </form>
  )
}

const inp =
  'w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
    </label>
  )
}

/** Full years from a date of birth (YYYY-MM-DD) to today (YYYY-MM-DD). */
function ageFromDob(dob: string, today: string): number {
  const [y, m, d] = dob.split('-').map(Number)
  const [ty, tm, td] = today.split('-').map(Number)
  return Math.max(0, ty - y - (tm < m || (tm === m && td < d) ? 1 : 0))
}
