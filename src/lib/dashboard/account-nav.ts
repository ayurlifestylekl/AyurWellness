import type { NavItem, PortalChrome } from './nav-types'

/**
 * Active member portal — clinic-only (Phase 1).
 *
 * The shop features (orders, promo wallet, wishlist, product reviews, shipping
 * addresses) are built but archived below until the product catalogue launches.
 * Those routes still exist and remain reachable by URL — they're only hidden
 * from the sidebar. To bring one back, move its entry into `accountNav`.
 */
export const accountNav: NavItem[] = [
  { label: 'Dashboard', href: '/account/dashboard', icon: 'dashboard' },
  { label: 'Assessments', href: '/account/assessments', icon: 'compass' },
  { label: 'Appointments', href: '/account/appointments', icon: 'calendar' },
  { label: 'Product Orders', href: '/account/product-orders', icon: 'package' },
  { label: 'Messages', href: '/account/messages', icon: 'inbox' },
  { label: 'Profile', href: '/account/profile', icon: 'user' },
]

/** Archived — Phase 2 (shop). Not rendered in the sidebar. */
export const accountNavArchived: NavItem[] = [
  { label: 'My Orders', href: '/account/orders', icon: 'package' },
  { label: 'Promo Wallet', href: '/account/promos', icon: 'gift' },
  { label: 'Wishlist', href: '/account/wishlist', icon: 'heart' },
  { label: 'My Reviews', href: '/account/reviews', icon: 'star' },
  { label: 'Addresses', href: '/account/addresses', icon: 'map-pin' },
]

export const accountChrome: PortalChrome = {
  label: 'Member Portal',
  shortName: 'Member',
}
