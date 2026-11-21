import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/staff/guard'
import { getPatientRecord } from '@/lib/staff/patients'
import { getCaseSheet } from '@/lib/staff/patient-files'
import { ageGenderText } from '@/lib/staff/case-sheets'
import { formatPatientNo } from '@/lib/staff/patient-id'
import { mytDayKey } from '@/lib/datetime'
import CaseSheetEditor from '@/components/staff/CaseSheetEditor'
import DeleteCaseSheetButton from '@/components/staff/DeleteCaseSheetButton'

export const dynamic = 'force-dynamic'

export default async function EditCaseSheetPage({ params }: { params: { id: string } }) {
  const { db } = await requireStaff(['admin', 'doctor'])
  const sheet = await getCaseSheet(db, params.id)
  const record = sheet ? await getPatientRecord(db, sheet.patientId) : null
  if (!sheet || !record) notFound()
  const today = mytDayKey(new Date())

  return (
    <div>
      <CaseSheetEditor
        patientId={record.id}
        kind={sheet.kind}
        sheetId={sheet.id}
        initialDate={sheet.sheetDate}
        initialData={sheet.data}
        today={today}
        header={{ name: record.fullName, ageGender: ageGenderText(record.dateOfBirth, record.gender, today), registrationNo: formatPatientNo(record.patientNo) }}
        cancelHref={`/doctor/case-sheets/${sheet.id}`}
        viewBase="/doctor/case-sheets"
      />
      <div className="mx-auto mt-8 max-w-4xl border-t border-accent/15 pt-4">
        <DeleteCaseSheetButton id={sheet.id} afterHref={`/doctor/patients/${record.id}`} />
      </div>
    </div>
  )
}
