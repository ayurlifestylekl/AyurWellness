import { Package } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import {
  listOrders,
  getCustomerOrderStats,
  type OrderListItem,
} from '@/lib/dashboard/order-queries'

import OrderListHeader from '@/components/account/OrderListHeader'
import OrderListSummary from '@/components/account/OrderListSummary'
import OrderFilterTabs, { type OrderFilter } from '@/components/account/OrderFilterTabs'
import OrderListCard from '@/components/account/OrderListCard'
import EmptyState from '@/components/account/EmptyState'
import LiveShipmentTracker from '@/components/account/LiveShipmentTracker'

export const metadata = {
  title: 'My Orders',
}

const monthYearFormat = new Intl.DateTimeFormat('en-MY', {
  month: 'short',
  year: 'numeric',
})

/**
 * Match an order to a filter bucket. Order of checks matters:
 *   - cancelled (top priority — overrides fulfillment)
 *   - awaiting (payment_status pending/failed)
 *   - delivered / shipped / processing follow fulfillment_status
 */
function bucketize(order: OrderListItem): OrderFilter {
  if (order.fulfillment_status === 'delivered') return 'delivered'
  // No native 'cancelled' fulfillment status in current schema; we'll treat
  // failed payments as cancelled-equivalent in the UI bucket for now.
  if (order.payment_status === 'failed') return 'cancelled'
  if (order.payment_status === 'pending') return 'awaiting'
  if (order.fulfillment_status === 'shipped') return 'shipped'
  if (order.fulfillment_status === 'processing') return 'processing'
  return 'processing'
}

export default async function OrdersListPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const me = await getCurrentUser()
  const customerId = me?.authId ?? ''
  const memberSinceLabel = me?.profile.created_at
    ? monthYearFormat.format(new Date(me.profile.created_at))
    : '—'

  const supabase = await createClient()
  const [orders, stats] = await Promise.all([
    listOrders(supabase, customerId),
    getCustomerOrderStats(supabase, customerId),
  ])

  // Compute per-bucket counts for the filter tabs
  const counts: Record<OrderFilter, number> = {
    all: orders.length,
    awaiting: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }
  for (const order of orders) {
    counts[bucketize(order)] += 1
  }

  const active: OrderFilter = (
    ['awaiting', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderFilter[]
  ).includes(searchParams.status as OrderFilter)
    ? (searchParams.status as OrderFilter)
    : 'all'

  const filtered =
    active === 'all'
      ? orders
      : orders.filter((order) => bucketize(order) === active)

  const isEmptyOverall = orders.length === 0
  const isEmptyInFilter = filtered.length === 0 && !isEmptyOverall

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 sm:gap-6">
      <OrderListHeader />
      <OrderListSummary
        totalOrders={stats.totalOrders}
        totalSpent={stats.totalSpent}
        memberSinceLabel={memberSinceLabel}
      />
      <LiveShipmentTracker
        shipments={orders.filter((o) => o.fulfillment_status === 'shipped')}
      />
      <OrderFilterTabs active={active} counts={counts} />

      {/* Order cards */}
      {isEmptyOverall ? (
        <div
          className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
          style={{
            boxShadow:
              '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
          }}
        >
          <EmptyState
            icon={Package}
            title="No orders yet"
            body="Your wellness journey starts here. Explore our herbal formulas, oils, and treatment combos — or jump to what your practitioner has recommended for you."
            ctaLabel="Shop products"
            ctaHref="/products"
            secondaryCtaLabel="Take the Prakriti assessment"
            secondaryCtaHref="/account/assessments/prakriti"
          />
        </div>
      ) : isEmptyInFilter ? (
        <div
          className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
          style={{
            boxShadow:
              '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
          }}
        >
          <EmptyState
            icon={Package}
            title={`No ${active} orders`}
            body="Try a different filter, or check back as your orders move through their stages."
          />
        </div>
      ) : (
        <ul className="flex flex-col gap-3 sm:gap-4">
          {filtered.map((order) => (
            <li key={order.id}>
              <OrderListCard order={order} />
            </li>
          ))}
        </ul>
      )}

      {/* Support link — always visible, in-context affordance */}
      <p className="pt-3 pb-2 text-center font-body text-[12px] text-[#12372D]/55">
        Need help with an order?{' '}
        <a
          href={`https://wa.me/601163393436?text=${encodeURIComponent(
            'Hi Ayurvedic Wellness Centre, I need help with an order.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#B58A3B] underline-offset-4 transition-colors hover:text-[#B58A3B] hover:underline"
        >
          Contact Support
        </a>
      </p>
    </div>
  )
}
