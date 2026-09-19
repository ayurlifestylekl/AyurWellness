import type { NavItem, PortalChrome } from './nav-types'

export const agentNav: NavItem[] = [
  { label: 'Overview', href: '/agent/dashboard', icon: 'dashboard' },
  { label: 'Referred Sales', href: '/agent/orders', icon: 'shopping-bag' },
  { label: 'Marketplace', href: '/agent/marketplace-orders', icon: 'store' },
  { label: 'Wholesale Shop', href: '/agent/wholesale-shop', icon: 'package' },
  { label: 'My Wholesale Orders', href: '/agent/wholesale-orders', icon: 'boxes' },
  { label: 'Earnings', href: '/agent/reports', icon: 'trending-up' },
  { label: 'Profile', href: '/agent/profile', icon: 'user' },
]

export const agentChrome: PortalChrome = {
  label: 'Partner Hub',
  shortName: 'Partner',
}
