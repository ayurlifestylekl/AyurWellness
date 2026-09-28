import { requireStaff } from '@/lib/staff/guard'
import { getConsultationsToClear } from '@/lib/staff/appointments'
import DoctorShell from '@/components/staff/DoctorShell'

export const dynamic = 'force-dynamic'

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { db, role, userId } = await requireStaff(['admin', 'doctor'])
  const [toClear, { data: me }] = await Promise.all([
    getConsultationsToClear(db),
    db.from('users').select('full_name').eq('id', userId).maybeSingle(),
  ])
  return (
    <DoctorShell role={role} userName={(me as { full_name: string | null } | null)?.full_name ?? 'Vaidya'} toClearCount={toClear.length}>
      {children}
    </DoctorShell>
  )
}
