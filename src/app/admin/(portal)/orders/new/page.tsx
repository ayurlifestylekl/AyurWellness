import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ManualOrderForm from './ManualOrderForm'

export const metadata = { title: 'New Order · Admin' }
export const dynamic = 'force-dynamic'

export default async function NewManualOrderPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, price_rm')
    .order('name')
    .limit(200)

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/orders"
        className="text-[11px] uppercase tracking-wider text-[#006B3C]/55 hover:text-[#B58A3B]"
      >
        ← Back to orders
      </Link>
      <h1 className="mt-1 font-heading text-[24px] font-bold text-[#006B3C]">
        Manual order
      </h1>
      <p className="mt-1 text-[12px] text-[#12372D]/65">
        For walk-in customers, phone orders, or staff-recorded sales. Payment is
        captured offline; you can mark it paid on the order detail page after
        receiving the funds.
      </p>
      <ManualOrderForm products={(products ?? []) as ManualOrderFormProduct[]} />
    </div>
  )
}

interface ManualOrderFormProduct {
  id: string
  name: string
  sku: string | null
  price_rm: number
}
