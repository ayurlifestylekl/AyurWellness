import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/staff/guard'
import { getPatientRecord } from '@/lib/staff/patients'
import { ageGenderText, emptySheetData, isCaseSheetKind } from '@/lib/staff/case-sheets'
import { formatPatientNo } from '@/lib/staff/patient-id'
import { mytDayKey } from '@/lib/datetime'
import CaseSheetEditor from '@/components/staff/CaseSheetEditor'

export const dynamic = 'force-dynamic'

/** A new primary or follow-up case sheet for a saved patient (Vaidyas + admin). */
export default async function NewCaseSheetPage({ searchParams }: { searchParams: { patient?: string; kind?: string } }) {
  const { db } = await requireStaff(['admin', 'doctor'])
  const record = searchParams.patient ? await getPatientRecord(db, searchParams.patient) : null
  if (!record || !isCaseSheetKind(searchParams.kind)) notFound()
  const today = mytDayKey(new Date())

  return (
    <CaseSheetEditor
      patientId={record.id}
      kind={searchParams.kind}
      initialDate={today}
      initialData={emptySheetData(searchParams.kind)}
      today={today}
      header={{ name: record.fullName, ageGender: ageGenderText(record.dateOfBirth, record.gender, today), registrationNo: formatPatientNo(record.patientNo) }}
      cancelHref={`/doctor/patients/${record.id}`}
      viewBase="/doctor/case-sheets"
    />
  )
}
