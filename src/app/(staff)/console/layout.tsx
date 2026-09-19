import { requireStaff } from '@/lib/staff/guard'
import ConsoleShell from '@/components/staff/ConsoleShell'

export const dynamic = 'force-dynamic'

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireStaff(['admin', 'front_desk'])
  return (
    <ConsoleShell role={role}>
      {children}
    </ConsoleShell>
  )
}
