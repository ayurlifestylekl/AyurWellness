import { redirect } from 'next/navigation'
import { getCurrentUser, homeForRole } from '@/lib/auth/getCurrentUser'
import DashboardShell from '@/components/dashboard/DashboardShell'
import { adminNav, adminChrome } from '@/lib/dashboard/admin-nav'
import { productManagementNav, productManagementChrome } from '@/lib/product-management/nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser()
  if (!me) redirect('/admin/login?next=/admin/dashboard')
  // Middleware limits product managers to the Products and Inventory screens;
  // they see them inside their own portal's navigation.
  const isProductManager = me.role === 'product_manager'
  if (me.role !== 'admin' && !isProductManager) redirect(homeForRole(me.role))

  return (
    <DashboardShell
      user={{
        id: me.authId,
        fullName: me.profile.full_name ?? 'Admin',
        email: me.identifier,
        role: isProductManager ? 'product_manager' : 'admin',
      }}
      nav={isProductManager ? productManagementNav : adminNav}
      portal={isProductManager ? productManagementChrome : adminChrome}
    >
      {children}
    </DashboardShell>
  )
}
