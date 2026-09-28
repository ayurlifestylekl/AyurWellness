import { listShippingZones } from '@/lib/product-management/shipping'
import ShippingRatesClient from './ShippingRatesClient'

export const metadata = { title: 'Shipping Rates · Product Management' }
export const dynamic = 'force-dynamic'

export default async function ShippingRatesPage() {
  const zones = await listShippingZones()
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header>
        <span className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">Settings</span>
        <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#12372D] sm:text-[32px]" style={{ letterSpacing: '-0.02em' }}>
          Shipping rates
        </h1>
        <p className="mt-2 max-w-2xl font-body text-[14px] leading-relaxed text-[#12372D]/60">
          What customers pay for delivery at checkout. Changes apply to new orders straight away; orders already placed keep the
          shipping they were charged.
        </p>
      </header>
      <ShippingRatesClient zones={zones} />
    </div>
  )
}
