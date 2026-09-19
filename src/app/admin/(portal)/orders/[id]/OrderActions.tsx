'use client'

import StatusTransitionDialog from './StatusTransitionDialog'
import TrackingDialog from './TrackingDialog'
import RefundDialog from './RefundDialog'
import type { FulfillmentStatus } from '@/lib/admin/orders/status-transitions'

export default function OrderActions({
  orderId,
  currentStatus,
  totalRm,
  paymentStatus,
}: {
  orderId: string
  currentStatus: FulfillmentStatus
  totalRm: number
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusTransitionDialog orderId={orderId} currentStatus={currentStatus} />
      <TrackingDialog orderId={orderId} />
      {paymentStatus === 'paid' ? (
        <RefundDialog orderId={orderId} totalRm={totalRm} />
      ) : null}
    </div>
  )
}
