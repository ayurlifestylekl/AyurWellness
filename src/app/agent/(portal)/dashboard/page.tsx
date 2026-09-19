import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Plus,
  ShoppingBag,
  Store,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import {
  getAgentProfileByUserId,
  getDashboardKpis,
  getMonthlyTrend,
  getRecentReferredOrders,
  getRecentSubmissions,
} from '@/lib/agent/dashboard/queries'
import CopyButton from '@/components/agent/CopyButton'
import ReferralQR from '@/components/agent/ReferralQR'
import MonthlyTrendSparkline from '@/components/agent/MonthlyTrendSparkline'
import CommissionTooltip from '@/components/agent/CommissionTooltip'

export const metadata = { title: 'Partner Overview' }
export const dynamic = 'force-dynamic'

const EXTERNAL_CHANNEL_LABEL: Record<string, string> = {
  tiktok_shop: 'TikTok Shop',
  shopee: 'Shopee',
  lazada: 'Lazada',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  other: 'Other',
}

const SUBMISSION_STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

export default async function AgentDashboardPage() {
  const me = await getCurrentUser()
  // Layout already gates, but be defensive.
  if (!me) redirect('/agent/login')

  const supabase = await createClient()
  const profile = await getAgentProfileByUserId(supabase, me.profile.id)

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
          <h1 className="font-heading text-2xl font-bold text-[#12372D]">
            Partner profile not found.
          </h1>
          <p className="mt-2 font-body text-[13.5px] text-[#12372D]/70">
            Your account isn&apos;t linked to a sales agent profile yet. Contact
            admin to complete your partner setup.
          </p>
        </div>
      </div>
    )
  }

  const firstName = (profile.fullName ?? me.profile.full_name ?? 'Partner').split(' ')[0]
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const shareLink = `${siteUrl}/?ref=${profile.referralCode}`

  const [kpis, recentOrders, recentSubs, trend] = await Promise.all([
    getDashboardKpis(supabase, profile.id, profile),
    getRecentReferredOrders(supabase, profile.id, 5),
    getRecentSubmissions(supabase, profile.id, 5),
    getMonthlyTrend(supabase, profile.id, 6),
  ])

  const suspended = profile.status === 'suspended'

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      {/* Header */}
      <header>
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          Partner Hub
        </span>
        <h1
          className="mt-2 font-heading text-3xl font-bold leading-tight text-[#12372D] sm:text-4xl"
          style={{ letterSpacing: '-0.02em' }}
        >
          Welcome back, {firstName}.
        </h1>
        <p className="mt-2 font-body text-[13.5px] text-[#12372D]/70">
          Here&apos;s how your referrals are performing this month.
        </p>
      </header>

      {suspended ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">
          <strong>Account suspended.</strong> Contact admin to reactivate. New
          commissions are not being credited.
        </div>
      ) : null}

      {/* Referral hero — code + link + QR */}
      <section
        className="overflow-hidden rounded-3xl border border-[#B58A3B]/30 bg-gradient-to-br from-[#12372D] via-[#12372D] to-[#12372D] p-6 text-white shadow-lg shadow-black/10"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
                Your referral code
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                <code className="rounded-lg bg-white/10 px-3 py-1.5 font-mono text-[20px] font-bold tracking-wide text-[#B58A3B]">
                  {profile.referralCode}
                </code>
                <CopyButton value={profile.referralCode} label="Copy code" />
                <span className="text-[11.5px] text-white/60">
                  <CommissionTooltip rate={profile.commissionRate} />
                </span>
              </div>
            </div>

            <div>
              <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
                Share link
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <code className="max-w-full truncate rounded-lg bg-white/5 px-3 py-1.5 font-mono text-[12px] text-white/85">
                  {shareLink}
                </code>
                <CopyButton value={shareLink} label="Copy link" />
              </div>
              <p className="mt-2 text-[11.5px] text-white/55">
                Drop this in your TikTok bio, Instagram story, WhatsApp status —
                every paid order through it credits your commission.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 lg:items-end">
            <ReferralQR value={shareLink} size={128} />
            <span className="text-[10px] uppercase tracking-wider text-white/45">
              Scan to shop
            </span>
          </div>
        </div>
      </section>

      {/* KPI tiles */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          icon={TrendingUp}
          label="This month"
          value={`RM ${kpis.thisMonthCommissionRm.toFixed(2)}`}
          sub={`${kpis.thisMonthOrdersCount} order${kpis.thisMonthOrdersCount === 1 ? '' : 's'}`}
        >
          {trend.some((p) => p.commissionRm > 0) ? (
            <MonthlyTrendSparkline points={trend} width={180} height={40} />
          ) : null}
        </Kpi>
        <Kpi
          icon={Wallet}
          label="Pending payout"
          value={`RM ${kpis.pendingPayoutRm.toFixed(2)}`}
          sub="Paid out monthly by admin"
          accent="amber"
        />
        <Kpi
          icon={ShoppingBag}
          label="Lifetime sales"
          value={`RM ${kpis.lifetimeSalesRm.toFixed(2)}`}
          sub="Gross through your link"
        />
        <Kpi
          icon={TrendingUp}
          label="Lifetime earned"
          value={`RM ${kpis.lifetimeCommissionRm.toFixed(2)}`}
          sub="All commissions to date"
          accent="green"
        />
      </section>

      {/* Two-column: recent orders + recent submissions */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="flex flex-col rounded-3xl border border-[#12372D]/10 bg-white">
          <header className="flex items-center justify-between border-b border-[#12372D]/8 px-5 py-4">
            <h2 className="font-heading text-[14.5px] font-semibold text-[#12372D]">
              Recent referred orders
            </h2>
            <Link
              href="/agent/orders"
              className="text-[11.5px] font-semibold text-[#B58A3B] hover:underline"
            >
              View all →
            </Link>
          </header>
          {recentOrders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No referred sales yet"
              body="Share your link with friends, followers, or your TikTok audience. Your first commission shows up here automatically."
            />
          ) : (
            <ul className="divide-y divide-[#12372D]/6">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-[12.5px] font-semibold text-[#12372D]">
                      {o.customerName}
                    </p>
                    <p className="text-[11px] text-[#12372D]/55">
                      {new Date(o.createdAt).toLocaleDateString('en-MY')} ·{' '}
                      {o.paymentStatus}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12.5px] text-[#12372D]/70">
                      RM {o.totalAmountRm.toFixed(2)}
                    </p>
                    <p className="text-[11.5px] font-semibold text-emerald-700">
                      +RM {o.commissionRm.toFixed(2)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="flex flex-col rounded-3xl border border-[#12372D]/10 bg-white">
          <header className="flex items-center justify-between border-b border-[#12372D]/8 px-5 py-4">
            <h2 className="font-heading text-[14.5px] font-semibold text-[#12372D]">
              Marketplace submissions
            </h2>
            <Link
              href="/agent/marketplace-orders/new"
              className="inline-flex items-center gap-1 rounded-lg bg-[#149447] px-2.5 py-1.5 text-[11.5px] font-semibold text-white hover:bg-[#12372D]"
            >
              <Plus className="h-3 w-3" />
              Submit new
            </Link>
          </header>
          {recentSubs.length === 0 ? (
            <EmptyState
              icon={Store}
              title="No submissions yet"
              body="Got an order on Shopee, TikTok, or via WhatsApp? Key it in here so admin can confirm and we credit your commission."
              cta={{ href: '/agent/marketplace-orders/new', label: 'Submit your first order →' }}
            />
          ) : (
            <ul className="divide-y divide-[#12372D]/6">
              {recentSubs.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-[12.5px] font-semibold text-[#12372D]">
                      {EXTERNAL_CHANNEL_LABEL[s.channel] ?? s.channel}
                    </p>
                    <p className="text-[11px] text-[#12372D]/55">
                      {new Date(s.createdAt).toLocaleDateString('en-MY')} · RM{' '}
                      {s.totalAmountRm.toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${SUBMISSION_STATUS_CLASS[s.status] ?? ''}`}
                  >
                    {s.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  accent = 'neutral',
  children,
}: {
  icon: typeof TrendingUp
  label: string
  value: string
  sub?: string
  accent?: 'neutral' | 'amber' | 'green'
  children?: React.ReactNode
}) {
  const color =
    accent === 'amber'
      ? 'text-amber-700'
      : accent === 'green'
        ? 'text-emerald-700'
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
      <p className={`mt-2 font-heading text-[22px] font-bold ${color}`}>{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-[#12372D]/55">{sub}</p> : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </article>
  )
}

function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
}: {
  icon: typeof TrendingUp
  title: string
  body: string
  cta?: { href: string; label: string }
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#12372D]/[0.06]">
        <Icon className="h-4 w-4 text-[#149447]" strokeWidth={1.8} />
      </span>
      <h3 className="mt-3 font-heading text-[14px] font-semibold text-[#12372D]">
        {title}
      </h3>
      <p className="mt-1 max-w-xs font-body text-[12px] leading-relaxed text-[#12372D]/65">
        {body}
      </p>
      {cta ? (
        <Link
          href={cta.href}
          className="mt-3 text-[11.5px] font-semibold text-[#B58A3B] hover:underline"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  )
}
