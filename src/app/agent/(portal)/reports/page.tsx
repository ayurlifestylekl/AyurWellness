import { redirect } from 'next/navigation'
import { TrendingUp } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { getAgentProfileByUserId } from '@/lib/agent/dashboard/queries'
import {
  getEarningsSummary,
  getMonthlyBreakdown,
  listAgentCommissions,
  listAgentPayouts,
} from '@/lib/agent/reports/queries'
import type { CommissionStatus } from '@/lib/agent/orders/queries'
import EarningsTabs from './EarningsTabs'

export const metadata = { title: 'Earnings' }
export const dynamic = 'force-dynamic'

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reversed: 'bg-red-50 text-red-700 border-red-200',
}

interface PageProps {
  searchParams: { tab?: string }
}

export default async function AgentEarningsPage({ searchParams }: PageProps) {
  const me = await getCurrentUser()
  if (!me) redirect('/agent/login')

  const supabase = await createClient()
  const profile = await getAgentProfileByUserId(supabase, me.profile.id)
  if (!profile) redirect('/agent/dashboard')

  const tab = (searchParams.tab as CommissionStatus | 'all' | 'payouts') ?? 'all'

  const [summary, monthly, commissions, payouts] = await Promise.all([
    getEarningsSummary(supabase, profile.id),
    getMonthlyBreakdown(supabase, profile.id, 6),
    tab === 'payouts'
      ? Promise.resolve([])
      : listAgentCommissions(supabase, profile.id, {
          status: tab === 'all' ? undefined : (tab as CommissionStatus),
          limit: 200,
        }),
    tab === 'payouts'
      ? listAgentPayouts(supabase, profile.id, 50)
      : Promise.resolve([]),
  ])

  const maxBar = Math.max(1, ...monthly.map((m) => m.accruedRm))

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <header>
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          Your money
        </span>
        <h1 className="mt-2 font-heading text-3xl font-bold leading-tight text-[#12372D]">
          Earnings
        </h1>
        <p className="mt-2 font-body text-[13.5px] text-[#12372D]/70">
          Commission ledger and payouts. Pending commission flips to paid once
          admin records the payout.
        </p>
      </header>

      {/* Summary KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi
          icon={TrendingUp}
          label="Pending"
          value={`RM ${summary.totalPendingRm.toFixed(2)}`}
          sub={`${summary.pendingCount} commission${summary.pendingCount === 1 ? '' : 's'}`}
          accent="amber"
        />
        <Kpi
          icon={TrendingUp}
          label="Paid out"
          value={`RM ${summary.totalPaidRm.toFixed(2)}`}
          accent="green"
        />
        <Kpi
          icon={TrendingUp}
          label="Total accrued"
          value={`RM ${summary.totalAccruedRm.toFixed(2)}`}
        />
        <Kpi
          icon={TrendingUp}
          label="Reversed"
          value={`RM ${summary.totalReversedRm.toFixed(2)}`}
          accent="red"
        />
      </section>

      {/* Monthly breakdown */}
      <section className="rounded-3xl border border-[#12372D]/10 bg-white p-5">
        <h2 className="font-heading text-[14.5px] font-semibold text-[#12372D]">
          Last 6 months
        </h2>
        <div className="mt-4 flex h-32 items-end justify-between gap-3">
          {monthly.map((m) => {
            const accruedH = (m.accruedRm / maxBar) * 100
            const paidH = (m.paidRm / maxBar) * 100
            return (
              <div
                key={m.monthKey}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div className="relative flex h-24 w-full items-end justify-center">
                  <div
                    className="w-3/5 rounded-t bg-[#B58A3B]/30"
                    style={{ height: `${accruedH}%` }}
                  />
                  <div
                    className="absolute bottom-0 w-3/5 rounded-t bg-[#B58A3B]"
                    style={{ height: `${paidH}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#12372D]/55">
                  {m.label}
                </span>
                <span className="text-[10.5px] font-semibold text-[#12372D]">
                  RM {m.accruedRm.toFixed(0)}
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex justify-end gap-3 text-[10.5px] text-[#12372D]/65">
          <span className="flex items-center gap-1">
            <span className="h-2 w-3 rounded bg-[#B58A3B]" /> Paid
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-3 rounded bg-[#B58A3B]/30" /> Accrued
          </span>
        </div>
      </section>

      {/* Tabs */}
      <EarningsTabs active={tab} />

      {/* Ledger or Payouts */}
      {tab === 'payouts' ? (
        payouts.length === 0 ? (
          <EmptyState text="No payouts yet. Admin pays out monthly once your commissions clear." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#12372D]/8 bg-white">
            <table className="min-w-[640px] w-full text-left text-[13px]">
              <thead className="bg-[#EDF4E7]/40 text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12372D]/6">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#EDF4E7]/30">
                    <td className="px-4 py-3 text-[11.5px] text-[#12372D]/70">
                      {new Date(p.createdAt).toLocaleDateString('en-MY')}
                    </td>
                    <td className="px-4 py-3 capitalize">{p.method ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-[11.5px] text-[#12372D]/65">
                      {p.reference ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-heading font-bold text-emerald-700">
                      RM {p.amountRm.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : commissions.length === 0 ? (
        <EmptyState text="No commission entries in this view." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#12372D]/8 bg-white">
          <table className="min-w-[640px] w-full text-left text-[13px]">
            <thead className="bg-[#EDF4E7]/40 text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#12372D]/6">
              {commissions.map((c) => (
                <tr key={c.id} className="hover:bg-[#EDF4E7]/30">
                  <td className="px-4 py-3 text-[11.5px] text-[#12372D]/70">
                    {new Date(c.createdAt).toLocaleDateString('en-MY')}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-[#12372D]/70">
                    {c.orderRef ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_CLASS[c.status] ?? ''}`}
                    >
                      {c.status}
                    </span>
                    {c.reversedReason ? (
                      <p className="mt-1 text-[10.5px] italic text-red-700">
                        {c.reversedReason}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right font-heading font-bold text-emerald-700">
                    {c.status === 'reversed' ? '—' : `RM ${c.amountRm.toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  accent = 'neutral',
}: {
  icon: typeof TrendingUp
  label: string
  value: string
  sub?: string
  accent?: 'neutral' | 'amber' | 'green' | 'red'
}) {
  const color =
    accent === 'amber'
      ? 'text-amber-700'
      : accent === 'green'
        ? 'text-emerald-700'
        : accent === 'red'
          ? 'text-red-700'
          : 'text-[#12372D]'
  return (
    <article className="rounded-2xl border border-[#12372D]/10 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#12372D]/[0.06]">
          <Icon className="h-3.5 w-3.5 text-[#149447]" strokeWidth={1.8} />
        </span>
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#12372D]/55">
          {label}
        </p>
      </div>
      <p className={`mt-2 font-heading text-[20px] font-bold ${color}`}>{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-[#12372D]/55">{sub}</p> : null}
    </article>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#12372D]/15 p-10 text-center font-body text-[12.5px] italic text-[#12372D]/55">
      {text}
    </div>
  )
}
