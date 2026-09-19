import type { NavItem, PortalChrome } from './nav-types'
import { COMMERCE_ENABLED } from '@/lib/admin/features'

/**
 * Active admin sidebar — the clinic-only Command Center (Phase 1).
 *
 * The commerce + partner stack (products, inventory, orders, marketplace,
 * agents, wholesale, vouchers, brand partners, finance) is built but archived
 * below until Phase 2 launches the product catalogue. Those routes still exist
 * and remain reachable by URL — they're only hidden from the sidebar. To bring
 * one back, move its entry from `adminNavArchived` into `adminNav`.
 */
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

/** Archived — Phase 2 (commerce + partners). Not rendered in the sidebar. */
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
