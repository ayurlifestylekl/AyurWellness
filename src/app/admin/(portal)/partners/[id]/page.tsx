import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import {
  getAgentById,
  listAttributedOrders,
} from '@/lib/admin/agents/queries'
import {
  listAgentCommissions,
  listAgentPayouts,
} from '@/lib/admin/agents/payouts-queries'
import {
  DEMO_ADMIN_EMAIL,
  isMockAgentId,
  MOCK_AGENTS,
} from '@/lib/admin/agents/mocks'
import PartnerControls from './PartnerControls'
import CommissionLedger from './CommissionLedger'

export const metadata = { title: 'Partner · Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminPartnerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const me = await getCurrentUser()
  const isDemoAdmin = me?.email === DEMO_ADMIN_EMAIL
  const useMock = isDemoAdmin && isMockAgentId(params.id)

  let agent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orders: any[] = []
  if (useMock) {
    const m = MOCK_AGENTS.find((a) => a.id === params.id)
    if (!m) notFound()
    agent = {
      id: m.id,
      user_id: m.userId,
      referral_code: m.referralCode,
      commission_rate: m.commissionRate,
      commission_type: m.commissionType,
      status: m.status,
      total_sales_generated_rm: m.totalSalesRm,
      total_commission_earned_rm: m.totalCommissionRm,
      suspended_at: m.status === 'suspended' ? new Date().toISOString() : null,
      suspended_reason:
        m.status === 'suspended' ? 'Demo: violation of program guidelines' : null,
      internal_notes:
        '[2026-04-15] Rate set to ' +
        m.commissionRate +
        '% — initial onboarding' +
        (m.status === 'suspended'
          ? '\n[2026-05-10] Suspended pending review'
          : ''),
      created_at: m.createdAt,
      user: {
        id: m.userId,
        full_name: m.fullName,
        email: m.email,
        phone_number: m.phone,
        created_at: m.createdAt,
      },
    }
    orders = []
  } else {
    agent = await getAgentById(supabase, params.id)
    if (!agent) notFound()
    orders = await listAttributedOrders(supabase, params.id, 50)
  }

  // Commissions + payouts (real DB always — mocks have no commissions in DB)
  const commissions = useMock
    ? []
    : await listAgentCommissions(supabase, params.id, undefined, 100)
  const payouts = useMock ? [] : await listAgentPayouts(supabase, params.id, 50)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingTotal = (commissions as any[])
    .filter((c) => c.status === 'pending')
    .reduce((s, c) => s + Number(c.commission_rm), 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any = agent
  const u = Array.isArray(a.user) ? a.user[0] : a.user
  const referralLink = `https://ayurvedawellness.com.my/auth/register?ref=${a.referral_code}`

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <Link
        href="/admin/partners"
        className="text-[11px] uppercase tracking-wider text-[#006B3C]/55 hover:text-[#B58A3B]"
      >
        ← Back to partners
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-[24px] font-bold text-[#006B3C]">
              {u?.full_name ?? 'Unnamed partner'}
            </h1>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${
                a.status === 'active'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {a.status}
            </span>
            {useMock ? (
              <span className="rounded-full border border-[#B58A3B]/40 bg-[#EDF4E7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#B58A3B]">
                Demo data
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[12px] text-[#12372D]/65">
            Joined {new Date(a.created_at).toLocaleDateString('en-MY')} ·{' '}
            <span className="capitalize">{a.commission_type}</span> · {a.commission_rate}%
            commission
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          {/* Performance summary */}
          <article
            className="rounded-2xl border border-[#006B3C]/8 bg-white p-5"
            style={{
              boxShadow:
                '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
            }}
          >
            <h2 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
              Performance
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#12372D]/55">
                  Attributed orders
                </p>
                <p className="mt-1 font-heading text-[22px] font-bold text-[#006B3C]">
                  {orders.length || 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#12372D]/55">
                  Sales generated
                </p>
                <p className="mt-1 font-heading text-[22px] font-bold text-[#006B3C]">
                  RM {Number(a.total_sales_generated_rm ?? 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#12372D]/55">
                  Commission earned
                </p>
                <p className="mt-1 font-heading text-[22px] font-bold text-[#B58A3B]">
                  RM {Number(a.total_commission_earned_rm ?? 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#12372D]/55">
                  Pending payout
                </p>
                <p
                  className={`mt-1 font-heading text-[22px] font-bold ${
                    pendingTotal > 0 ? 'text-[#B58A3B]' : 'text-[#12372D]/40'
                  }`}
                >
                  RM {pendingTotal.toFixed(2)}
                </p>
                {pendingTotal > 0 ? (
                  <Link
                    href="/admin/partners/payouts"
                    className="mt-1 inline-block text-[10.5px] font-semibold text-[#B58A3B] hover:text-[#006B3C]"
                  >
                    Pay out →
                  </Link>
                ) : null}
              </div>
            </div>
          </article>

          {/* Referral link */}
          <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
            <h2 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
              Referral
            </h2>
            <p className="mt-2 text-[12px] text-[#12372D]/65">
              Code: <code className="font-mono font-bold text-[#006B3C]">{a.referral_code}</code>
            </p>
            <p className="mt-2 break-all font-mono text-[11px] text-[#12372D]/65">
              {referralLink}
            </p>
          </article>

          {/* Attributed orders */}
          <article className="overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white">
            <header className="border-b border-[#006B3C]/6 px-5 py-3 font-heading text-[13px] font-semibold text-[#006B3C]">
              Attributed orders ({orders.length})
            </header>
            {orders.length === 0 ? (
              <p className="px-5 py-6 text-center text-[12.5px] italic text-[#12372D]/55">
                No attributed orders yet.
              </p>
            ) : (
              <ul className="divide-y divide-[#006B3C]/6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {orders.map((o: any) => {
                  const cust = Array.isArray(o.customer) ? o.customer[0] : o.customer
                  return (
                    <li
                      key={o.id}
                      className="flex items-center justify-between px-5 py-3 text-[13px]"
                    >
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-semibold text-[#006B3C] hover:text-[#B58A3B]"
                      >
                        #{String(o.id).slice(-6).toUpperCase()}
                      </Link>
                      <span className="text-[#12372D]/65">{cust?.full_name ?? '—'}</span>
                      <span className="text-[12px]">{o.fulfillment_status}</span>
                      <span className="font-semibold">
                        RM {Number(o.total_amount_rm).toFixed(2)}
                      </span>
                      <span className="text-[11px] text-[#12372D]/55">
                        {new Date(o.created_at).toLocaleDateString('en-MY')}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </article>

          {/* Commission ledger */}
          <article className="overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white">
            <header className="flex items-center justify-between border-b border-[#006B3C]/6 px-5 py-3">
              <h2 className="font-heading text-[13px] font-semibold text-[#006B3C]">
                Commission ledger ({commissions.length})
              </h2>
              {pendingTotal > 0 ? (
                <Link
                  href="/admin/partners/payouts"
                  className="text-[11px] font-semibold text-[#B58A3B] hover:text-[#006B3C]"
                >
                  Pending RM {pendingTotal.toFixed(2)} →
                </Link>
              ) : null}
            </header>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <CommissionLedger commissions={commissions as any} />
          </article>

          {/* Payouts history */}
          <article className="overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white">
            <header className="border-b border-[#006B3C]/6 px-5 py-3 font-heading text-[13px] font-semibold text-[#006B3C]">
              Payouts history ({payouts.length})
            </header>
            {payouts.length === 0 ? (
              <p className="px-5 py-6 text-center text-[12.5px] italic text-[#12372D]/55">
                No payouts recorded yet.
              </p>
            ) : (
              <ul className="divide-y divide-[#006B3C]/6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(payouts as any[]).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between px-5 py-3 text-[13px]"
                  >
                    <span className="text-[12px] text-[#12372D]/65">
                      {new Date(p.created_at).toLocaleDateString('en-MY')}
                    </span>
                    <span className="text-[11.5px] text-[#12372D]/55 capitalize">
                      {String(p.payment_method).replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-[#12372D]/55">
                      {p.commission_count} commissions
                    </span>
                    <span className="font-semibold text-[#006B3C]">
                      RM {Number(p.amount_rm).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Contact card */}
          <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
            <h3 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
              Contact
            </h3>
            <p className="mt-2 text-[13px] font-semibold">{u?.full_name ?? '—'}</p>
            <p className="text-[12px] text-[#12372D]/65">{u?.email ?? '—'}</p>
            <p className="text-[12px] text-[#12372D]/65">{u?.phone_number ?? '—'}</p>
          </article>

          <PartnerControls
            agentId={a.id}
            initialRate={Number(a.commission_rate)}
            initialCanAffiliate={Boolean(a.can_affiliate)}
            initialCanWholesale={Boolean(a.can_wholesale)}
            initialStatus={a.status}
            suspendedReason={a.suspended_reason}
            initialNotes={a.internal_notes}
          />
        </div>
      </section>
    </div>
  )
}
