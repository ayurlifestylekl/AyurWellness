import { redirect } from 'next/navigation'
import { getCurrentUser, homeForRole } from '@/lib/auth/getCurrentUser'
import DashboardShell from '@/components/dashboard/DashboardShell'
import {
  productManagementNav,
  productManagementChrome,
} from '@/lib/product-management/nav'

export default async function ProductManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const me = await getCurrentUser()
  if (!me) redirect('/product-management/login?next=/product-management')
  // Product Management has its own account (role: product_manager) and its
  // own login — it does not share sign-in with the general admin portal.
  // Admins can still enter as a fallback/oversight path.
  if (me.role !== 'admin' && me.role !== 'product_manager') redirect(homeForRole(me.role))

  return (
    <DashboardShell
      user={{
        id: me.authId,
        fullName: me.profile.full_name ?? 'Product Manager',
        email: me.identifier,
        role: me.role,
      }}
      nav={productManagementNav}
      portal={productManagementChrome}
    >
      {children}
    </DashboardShell>
  )
}
