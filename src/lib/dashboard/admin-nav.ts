import type { NavItem, PortalChrome } from './nav-types'
import { COMMERCE_ENABLED } from '@/lib/admin/features'

/** Clinic-only Command Center modules — always shown. */
export const clinicAdminNav: NavItem[] = [
  { label: 'Overview', href: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Appointments', href: '/admin/appointments', icon: 'calendar', group: 'Clinic' },
  { label: 'Customers', href: '/admin/customers', icon: 'users', group: 'Clinic' },
  { label: 'Leads', href: '/admin/leads', icon: 'inbox', group: 'Clinic' },
  { label: 'Messages', href: '/admin/messages', icon: 'message-square', group: 'Clinic' },
  { label: 'Reviews', href: '/admin/reviews', icon: 'star', group: 'Clinic' },
]

const systemAdminNav: NavItem[] = [
  { label: 'Audit', href: '/admin/audit', icon: 'history', group: 'System' },
  { label: 'Settings', href: '/admin/settings', icon: 'settings', group: 'System' },
]

/**
 * Commerce + partner stack (products, inventory, orders, marketplace,
 * agents, wholesale, vouchers, brand partners, finance). Rendered whenever
 * `COMMERCE_ENABLED` is on (the default) — set
 * NEXT_PUBLIC_COMMERCE_ENABLED=false to hold it back again.
 */
export const commerceAdminNav: NavItem[] = [
  { label: 'Products', href: '/admin/products', icon: 'shopping-bag', group: 'Shop' },
  { label: 'Inventory', href: '/admin/inventory', icon: 'boxes', group: 'Shop' },
  { label: 'Orders', href: '/admin/orders', icon: 'clipboard-list', group: 'Shop' },
  { label: 'Marketplace', href: '/admin/marketplace-orders', icon: 'store', group: 'Shop' },
  { label: 'Agent Submissions', href: '/admin/agent-submissions', icon: 'inbox', group: 'Shop' },
  { label: 'Wholesale Orders', href: '/admin/wholesale-orders', icon: 'package', group: 'Shop' },
  { label: 'Vouchers', href: '/admin/promos', icon: 'gift', group: 'Growth' },
  { label: 'Brand Partners', href: '/admin/partners', icon: 'sparkles', group: 'Growth' },
  { label: 'Finance', href: '/admin/finance', icon: 'bar-chart', group: 'Growth' },
]

export function getAdminNav(commerceEnabled: boolean): NavItem[] {
  return commerceEnabled
    ? [...clinicAdminNav, ...commerceAdminNav, ...systemAdminNav]
    : [...clinicAdminNav, ...systemAdminNav]
}

export const adminNav = getAdminNav(COMMERCE_ENABLED)
export const adminNavArchived = commerceAdminNav

export const adminChrome: PortalChrome = {
  label: 'Command Center',
  shortName: 'Admin',
}
