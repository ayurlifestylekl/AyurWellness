import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Truck, ExternalLink, Leaf, FileText } from 'lucide-react'
import OrderStatusPill from './OrderStatusPill'
import ReorderButton from './ReorderButton'
import { getCourierTrackingUrl } from '@/lib/dashboard/courier-urls'
import type { OrderListItem } from '@/lib/dashboard/order-queries'

interface OrderListCardProps {
  order: OrderListItem
}

const dateFormat = new Intl.DateTimeFormat('en-MY', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function shortId(id: string): string {
  return id.slice(-6).toUpperCase()
}

function itemSummary(order: OrderListItem): string {
  if (!order.firstItem || order.itemCount === 0) return 'No items'
  if (order.itemCount === 1) return order.firstItem.name
  const remaining = order.itemCount - 1
  return `${order.firstItem.name} + ${remaining} more ${remaining === 1 ? 'item' : 'items'}`
}

export default function OrderListCard({ order }: OrderListCardProps) {
  const trackingUrl = getCourierTrackingUrl(order.courier_service, order.tracking_number)
  const detailHref = `/account/orders/${order.id}`
  const isShipped = order.fulfillment_status === 'shipped'
  const isPaid = order.payment_status === 'paid'
  const showTrackBtn = Boolean(trackingUrl && isShipped)

  const reorderLines = order.lines.map((l) => ({
    product: { id: l.productId, name: l.name },
    quantity: l.quantity,
  }))

  return (
    <article
      className="group relative overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B58A3B]/35"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      <Link
        href={detailHref}
        className="flex items-stretch gap-4 px-5 py-4 sm:gap-5 sm:px-6 sm:py-5"
      >
        {/* Thumbnail */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#006B3C]/[0.06] sm:h-16 sm:w-16">
          {order.firstItem?.imageUrl ? (
            <Image
              src={order.firstItem.imageUrl}
              alt={order.firstItem.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Leaf className="h-5 w-5 text-[#006B3C]/40" strokeWidth={1.6} />
            </div>
          )}
        </div>

        {/* Order info */}
        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[#006B3C]/60">
              #{shortId(order.id)}
            </span>
            <span className="font-body text-[11.5px] text-[#12372D]/45">
              · {dateFormat.format(new Date(order.created_at))}
            </span>
          </div>

          <p className="truncate font-heading text-[13.5px] font-semibold text-[#006B3C]" style={{ letterSpacing: '-0.005em' }}>
            {itemSummary(order)}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusPill
              fulfillmentStatus={order.fulfillment_status}
              paymentStatus={order.payment_status}
            />
            {order.courier_service && order.tracking_number && (
              <span className="inline-flex items-center gap-1 font-body text-[11.5px] text-[#006B3C]/55">
                <Truck className="h-3 w-3" />
                {order.courier_service} · {order.tracking_number}
              </span>
            )}
          </div>
        </div>

        {/* Total + arrow */}
        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
          <span
            className="font-heading text-[17px] font-bold leading-none text-[#006B3C]"
            style={{ letterSpacing: '-0.01em' }}
          >
            {order.total_amount_rm != null
              ? `RM ${Number(order.total_amount_rm).toFixed(2)}`
              : '—'}
          </span>
          <span className="inline-flex items-center gap-1 font-heading text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#006B3C]/45 transition-colors group-hover:text-[#B58A3B]">
            View
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>

      {/* Actions footer — sibling of <Link>, no nested-click issues */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#006B3C]/6 px-5 py-2.5 sm:px-6">
        {showTrackBtn && (
          <a
            href={trackingUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#006B3C]/60 transition-colors hover:text-[#B58A3B]"
          >
            Track on {order.courier_service}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {isPaid && (
          <a
            href={`/account/orders/${order.id}/invoice`}
            download
            className="group/btn inline-flex items-center gap-1.5 rounded-full border border-[#006B3C]/12 bg-white px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#006B3C]/65 transition-all hover:border-[#006B3C]/25 hover:text-[#006B3C]"
            aria-label="Download receipt PDF"
          >
            <FileText className="h-3 w-3" strokeWidth={2} />
            Receipt
          </a>
        )}

        {reorderLines.length > 0 && (
          <ReorderButton variant="chip" items={reorderLines} />
        )}
      </div>
    </article>
  )
}
