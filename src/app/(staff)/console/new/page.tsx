import Link from 'next/link'
import { requireStaff } from '@/lib/staff/guard'
import { getTreatmentsFlat } from '@/lib/storefront/treatments'
import { therapistsForGender } from '@/lib/staff/therapists'
import StaffNewBooking from '@/components/staff/StaffNewBooking'
import { getAppointmentDetail } from '@/lib/staff/appointments'
import { getPatientRecord } from '@/lib/staff/patients'
import { toServiceOptions } from '@/lib/staff/services'

export const dynamic = 'force-dynamic'

export default async function NewBookingPage({ searchParams }: { searchParams: { client?: string; patient?: string } }) {
  const { db } = await requireStaff(['admin', 'front_desk'])
  const [treatments, therapists, from, record] = await Promise.all([
    getTreatmentsFlat(db),
    therapistsForGender(null),
    // "New booking" from a patient's page pre-fills their details — from their
    // latest booking (?client=) or their saved record (?patient=).
    searchParams.client ? getAppointmentDetail(db, searchParams.client) : Promise.resolve(null),
    searchParams.patient ? getPatientRecord(db, searchParams.patient) : Promise.resolve(null),
  ])
  const initialClient = record
    ? { name: record.fullName, phone: record.phone, email: record.email ?? '', gender: record.gender }
    : from
      ? { name: from.patientName ?? '', phone: from.patientPhone ?? '', email: from.patientEmail ?? '', gender: from.patientGender ?? null }
      : null
  const options = toServiceOptions(treatments)

  return (
    <div>
      <Link href="/console" className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-dark/50 hover:text-primary">
        ← Console
      </Link>
      <h1 className="mt-3 font-heading text-[22px] font-extrabold text-primary">New booking</h1>
      <p className="mb-5 font-body text-[13px] text-dark/55">Log a walk-in or phone booking on the customer&apos;s behalf. You&apos;ll approve &amp; assign on the next screen.</p>
      <StaffNewBooking treatments={options} therapists={therapists} initialClient={initialClient} />
    </div>
  )
}
