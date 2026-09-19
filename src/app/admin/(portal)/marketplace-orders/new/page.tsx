import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  listProductsForPicker,
  listAgentsForPicker,
} from '@/lib/admin/marketplace-orders/queries'
import MarketplaceOrderForm from './MarketplaceOrderForm'

export const metadata = { title: 'New Marketplace Order · Admin' }
export const dynamic = 'force-dynamic'

export default async function NewMarketplaceOrderPage() {
  const supabase = await createClient()
  const [products, agents] = await Promise.all([
    listProductsForPicker(supabase),
    listAgentsForPicker(supabase),
  ])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link
        href="/admin/marketplace-orders"
        className="text-[11px] uppercase tracking-wider text-[#006B3C]/55 hover:text-[#B58A3B]"
      >
        ← Back to marketplace orders
      </Link>
      <header>
        <h1 className="font-heading text-[24px] font-bold text-[#006B3C]">
          Enter marketplace order
        </h1>
        <p className="mt-1 text-[12.5px] text-[#12372D]/65">
          Key in the details from your Shopee / TikTok Shop / etc. seller center. Saves as
          pending — admin approves to create the real order, deduct stock, and trigger
          commissions.
        </p>
      </header>
      <MarketplaceOrderForm products={products} agents={agents} />
    </div>
  )
}
