import Link from 'next/link'
import { Wallet, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import {
  listAgents,
  type AgentFilters,
  type AgentListItem,
} from '@/lib/admin/agents/queries'
import {
  listPendingPayouts,
  getCommissionLeaderboard,
} from '@/lib/admin/agents/payouts-queries'
import { DEMO_ADMIN_EMAIL, MOCK_AGENTS } from '@/lib/admin/agents/mocks'
import { MOCK_PENDING_PAYOUTS } from '@/lib/admin/agents/mocks-payouts'
import PartnersFilters from './PartnersFilters'
import PartnersTable from './PartnersTable'

export const metadata = { title: 'Brand Partners · Admin' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { status?: string; type?: string; q?: string }
}

function filterMocks(items: AgentListItem[], filters: AgentFilters): AgentListItem[] {
  let arr = items
  if (filters.status && filters.status !== 'all') {
    arr = arr.filter((a) => a.status === filters.status)
  }
  if (filters.commissionType) {
    arr = arr.filter((a) => a.commissionType === filters.commissionType)
  }
  if (filters.search) {
    const s = filters.search.toLowerCase()
    arr = arr.filter(
      (a) =>
        a.referralCode.toLowerCase().includes(s) ||
        (a.fullName ?? '').toLowerCase().includes(s) ||
        (a.email ?? '').toLowerCase().includes(s),
    )
  }
  return arr
}

export default async function AdminPartnersPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const me = await getCurrentUser()
  const filters: AgentFilters = {
    status: (searchParams.status as AgentFilters['status']) ?? 'active',
    commissionType: searchParams.type as AgentFilters['commissionType'] | undefined,
    search: searchParams.q,
    limit: 100,
  }
  const real = await listAgents(supabase, filters)
  const realPendingPayouts = await listPendingPayouts(supabase)
  const leaderboard = await getCommissionLeaderboard(supabase, 5)

  const isDemoAdmin = me?.email === DEMO_ADMIN_EMAIL
  const showMocks = isDemoAdmin && real.items.length === 0
  const items = showMocks ? filterMocks(MOCK_AGENTS, filters) : real.items
  const total = showMocks ? items.length : real.total
  const pendingPayouts = showMocks && realPendingPayouts.length === 0
    ? MOCK_PENDING_PAYOUTS
    : realPendingPayouts

  const pendingAgentCount = pendingPayouts.length
  const pendingAmount = pendingPayouts.reduce((s, p) => s + p.pendingTotalRm, 0)

  const lifetime = items.reduce(
    (s, a) => ({
      sales: s.sales + a.totalSalesRm,
      commission: s.commission + a.totalCommissionRm,
      orders: s.orders + a.attributedOrderCount,
    }),
    { sales: 0, commission: 0, orders: 0 },
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
            Affiliate program
          </span>
          <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C]">
            Brand Partners
          </h1>
          <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
            {total} partner{total === 1 ? '' : 's'} in this view · {lifetime.orders} attributed
            orders · RM {lifetime.sales.toFixed(2)} sales · RM {lifetime.commission.toFixed(2)}{' '}
            commission
            {showMocks ? ' · demo data' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/partners/external-sales"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#006B3C]/20 bg-white px-3 py-2 text-[12.5px] font-semibold text-[#006B3C] hover:bg-[#EDF4E7]/60"
          >
            External sales
          </Link>
          <Link
            href="/admin/partners/payouts"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold ${
              pendingAgentCount > 0
                ? 'bg-[#B58A3B] text-white hover:bg-[#B58A3B]'
                : 'border border-[#006B3C]/20 bg-white text-[#006B3C] hover:bg-[#EDF4E7]/60'
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            {pendingAgentCount > 0 ? (
              <>
                Pay out · {pendingAgentCount} agent{pendingAgentCount === 1 ? '' : 's'} · RM{' '}
                {pendingAmount.toFixed(2)}
              </>
            ) : (
              'Payouts queue'
            )}
          </Link>
        </div>
      </header>

      {/* Leaderboard */}
      {leaderboard.length > 0 ? (
        <section
          className="overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white"
          style={{
            boxShadow:
              '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
          }}
        >
          <header className="flex items-center gap-2 border-b border-[#006B3C]/6 px-5 py-3">
            <Trophy className="h-3.5 w-3.5 text-[#B58A3B]" />
            <h2 className="font-heading text-[13px] font-semibold text-[#006B3C]">
              Top partners — this month
            </h2>
          </header>
          <ol className="divide-y divide-[#006B3C]/6">
            {leaderboard.map((entry, idx) => (
              <li
                key={entry.agentId}
                className="flex items-center gap-3 px-5 py-3 text-[13px]"
              >
                <span className="w-5 font-heading text-[14px] font-bold text-[#B58A3B]">
                  {idx + 1}
                </span>
                <Link
                  href={`/admin/partners/${entry.agentId}`}
                  className="flex-1 font-semibold text-[#006B3C] hover:text-[#B58A3B]"
                >
                  {entry.agentName ?? entry.referralCode}
                </Link>
                <span className="text-[11px] text-[#12372D]/55">
                  {entry.monthOrderCount} order{entry.monthOrderCount === 1 ? '' : 's'}
                </span>
                <span className="w-24 text-right font-semibold text-[#B58A3B]">
                  RM {entry.monthCommissionRm.toFixed(2)}
                </span>
                <span className="hidden w-32 text-right text-[11px] text-[#12372D]/55 md:inline-block">
                  lifetime RM {entry.lifetimeCommissionRm.toFixed(2)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <PartnersFilters />
      <PartnersTable items={items} />
    </div>
  )
}
