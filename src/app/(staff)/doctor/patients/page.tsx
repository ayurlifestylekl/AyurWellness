import { requireStaff } from '@/lib/staff/guard'
import { filterPatients, getPatientList } from '@/lib/staff/patients'
import PatientDirectory from '@/components/staff/PatientDirectory'

export const dynamic = 'force-dynamic'

export default async function DoctorPatientsPage({ searchParams }: { searchParams: { q?: string } }) {
  const { db, role } = await requireStaff(['admin', 'doctor'])
  const hideContact = role === 'doctor' // doctors may not see contact details (PDPA)
  const all = await getPatientList(db)
  const q = (searchParams.q ?? '').trim()

  return (
    <div>
      <h1 className="font-heading text-[22px] font-extrabold text-primary">Patients</h1>
      <p className="mb-5 font-body text-[13px] text-dark/55">
        Everyone who has booked. Search by {hideContact ? 'name' : 'name or phone'}, then open a patient to see every visit, notes and outcomes.
      </p>
      <PatientDirectory
        patients={filterPatients(all, q, !hideContact)}
        total={all.length}
        query={q}
        basePath="/doctor/patients"
        hideContact={hideContact}
      />
    </div>
  )
}
