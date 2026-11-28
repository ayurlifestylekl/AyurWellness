import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/staff/guard'
import { getAppointmentDetail } from '@/lib/staff/appointments'
import { findPatientRecordFor, getPatientRecord, getPatientVisits } from '@/lib/staff/patients'
import PatientProfile from '@/components/staff/PatientProfile'
import { listCaseSheets, listPatientPhotos } from '@/lib/staff/patient-files'
import { getPatientBalances, listBillsFor } from '@/lib/counter/queries'

export const dynamic = 'force-dynamic'

export default async function DoctorPatientProfilePage({ params }: { params: { id: string } }) {
  const { db, role } = await requireStaff(['admin', 'doctor'])
  const booking = await getAppointmentDetail(db, params.id)
  const record = booking ? await findPatientRecordFor(db, booking) : await getPatientRecord(db, params.id)
  if (!booking && !record) notFound()

  const who = booking ?? { patientPhone: record!.phone, customerId: null, patientName: record!.fullName }
  const visits = await getPatientVisits(db, who)
  const latest = booking ?? (visits[0] ? await getAppointmentDetail(db, visits[0].id) : null)
  const [caseSheets, photos, bills, balances] = await Promise.all([
    record ? listCaseSheets(db, record.id) : Promise.resolve([]),
    record ? listPatientPhotos(db, record.id) : Promise.resolve([]),
    // Doctors can bill too, so their patient page shows the bills (and a New bill button).
    listBillsFor(db, { patientId: record?.id ?? null, appointmentIds: visits.map((v) => v.id) }),
    record ? getPatientBalances(db, record.id) : Promise.resolve(null),
  ])

  return (
    <PatientProfile
      patient={latest}
      record={record}
      visits={visits}
      backHref="/doctor/patients"
      visitLinkBase="/doctor"
      hideContact={role === 'doctor'}
      showClinical
      caseSheets={caseSheets}
      photos={photos}
      canDeletePhotos
      bills={bills}
      balances={balances}
      editHref={record ? `/doctor/patients/new?edit=${record.id}` : latest ? `/doctor/patients/new?from=${latest.id}` : undefined}
    />
  )
}
