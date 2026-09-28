import { listFulfilmentQueue } from '@/lib/product-management/queries'
import FulfilmentQueue from './FulfilmentQueue'

export const metadata = { title: 'Fulfillment · Product Management' }
export const dynamic = 'force-dynamic'

export default async function ProductManagementFulfillmentPage() {
  const queue = await listFulfilmentQueue()
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
      <FulfilmentQueue orders={queue} />
    </div>
  )
}
