import type { NavItem, PortalChrome } from '@/lib/dashboard/nav-types'

export const productManagementNav: NavItem[] = [
  { label: 'Dashboard', href: '/product-management', icon: 'dashboard' },
  { label: 'Catalog', href: '/admin/products', icon: 'package', group: 'Catalogue' },
  { label: 'Inventory', href: '/admin/inventory', icon: 'boxes', group: 'Catalogue' },
  { label: 'Orders', href: '/product-management/orders', icon: 'shopping-bag', group: 'Orders' },
  { label: 'Fulfillment', href: '/product-management/fulfillment', icon: 'truck', group: 'Orders' },
  { label: 'Cancellations & Refunds', href: '/product-management/cancellations', icon: 'message-square', group: 'Orders' },
  { label: 'Reports', href: '/product-management/reports', icon: 'bar-chart', group: 'Insights' },
  { label: 'Shipping rates', href: '/product-management/shipping', icon: 'map-pin', group: 'Settings' },
]

export const productManagementChrome: PortalChrome = {
  label: 'Product Management',
  shortName: 'Products',
}
