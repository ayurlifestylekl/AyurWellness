import { MessageCircle, ExternalLink, FileText } from 'lucide-react'
import ReorderButton from './ReorderButton'
import CancelOrderButton from './CancelOrderButton'
import type { Database } from '@/lib/database.types'
import type { OrderItemWithProduct } from '@/lib/dashboard/order-queries'

type PaymentStatus = Database['public']['Tables']['orders']['Row']['payment_status']
type FulfillmentStatus = Database['public']['Tables']['orders']['Row']['fulfillment_status']

interface OrderActionsProps {
  orderId: string
  orderShortId: string
  paymentStatus: PaymentStatus
  fulfillmentStatus: FulfillmentStatus
  items: OrderItemWithProduct[]
}

export default function OrderActions({
  orderId,
  orderShortId,
  paymentStatus,
  fulfillmentStatus,
  items,
}: OrderActionsProps) {
  const whatsappUrl = `https://wa.me/601163393436?text=${encodeURIComponent(
    `Hi Ayurvedic Wellness Centre, I have a question about order #${orderShortId}.`
  )}`

  // Cancel only allowed at earliest stage — payment hasn't cleared AND
  // fulfillment is still processing (not yet shipped/delivered)
  const isCancellable =
    paymentStatus === 'pending' && fulfillmentStatus === 'processing'
  const canReorder = items.some((it) => it.product !== null)
  const canReceipt = paymentStatus === 'paid'

  return (
    <section
      className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      <div className="border-b border-[#006B3C]/6 px-5 py-3 sm:px-6">
        <h2 className="font-heading text-[13px] font-semibold text-[#006B3C]">
          Need something else?
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-2.5 px-5 py-4 sm:grid-cols-2 sm:gap-3 sm:px-6 lg:grid-cols-4">
        {/* Reorder — live */}
        {canReorder ? (
          <ReorderButton
            variant="primary"
            items={items.map((it) => ({
              product: it.product ? { id: it.product.id, name: it.product.name } : null,
              quantity: it.quantity,
            }))}
          />
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#006B3C]/12 bg-[#EDF4E7]/40 px-4 font-heading text-[12px] font-semibold text-[#006B3C]/45"
          >
            Reorder
          </button>
        )}

        {/* Download receipt — paid only */}
        {canReceipt ? (
          <a
            href={`/account/orders/${orderId}/invoice`}
            download
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#006B3C]/15 bg-white px-4 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-[#006B3C] transition-all hover:border-[#006B3C]/35 hover:bg-[#006B3C]/[0.03] active:scale-[0.98]"
          >
            <FileText className="h-3.5 w-3.5" strokeWidth={2} />
            Download receipt
          </a>
        ) : (
          <div className="hidden lg:block" aria-hidden />
        )}

        {/* Contact support — REAL WhatsApp deep link */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#006B3C] px-4 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-all hover:bg-[#006B3C] active:scale-[0.98]"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Contact support
          <ExternalLink className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </a>

        {/* Cancel order — only when payment pending and not yet shipped */}
        {isCancellable ? (
          <CancelOrderButton orderId={orderId} orderShortId={orderShortId} />
        ) : (
          <div className="hidden lg:block" aria-hidden />
        )}
      </div>

      <p className="border-t border-[#006B3C]/6 px-5 py-3 font-body text-[11px] italic text-[#12372D]/55 sm:px-6">
        Cancellations require 48 hours&apos; notice. Advance payments are non-refundable per our practice policy.
      </p>
    </section>
  )
}
