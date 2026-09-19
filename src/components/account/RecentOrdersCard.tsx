import Link from 'next/link'
import { Package, ArrowRight, Truck } from 'lucide-react'
import OrderStatusPill from './OrderStatusPill'
import EmptyState from './EmptyState'
import type { Database } from '@/lib/database.types'

type OrderRow = Database['public']['Tables']['orders']['Row']

interface RecentOrderPreview extends Pick<OrderRow,
  'id' | 'total_amount_rm' | 'payment_status' | 'fulfillment_status' |
  'courier_service' | 'tracking_number' | 'created_at'> {
  itemCount: number
}

interface RecentOrdersCardProps {
  orders: RecentOrderPreview[]
}

const dateFormat = new Intl.DateTimeFormat('en-MY', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function shortId(id: string): string {
  // UUIDs are long; show last 6 chars as a friendly tag
  return id.slice(-6).toUpperCase()
}

export default function RecentOrdersCard({ orders }: RecentOrdersCardProps) {
  return (
    <section
      className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#006B3C]/6 px-5 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#006B3C]/[0.06]">
            <Package className="h-3.5 w-3.5 text-[#006B3C]" strokeWidth={1.8} />
          </span>
          <h2 className="font-heading text-[13px] font-semibold text-[#006B3C]">
            Recent orders
          </h2>
        </div>
        {orders.length > 0 && (
          <Link
            href="/account/orders"
            className="group inline-flex items-center gap-1 font-heading text-[11.5px] font-semibold text-[#006B3C]/55 transition-colors hover:text-[#B58A3B]"
          >
            View all
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* Body */}
      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          body="Your wellness journey starts here. Explore our herbal formulas, oils, and combos."
          ctaLabel="Shop products"
          ctaHref="/products"
        />
      ) : (
        <ul className="divide-y divide-[#006B3C]/6">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#006B3C]/[0.025] sm:px-6"
              >
                {/* Left — order info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[#006B3C]/60">
                      #{shortId(order.id)}
                    </span>
                    <span className="font-body text-[11px] text-[#12372D]/45">
                      · {dateFormat.format(new Date(order.created_at))}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <OrderStatusPill
                      fulfillmentStatus={order.fulfillment_status}
                      paymentStatus={order.payment_status}
                    />
                    <span className="font-body text-[11.5px] text-[#12372D]/55">
                      {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                    </span>
                    {order.tracking_number && order.courier_service && (
                      <span className="inline-flex items-center gap-1 font-body text-[11px] text-[#006B3C]/55">
                        <Truck className="h-3 w-3" />
                        {order.courier_service}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right — total */}
                <div className="flex shrink-0 flex-col items-end">
                  <span
                    className="font-heading text-[15px] font-bold text-[#006B3C]"
                    style={{ letterSpacing: '-0.01em' }}
                  >
                    RM {Number(order.total_amount_rm).toFixed(2)}
                  </span>
                  <ArrowRight className="mt-1 h-3.5 w-3.5 text-[#006B3C]/25 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#B58A3B]" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
