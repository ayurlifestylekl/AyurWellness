import Link from 'next/link'
import {
  Package,
  Truck,
  MessageSquare,
  Boxes,
  ArrowRight,
  AlertCircle,
  Wallet,
  UserPlus,
  Receipt,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import {
  getExtendedOverviewStats,
  getOrdersNeedingAttention,
  getTicketsNeedingAttention,
  getLowStockProducts,
  getTodayConsultations,
  getTopSellingProducts,
  getVaidyaUtilization,
  getActivePromos,
  getMostBookedTreatment,
  getAgedPendingPayments,
  getDailyOrderCounts,
  getFulfilmentFunnel,
  LOW_STOCK_THRESHOLD,
} from '@/lib/admin/queries'
import { getRecentActivity } from '@/lib/admin/activity'
import { COMMERCE_ENABLED } from '@/lib/admin/features'

import KpiTile from '@/components/admin/KpiTile'
import UniversalSearch from '@/components/admin/UniversalSearch'
import QuickActionsRow from '@/components/admin/QuickActionsRow'
import TodayConsultationsCard from '@/components/admin/TodayConsultationsCard'
import OrdersBarChart from '@/components/admin/OrdersBarChart'
import RevenueLineChart from '@/components/admin/RevenueLineChart'
import FulfilmentFunnel from '@/components/admin/FulfilmentFunnel'
import AgedPaymentsCard from '@/components/admin/AgedPaymentsCard'
import InsightsRow from '@/components/admin/InsightsRow'
import RecentActivityFeed from '@/components/admin/RecentActivityFeed'

export const metadata = { title: 'Admin Overview' }

function relativeTime(iso: string): string {
  const d = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(d / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default async function AdminDashboardPage() {
  const me = await getCurrentUser()
  const firstName = me?.profile.full_name?.split(' ')[0] ?? 'Admin'

  const supabase = await createClient()
  const [
    stats,
    ordersAttn,
    ticketsAttn,
    lowStock,
    todayConsults,
    topSelling,
    utilization,
    promos,
    topTreatment,
    agedPayments,
    daily7,
    daily30,
    funnel,
    activity,
  ] = await Promise.all([
    getExtendedOverviewStats(supabase),
    getOrdersNeedingAttention(supabase, 5),
    getTicketsNeedingAttention(supabase, 5),
    getLowStockProducts(supabase, 5),
    getTodayConsultations(supabase),
    getTopSellingProducts(supabase, 5),
    getVaidyaUtilization(supabase),
    getActivePromos(supabase, 5),
    getMostBookedTreatment(supabase),
    getAgedPendingPayments(supabase, 5),
    getDailyOrderCounts(supabase, 7),
    getDailyOrderCounts(supabase, 30),
    getFulfilmentFunnel(supabase),
    getRecentActivity(supabase, 10),
  ])

  const hasAnyAttention =
    ticketsAttn.length > 0 ||
    (COMMERCE_ENABLED &&
      (ordersAttn.length > 0 || lowStock.length > 0 || agedPayments.length > 0))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-7">
      {/* ── HERO ────────────────────────────────────────────────────── */}
      <header>
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          Command Center
        </span>
        <h1
          className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C] sm:text-[36px]"
          style={{ letterSpacing: '-0.025em' }}
        >
          Good day,{' '}
          <span
            className="italic font-normal text-[#006B3C]/70"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {firstName}.
          </span>
        </h1>
        <p
          className="mt-3 max-w-2xl font-body text-[14px] text-[#12372D]/65"
          style={{ lineHeight: 1.65 }}
        >
          Today&apos;s snapshot. Anything below needs your attention &mdash; click through to action it.
        </p>
        <div className="mt-4">
          <UniversalSearch />
        </div>
      </header>

      {/* ── QUICK ACTIONS ──────────────────────────────────────────── */}
      <QuickActionsRow />

      {/* ── KPI TILES (8) ──────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {/* Shop KPIs — archived while the clinic runs on bookings only. */}
        {COMMERCE_ENABLED && (
          <>
            <KpiTile
              label="Orders today"
              value={String(stats.ordersToday)}
              sub={
                stats.ordersToday === 0
                  ? 'No orders yet'
                  : `${stats.ordersToday === 1 ? '1 order' : `${stats.ordersToday} orders`} placed`
              }
              icon={Package}
              accent="burgundy"
            />
            <KpiTile
              label="Revenue today"
              value={`RM ${stats.revenueTodayRm.toFixed(0)}`}
              sub={
                stats.avgOrderValueRm > 0
                  ? `Avg RM ${stats.avgOrderValueRm.toFixed(0)} per order`
                  : 'No paid orders yet'
              }
              icon={Wallet}
              accent="gold"
            />
            <KpiTile
              label="Avg order value"
              value={stats.avgOrderValueRm > 0 ? `RM ${stats.avgOrderValueRm.toFixed(0)}` : '—'}
              sub="Today's paid orders"
              icon={Receipt}
              accent="burgundy"
            />
            <KpiTile
              label="Awaiting fulfil"
              value={String(stats.pendingFulfillment)}
              sub={stats.pendingFulfillment === 0 ? 'All shipped' : 'Paid, ready to ship'}
              icon={Truck}
              accent="rose"
            />
            <KpiTile
              label="Low stock"
              value={String(stats.lowStockProducts)}
              sub={
                stats.lowStockProducts === 0 ? 'All healthy' : `Under ${LOW_STOCK_THRESHOLD} units`
              }
              icon={Boxes}
              accent="burgundy"
            />
          </>
        )}
        <KpiTile
          label="New customers"
          value={String(stats.newCustomersToday)}
          sub="Signed up today"
          icon={UserPlus}
          accent="burgundy"
        />
        <KpiTile
          label="Unread messages"
          value={String(stats.unreadTickets)}
          sub={stats.unreadTickets === 0 ? 'Inbox zero' : 'From customers'}
          icon={MessageSquare}
          accent="rose"
        />
        <KpiTile
          label="Today's consults"
          value={String(stats.pendingConsultationsToday)}
          sub={stats.pendingConsultationsToday === 0 ? 'Calendar clear' : 'Scheduled'}
          icon={CalendarDays}
          accent="gold"
        />
      </section>

      {/* ── TODAY'S CONSULTATIONS ──────────────────────────────────── */}
      <TodayConsultationsCard consultations={todayConsults} />

      {/* ── CHARTS ROW (shop) ──────────────────────────────────────── */}
      {COMMERCE_ENABLED && (
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
          <OrdersBarChart data={daily7.map((d) => ({ date: d.date, count: d.count }))} />
          <RevenueLineChart data={daily30.map((d) => ({ date: d.date, revenue: d.revenue }))} />
          <FulfilmentFunnel stages={funnel} />
        </section>
      )}

      {/* ── NEEDS ATTENTION ────────────────────────────────────────── */}
      {hasAnyAttention ? (
        <section className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
          {/* Orders awaiting fulfilment */}
          {COMMERCE_ENABLED && ordersAttn.length > 0 && (
            <div className="lg:col-span-7">
              <AttentionCard
                icon={Truck}
                title="Orders awaiting fulfilment"
                subtitle={`${stats.pendingFulfillment} paid · oldest first`}
                viewAllHref="/admin/orders?status=processing"
                emptyText="All caught up."
              >
                <ul className="divide-y divide-[#006B3C]/6">
                  {ordersAttn.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-[#EDF4E7]/40"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-heading text-[13px] font-semibold text-[#006B3C]">
                            #{o.shortId} · {o.customerName ?? 'Unknown customer'}
                          </p>
                          <p className="mt-0.5 font-body text-[11.5px] text-[#12372D]/55">
                            {relativeTime(o.createdAt)} · RM {o.totalRm.toFixed(2)}
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#006B3C]/40" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </AttentionCard>
            </div>
          )}

          {/* Unread tickets */}
          {ticketsAttn.length > 0 && (
            <div className="lg:col-span-5">
              <AttentionCard
                icon={MessageSquare}
                title="Unread customer messages"
                subtitle={`${stats.unreadTickets} new`}
                viewAllHref="/admin/messages?filter=unread"
                emptyText="No new messages."
              >
                <ul className="divide-y divide-[#006B3C]/6">
                  {ticketsAttn.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/admin/messages/${t.id}`}
                        className="block px-5 py-3 transition-colors hover:bg-[#EDF4E7]/40"
                      >
                        <p className="truncate font-heading text-[13px] font-semibold text-[#006B3C]">
                          {t.subject}
                        </p>
                        <p className="mt-0.5 truncate font-body text-[11.5px] text-[#12372D]/55">
                          {t.customerName ?? 'Unknown'} · {t.topic} ·{' '}
                          {relativeTime(t.lastMessageAt)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </AttentionCard>
            </div>
          )}

          {/* Low stock */}
          {COMMERCE_ENABLED && lowStock.length > 0 && (
            <div className="lg:col-span-6">
              <AttentionCard
                icon={AlertCircle}
                title="Low stock products"
                subtitle={`Below ${LOW_STOCK_THRESHOLD} units`}
                viewAllHref="/admin/inventory?filter=low-stock"
                emptyText="All stock healthy."
              >
                <ul className="divide-y divide-[#006B3C]/6">
                  {lowStock.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/admin/inventory/${p.id}`}
                        className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-[#EDF4E7]/40"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-heading text-[13px] font-semibold text-[#006B3C]">
                            {p.name}
                          </p>
                          <p className="mt-0.5 font-body text-[11.5px] text-[#12372D]/55">
                            SKU {p.sku}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-heading text-[10.5px] font-semibold ${
                            p.stockQty === 0
                              ? 'border border-red-200 bg-red-50 text-red-700'
                              : 'border border-amber-200 bg-amber-50 text-amber-700'
                          }`}
                        >
                          {p.stockQty === 0 ? 'Out of stock' : `${p.stockQty} left`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </AttentionCard>
            </div>
          )}

          {/* Aged pending payments */}
          {COMMERCE_ENABLED && agedPayments.length > 0 && (
            <div className="lg:col-span-6">
              <AgedPaymentsCard orders={agedPayments} />
            </div>
          )}
        </section>
      ) : (
        <section
          className="rounded-3xl border border-[#006B3C]/8 bg-white p-8 text-center"
          style={{
            boxShadow:
              '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
          }}
        >
          <p className="font-heading text-[18px] font-semibold text-[#006B3C]">
            All caught up.
          </p>
          <p className="mt-2 font-body text-[13px] text-[#12372D]/65">
            Nothing needs your attention right now. Enjoy a quiet moment.
          </p>
        </section>
      )}

      {/* ── INSIGHTS ───────────────────────────────────────────────── */}
      <InsightsRow
        topSelling={topSelling}
        utilization={utilization}
        promos={promos}
        topTreatment={topTreatment}
        commerce={COMMERCE_ENABLED}
      />

      {/* ── RECENT ACTIVITY ────────────────────────────────────────── */}
      <RecentActivityFeed initial={activity} />
    </div>
  )
}

interface AttentionCardProps {
  icon: LucideIcon
  title: string
  subtitle: string
  viewAllHref: string
  emptyText: string
  children: React.ReactNode
}

function AttentionCard({
  icon: Icon,
  title,
  subtitle,
  viewAllHref,
  emptyText,
  children,
}: AttentionCardProps) {
  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      <header className="flex items-center justify-between gap-3 border-b border-[#006B3C]/6 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#006B3C]/[0.06]">
            <Icon className="h-3.5 w-3.5 text-[#006B3C]" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="font-heading text-[13px] font-semibold text-[#006B3C]">{title}</h2>
            <p className="font-body text-[10.5px] text-[#12372D]/55">{subtitle}</p>
          </div>
        </div>
        <Link
          href={viewAllHref}
          className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#006B3C]/55 hover:text-[#B58A3B]"
        >
          View all →
        </Link>
      </header>
      <div className="flex-1">
        {children ?? (
          <p className="px-5 py-6 text-center font-body text-[12.5px] italic text-[#12372D]/55">
            {emptyText}
          </p>
        )}
      </div>
    </article>
  )
}
