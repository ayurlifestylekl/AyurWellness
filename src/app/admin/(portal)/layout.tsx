import { redirect } from 'next/navigation'
import { getCurrentUser, homeForRole } from '@/lib/auth/getCurrentUser'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { adminNav, adminChrome } from '@/lib/dashboard/admin-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login?next=/admin/dashboard')
  if (me.role !== 'admin') redirect(homeForRole(me.role))

  return (
    <DashboardShell
      user={{
        id: me.authId,
        fullName: me.profile.full_name ?? 'Admin',
        email: me.identifier,
        role: me.role,
      }}
      nav={adminNav}
      portal={adminChrome}
    >
      {children}
    </DashboardShell>
  )
}
