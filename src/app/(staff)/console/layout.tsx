import { requireStaff } from '@/lib/staff/guard'
import ConsoleShell from '@/components/staff/ConsoleShell'

export const dynamic = 'force-dynamic'

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { db, role, userId } = await requireStaff(['admin', 'front_desk'])
  const { data: me } = await db.from('users').select('full_name').eq('id', userId).maybeSingle()
  return (
    <ConsoleShell role={role} userName={(me as { full_name: string | null } | null)?.full_name ?? 'Front Desk'}>
      {children}
    </ConsoleShell>
  )
}
