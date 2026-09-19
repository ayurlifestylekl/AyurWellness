/**
 * Demo-only mock customers shown to the demo-admin account when the DB
 * has no real customers. Zero DB writes.
 */
import type { CustomerListItem } from './queries'

export const DEMO_ADMIN_EMAIL = 'demo-admin@kerala-ayurvedic.dev'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const MOCK_CUSTOMERS: CustomerListItem[] = [
  {
    id: '00000000-mockc-0001-aaaa-000000000001',
    fullName: 'Aisha Rahman',
    email: 'aisha.rahman@example.com',
    phone: '+60 12-345 6789',
    createdAt: daysAgo(120),
    totalOrders: 5,
    totalSpentRm: 845,
    lastOrderAt: daysAgo(7),
    tags: ['VIP', 'Newsletter'],
    blocked: false,
    doshaPrimary: 'pitta',
  },
  {
    id: '00000000-mockc-0002-aaaa-000000000002',
    fullName: 'Priya Nair',
    email: 'priya.nair@example.com',
    phone: '+60 12-987 6543',
    createdAt: daysAgo(180),
    totalOrders: 8,
    totalSpentRm: 1240,
    lastOrderAt: daysAgo(2),
    tags: ['VIP', 'Hair-care'],
    blocked: false,
    doshaPrimary: 'vata',
  },
  {
    id: '00000000-mockc-0003-aaaa-000000000003',
    fullName: 'Wei Ming Tan',
    email: 'weiming.tan@example.com',
    phone: '+60 16-234 5678',
    createdAt: daysAgo(15),
    totalOrders: 1,
    totalSpentRm: 95,
    lastOrderAt: daysAgo(15),
    tags: ['New'],
    blocked: false,
    doshaPrimary: 'kapha',
  },
  {
    id: '00000000-mockc-0004-aaaa-000000000004',
    fullName: 'David Lee',
    email: 'david.lee@example.com',
    phone: '+60 19-876 5432',
    createdAt: daysAgo(220),
    totalOrders: 12,
    totalSpentRm: 2150,
    lastOrderAt: daysAgo(5),
    tags: ['VIP', 'Wholesale'],
    blocked: false,
    doshaPrimary: 'pitta',
  },
  {
    id: '00000000-mockc-0005-aaaa-000000000005',
    fullName: 'Siti Hasan',
    email: 'siti.hasan@example.com',
    phone: '+60 13-111 2222',
    createdAt: daysAgo(60),
    totalOrders: 3,
    totalSpentRm: 320,
    lastOrderAt: daysAgo(20),
    tags: ['Newsletter'],
    blocked: false,
    doshaPrimary: 'vata',
  },
  {
    id: '00000000-mockc-0006-aaaa-000000000006',
    fullName: 'Hassan Ibrahim',
    email: 'hassan.ibrahim@example.com',
    phone: '+60 18-333 4444',
    createdAt: daysAgo(300),
    totalOrders: 6,
    totalSpentRm: 780,
    lastOrderAt: daysAgo(120),
    tags: ['At-risk'],
    blocked: false,
    doshaPrimary: 'kapha',
  },
  {
    id: '00000000-mockc-0007-aaaa-000000000007',
    fullName: 'Lakshmi Devi',
    email: 'lakshmi.devi@example.com',
    phone: '+60 14-555 6666',
    createdAt: daysAgo(8),
    totalOrders: 1,
    totalSpentRm: 310,
    lastOrderAt: daysAgo(8),
    tags: ['New'],
    blocked: false,
    doshaPrimary: 'tridosha',
  },
  {
    id: '00000000-mockc-0008-aaaa-000000000008',
    fullName: 'Mohan Krishnan',
    email: 'mohan.k@example.com',
    phone: '+60 17-777 8888',
    createdAt: daysAgo(45),
    totalOrders: 0,
    totalSpentRm: 0,
    lastOrderAt: null,
    tags: null,
    blocked: true,
    doshaPrimary: null,
  },
]
