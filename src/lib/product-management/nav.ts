import type { NavItem, PortalChrome } from '@/lib/dashboard/nav-types'

export const productManagementNav: NavItem[] = [
  { label: 'Dashboard', href: '/product-management', icon: 'dashboard' },
  { label: 'Catalog', href: '/product-management/catalog', icon: 'package' },
  { label: 'Inventory', href: '/product-management/inventory', icon: 'boxes' },
  { label: 'Orders', href: '/product-management/orders', icon: 'shopping-bag' },
  { label: 'Fulfillment', href: '/product-management/fulfillment', icon: 'clipboard-list' },
  { label: 'Cancellations & Refunds', href: '/product-management/cancellations', icon: 'message-square' },
  { label: 'Reports', href: '/product-management/reports', icon: 'bar-chart' },
]

export const productManagementChrome: PortalChrome = {
  label: 'Product Management',
  shortName: 'Products',
}
