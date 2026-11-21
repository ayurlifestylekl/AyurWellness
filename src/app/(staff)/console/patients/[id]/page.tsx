import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/staff/guard'
import { getAppointmentDetail } from '@/lib/staff/appointments'
import { findPatientRecordFor, getPatientRecord, getPatientVisits } from '@/lib/staff/patients'
import PatientProfile from '@/components/staff/PatientProfile'
import { listCaseSheets, listPatientPhotos } from '@/lib/staff/patient-files'
import { listBillsFor } from '@/lib/counter/queries'

export const dynamic = 'force-dynamic'

/** A patient's page, opened through their latest booking or their saved record. */
export default async function ConsolePatientPage({ params }: { params: { id: string } }) {
  const { db, role } = await requireStaff(['admin', 'front_desk'])
  const booking = await getAppointmentDetail(db, params.id)
  const record = booking ? await findPatientRecordFor(db, booking) : await getPatientRecord(db, params.id)
  if (!booking && !record) notFound()

  const who = booking ?? { patientPhone: record!.phone, customerId: null, patientName: record!.fullName }
  const visits = await getPatientVisits(db, who)
  // A record-only patient has no booking yet; the newest booking (if any) carries the health intake.
  const latest = booking ?? (visits[0] ? await getAppointmentDetail(db, visits[0].id) : null)
  // Case sheets are clinical: admin sees them here, front desk doesn't.
  const [caseSheets, photos, bills] = await Promise.all([
    role === 'admin' && record ? listCaseSheets(db, record.id) : Promise.resolve(role === 'admin' ? [] : undefined),
    record ? listPatientPhotos(db, record.id) : Promise.resolve([]),
    listBillsFor(db, { patientId: record?.id ?? null, appointmentIds: visits.map((v) => v.id) }),
  ])

  return (
    <PatientProfile
      patient={latest}
      record={record}
      visits={visits}
      backHref="/console/patients"
      visitLinkBase="/console"
      hideContact={false}
      showClinical={false}
      newBookingHref={`/console/new?${record && !latest ? `patient=${record.id}` : `client=${latest!.id}`}`}
      editHref={record ? `/console/patients/new?edit=${record.id}` : `/console/patients/new?from=${latest!.id}`}
      caseSheets={caseSheets}
      photos={photos}
      canDeletePhotos={role === 'admin'}
      bills={bills}
    />
  )
}
