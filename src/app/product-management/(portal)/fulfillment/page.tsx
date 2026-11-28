import { listFulfilmentQueue } from '@/lib/product-management/queries'
import FulfilmentQueue from './FulfilmentQueue'
import JtPanel from './JtPanel'
import { JT_INTL_SETTINGS, JT_SETTINGS } from '@/lib/fulfilment/jt'

export const metadata = { title: 'Fulfillment · Product Management' }
export const dynamic = 'force-dynamic'

export default async function ProductManagementFulfillmentPage() {
  const queue = await listFulfilmentQueue()
  const missing = [
    ...(JT_SETTINGS.paymentMethod ? [] : ['Payment Method']),
    ...(JT_SETTINGS.serviceType ? [] : ['Service Type (pick up or drop off)']),
  ]
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header>
        <span className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">Orders</span>
        <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#12372D] sm:text-[32px]" style={{ letterSpacing: '-0.02em' }}>
          Fulfillment
        </h1>
        <p className="mt-2 max-w-2xl font-body text-[14px] leading-relaxed text-[#12372D]/60">
          Paid orders waiting to be packed and shipped. Tick orders to print labels or packing slips in one go.
        </p>
      </header>
      <JtPanel
        missingSettings={missing}
        missingIntlSettings={[
          ...(JT_INTL_SETTINGS.goodsName ? [] : ['Goods Name']),
          ...(JT_INTL_SETTINGS.transportationPurpose ? [] : ['Transportation Purpose']),
          ...(JT_INTL_SETTINGS.shippingTerms ? [] : ['Shipping Terms (DDU / DDP)']),
        ]}
      />
      <FulfilmentQueue orders={queue} />
    </div>
  )
}
