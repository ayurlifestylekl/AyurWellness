import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { listNotifications } from '@/lib/notifications/queries'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { accountNav, accountChrome } from '@/lib/dashboard/account-nav'
import { homeForRole } from '@/lib/auth/getCurrentUser'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser()
  if (!me) redirect('/auth/login?next=/account/dashboard')
  // Middleware already redirects wrong-role users; this is defense in depth.
  if (me.role !== 'customer') redirect(homeForRole(me.role))

  const supabase = await createClient()
  const initialNotifications = await listNotifications(supabase, me.authId, 30)

  return (
    <DashboardShell
      user={{
        id: me.authId,
        fullName: me.profile.full_name ?? 'Member',
        email: me.identifier,
        role: me.role,
        avatarUrl: me.profile.avatar_url,
      }}
      nav={accountNav}
      portal={accountChrome}
      initialNotifications={initialNotifications}
    >
      {children}
    </DashboardShell>
  )
}
