import { describe, expect, it } from 'vitest'
import { getAdminNav } from '@/lib/dashboard/admin-nav'

describe('getAdminNav', () => {
  it('hides commerce and partner modules when commerce is disabled', () => {
    const labels = getAdminNav(false).map((x) => x.label)
    expect(labels).not.toEqual(expect.arrayContaining(['Products', 'Inventory', 'Orders', 'Marketplace', 'Wholesale Orders', 'Finance']))
  })
  it('keeps clinic modules', () => {
    expect(getAdminNav(false).map((x) => x.label)).toEqual(expect.arrayContaining(['Overview', 'Appointments', 'Customers', 'Settings']))
  })
})
