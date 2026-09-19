import { requireStaff } from '@/lib/staff/guard'
import { getConsultationsToClear } from '@/lib/staff/appointments'
import DoctorShell from '@/components/staff/DoctorShell'

export const dynamic = 'force-dynamic'

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { db, role } = await requireStaff(['admin', 'doctor'])
  const toClear = await getConsultationsToClear(db)
  return (
    <DoctorShell role={role} toClearCount={toClear.length}>
      {children}
    </DoctorShell>
  )
}
