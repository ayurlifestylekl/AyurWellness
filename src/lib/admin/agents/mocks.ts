import type { AgentListItem } from './queries'

export const DEMO_ADMIN_EMAIL = 'demo-admin@kerala-ayurvedic.dev'

export function isMockAgentId(id: string): boolean {
  return id.startsWith('00000000-mockag-')
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const MOCK_AGENTS: AgentListItem[] = [
  {
    id: '00000000-mockag-001-aaaa-000000000001',
    userId: '00000000-mockuser-001',
    fullName: 'Priya Nair',
    email: 'priya.nair@example.com',
    phone: '+60 12-987 6543',
    referralCode: 'PRIYA10',
    commissionRate: 12,
    commissionType: 'affiliate',
    canAffiliate: true,
    canWholesale: false,
    status: 'active',
    totalSalesRm: 4250,
    totalCommissionRm: 510,
    attributedOrderCount: 18,
    createdAt: daysAgo(120),
  },
  {
    id: '00000000-mockag-002-aaaa-000000000002',
    userId: '00000000-mockuser-002',
    fullName: 'Dr Suresh Kumar',
    email: 'suresh.kumar@example.com',
    phone: '+60 17-222 3344',
    referralCode: 'SURESH15',
    commissionRate: 15,
    commissionType: 'reseller',
    canAffiliate: false,
    canWholesale: true,
    status: 'active',
    totalSalesRm: 12800,
    totalCommissionRm: 1920,
    attributedOrderCount: 47,
    createdAt: daysAgo(220),
  },
  {
    id: '00000000-mockag-003-aaaa-000000000003',
    userId: '00000000-mockuser-003',
    fullName: 'Anjali Menon',
    email: 'anjali.menon@example.com',
    phone: '+60 16-555 7788',
    referralCode: 'ANJALI08',
    commissionRate: 8,
    commissionType: 'affiliate',
    canAffiliate: true,
    canWholesale: false,
    status: 'active',
    totalSalesRm: 980,
    totalCommissionRm: 78,
    attributedOrderCount: 5,
    createdAt: daysAgo(45),
  },
  {
    id: '00000000-mockag-004-aaaa-000000000004',
    userId: '00000000-mockuser-004',
    fullName: 'Faizal Hassan',
    email: 'faizal.hassan@example.com',
    phone: '+60 19-111 9999',
    referralCode: 'FAIZAL10',
    commissionRate: 10,
    commissionType: 'affiliate',
    canAffiliate: true,
    canWholesale: false,
    status: 'suspended',
    totalSalesRm: 1450,
    totalCommissionRm: 145,
    attributedOrderCount: 8,
    createdAt: daysAgo(180),
  },
]
