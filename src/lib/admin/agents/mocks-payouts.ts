import type { PendingPayoutSummary } from './payouts-queries'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const MOCK_PENDING_PAYOUTS: PendingPayoutSummary[] = [
  {
    agentId: '00000000-mockag-002-aaaa-000000000002',
    agentName: 'Dr Suresh Kumar',
    agentEmail: 'suresh.kumar@example.com',
    referralCode: 'SURESH15',
    commissionType: 'reseller',
    pendingCount: 12,
    pendingTotalRm: 1280.5,
    oldestPendingAt: daysAgo(28),
  },
  {
    agentId: '00000000-mockag-001-aaaa-000000000001',
    agentName: 'Priya Nair',
    agentEmail: 'priya.nair@example.com',
    referralCode: 'PRIYA10',
    commissionType: 'affiliate',
    pendingCount: 6,
    pendingTotalRm: 415.2,
    oldestPendingAt: daysAgo(15),
  },
  {
    agentId: '00000000-mockag-003-aaaa-000000000003',
    agentName: 'Anjali Menon',
    agentEmail: 'anjali.menon@example.com',
    referralCode: 'ANJALI08',
    commissionType: 'affiliate',
    pendingCount: 2,
    pendingTotalRm: 78,
    oldestPendingAt: daysAgo(5),
  },
]
