import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { requireStaff } from '@/lib/staff/guard'
import { filterPatients, getPatientList } from '@/lib/staff/patients'
import PatientDirectory from '@/components/staff/PatientDirectory'

export const dynamic = 'force-dynamic'

export default async function ConsolePatientsPage({ searchParams }: { searchParams: { q?: string } }) {
  const { db } = await requireStaff(['admin', 'front_desk'])
  const all = await getPatientList(db)
  const q = (searchParams.q ?? '').trim()

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-[22px] font-extrabold text-primary">Patients</h1>
        <Link
          href="/console/patients/new"
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent px-4 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-white hover:bg-accent/90"
        >
          <UserPlus className="h-4 w-4" /> Add patient
        </Link>
      </div>
      <p className="mb-5 font-body text-[13px] text-dark/55">
        Everyone who has booked. Open a patient to see their contact, health details and every visit, or start a new booking for them.
      </p>
      <PatientDirectory patients={filterPatients(all, q, true)} total={all.length} query={q} basePath="/console/patients" hideContact={false} />
    </div>
  )
}
