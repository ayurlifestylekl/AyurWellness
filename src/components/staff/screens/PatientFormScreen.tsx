import Link from 'next/link'
import { currentAge } from '@/lib/staff/case-sheets'

const todayMY = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date())
import { notFound } from 'next/navigation'
import type { ServiceDb } from '@/lib/staff/guard'
import type { StaffBase } from '@/lib/staff/use-staff-base'
import { getAppointmentDetail } from '@/lib/staff/appointments'
import { getPatientRecord } from '@/lib/staff/patients'
import PatientForm from '@/components/staff/PatientForm'
import { EMPTY_PATIENT, type PatientFormValues } from '@/lib/staff/patient-form'

/**
 * Add a patient (blank), edit one (?edit=<record id>), or save the details of
 * someone who has only booked so far (?from=<booking id>).
 */
export default async function PatientFormScreen({ db, base, searchParams }: { db: ServiceDb; base: StaffBase; searchParams: { edit?: string; from?: string } }) {

  let initial: PatientFormValues = EMPTY_PATIENT
  let back = `${base}/patients`
  if (searchParams.edit) {
    const r = await getPatientRecord(db, searchParams.edit)
    if (!r) notFound()
    initial = {
      id: r.id,
      fullName: r.fullName,
      phone: r.phone,
      email: r.email ?? '',
      gender: r.gender,
      dateOfBirth: r.dateOfBirth ?? '',
      age: r.dateOfBirth ? '' : String(currentAge(null, todayMY(), { ageYears: r.ageYears, recordedOn: r.ageRecordedOn }) ?? ''),
      address: r.address ?? '',
      conditions: r.conditions ?? '',
      allergies: r.allergies ?? '',
      medications: r.medications ?? '',
      notes: r.notes ?? '',
    }
    back = `${base}/patients/${r.id}`
  } else if (searchParams.from) {
    const a = await getAppointmentDetail(db, searchParams.from)
    if (a) {
      const h = a.healthIntake ?? {}
      initial = {
        ...EMPTY_PATIENT,
        fullName: a.patientName ?? '',
        phone: a.patientPhone ?? '',
        email: a.patientEmail ?? '',
        gender: a.patientGender ?? '',
        conditions: h.conditions ?? '',
        allergies: h.allergies ?? '',
        medications: h.medications ?? '',
      }
      back = `${base}/patients/${a.id}`
    }
  }

  return (
    <div>
      <Link href={back} className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-dark/50 hover:text-primary">
        ← Back
      </Link>
      <h1 className="mt-3 font-heading text-[22px] font-extrabold text-primary">{initial.id ? 'Edit patient' : 'Add patient'}</h1>
      <p className="mb-5 font-body text-[13px] text-dark/55">
        {initial.id
          ? 'Update this patient’s details. Their bookings keep the details they were made with.'
          : 'Save a patient’s details once. They’ll appear in Patients and in the “Returning client?” search when booking, and link to their bookings by phone number and first name.'}
      </p>
      <PatientForm initial={initial} cancelHref={back} />
    </div>
  )
}
