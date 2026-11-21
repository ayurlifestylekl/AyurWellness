import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { requireStaff } from '@/lib/staff/guard'
import { getPatientRecord } from '@/lib/staff/patients'
import { getCaseSheet, listCaseSheets } from '@/lib/staff/patient-files'
import { SHEETS, ageGenderText } from '@/lib/staff/case-sheets'
import { formatPatientNo } from '@/lib/staff/patient-id'
import { mytDayKey } from '@/lib/datetime'
import CaseSheetView from '@/components/staff/CaseSheetView'
import PrintButton from '@/components/staff/PrintButton'

export const dynamic = 'force-dynamic'

const fmtDay = (ymd: string) =>
  new Date(`${ymd}T12:00:00+08:00`).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric' })

/** One saved case sheet, with the patient's other sheets alongside (date-wise history). */
export default async function CaseSheetPage({ params }: { params: { id: string } }) {
  const { db } = await requireStaff(['admin', 'doctor'])
  const sheet = await getCaseSheet(db, params.id)
  const record = sheet ? await getPatientRecord(db, sheet.patientId) : null
  if (!sheet || !record) notFound()
  const all = await listCaseSheets(db, record.id)
  const today = mytDayKey(new Date())

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/doctor/patients/${record.id}`} className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-dark/50 hover:text-primary">
          ← {record.fullName}
        </Link>
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          <Link
            href={`/doctor/case-sheets/${sheet.id}/edit`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent px-4 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-white hover:bg-accent/90"
          >
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <CaseSheetView
            kind={sheet.kind}
            data={sheet.data}
            sheetDate={sheet.sheetDate}
            header={{ name: record.fullName, ageGender: ageGenderText(record.dateOfBirth, record.gender, today), registrationNo: formatPatientNo(record.patientNo) }}
          />
          {sheet.updatedByName && (
            <p className="mt-2 text-right font-body text-[11.5px] italic text-dark/45">
              Last updated by {sheet.updatedByName}, {new Date(sheet.updatedAt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
        </div>
        <nav aria-label="All case sheets" className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-dark/50">All sheets</p>
          <ul className="space-y-1">
            {all.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/doctor/case-sheets/${s.id}`}
                  aria-current={s.id === sheet.id ? 'page' : undefined}
                  className={`block rounded-lg border px-3 py-2 font-body text-[12.5px] ${s.id === sheet.id ? 'border-accent bg-cream' : 'border-accent/15 bg-white hover:bg-cream/60'}`}
                >
                  <span className="block font-semibold text-primary">{fmtDay(s.sheetDate)}</span>
                  <span className="text-dark/60">{SHEETS[s.kind].short}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
