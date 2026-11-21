import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/staff/guard'
import { getAppointmentDetail } from '@/lib/staff/appointments'
import { findPatientRecordFor, getPatientRecord, getPatientVisits } from '@/lib/staff/patients'
import PatientProfile from '@/components/staff/PatientProfile'
import { listCaseSheets, listPatientPhotos } from '@/lib/staff/patient-files'

export const dynamic = 'force-dynamic'

export default async function DoctorPatientProfilePage({ params }: { params: { id: string } }) {
  const { db, role } = await requireStaff(['admin', 'doctor'])
  const booking = await getAppointmentDetail(db, params.id)
  const record = booking ? await findPatientRecordFor(db, booking) : await getPatientRecord(db, params.id)
  if (!booking && !record) notFound()

  const who = booking ?? { patientPhone: record!.phone, customerId: null, patientName: record!.fullName }
  const visits = await getPatientVisits(db, who)
  const latest = booking ?? (visits[0] ? await getAppointmentDetail(db, visits[0].id) : null)
  const [caseSheets, photos] = record
    ? await Promise.all([listCaseSheets(db, record.id), listPatientPhotos(db, record.id)])
    : [[], []]

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
    />
  )
}
