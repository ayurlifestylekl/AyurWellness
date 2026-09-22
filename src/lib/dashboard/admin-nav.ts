import type { NavItem, PortalChrome } from './nav-types'
import { COMMERCE_ENABLED } from '@/lib/admin/features'

/** Clinic-only Command Center modules — always shown. */
export const clinicAdminNav: NavItem[] = [
  { label: 'Overview', href: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Appointments', href: '/admin/appointments', icon: 'calendar' },
  { label: 'Customers', href: '/admin/customers', icon: 'users' },
  { label: 'Leads', href: '/admin/leads', icon: 'inbox' },
  { label: 'Messages', href: '/admin/messages', icon: 'message-square' },
  { label: 'Reviews', href: '/admin/reviews', icon: 'star' },
  { label: 'Audit', href: '/admin/audit', icon: 'history' },
  { label: 'Settings', href: '/admin/settings', icon: 'settings' },
]

/**
 * Commerce + partner stack (products, inventory, orders, marketplace,
 * agents, wholesale, vouchers, brand partners, finance). Rendered whenever
 * `COMMERCE_ENABLED` is on (the default) — set
 * NEXT_PUBLIC_COMMERCE_ENABLED=false to hold it back again.
 */
export const commerceAdminNav: NavItem[] = [
  { label: 'Products', href: '/admin/products', icon: 'shopping-bag' },
  { label: 'Inventory', href: '/admin/inventory', icon: 'boxes' },
  { label: 'Orders', href: '/admin/orders', icon: 'clipboard-list' },
  { label: 'Marketplace', href: '/admin/marketplace-orders', icon: 'store' },
  { label: 'Agent Submissions', href: '/admin/agent-submissions', icon: 'inbox' },
  { label: 'Wholesale Orders', href: '/admin/wholesale-orders', icon: 'package' },
  { label: 'Vouchers', href: '/admin/promos', icon: 'gift' },
  { label: 'Brand Partners', href: '/admin/partners', icon: 'sparkles' },
  { label: 'Finance', href: '/admin/finance', icon: 'bar-chart' },
]

export function getAdminNav(commerceEnabled: boolean): NavItem[] {
  return commerceEnabled ? [...clinicAdminNav, ...commerceAdminNav] : clinicAdminNav
}

export const adminNav = getAdminNav(COMMERCE_ENABLED)
export const adminNavArchived = commerceAdminNav

export const adminChrome: PortalChrome = {
  label: 'Command Center',
  shortName: 'Admin',
}
