import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  listMarketplaceOrders,
  type MarketplaceOrdersFilters,
} from '@/lib/admin/marketplace-orders/queries'
import MarketplaceFilters from './MarketplaceFilters'
import MarketplaceTable from './MarketplaceTable'

export const metadata = { title: 'Marketplace Orders · Admin' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { status?: string; channel?: string; q?: string }
}

export default async function MarketplaceOrdersPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const filters: MarketplaceOrdersFilters = {
    status: (searchParams.status as MarketplaceOrdersFilters['status']) ?? 'pending',
    channel: searchParams.channel as MarketplaceOrdersFilters['channel'],
    source: 'admin',
    search: searchParams.q,
    limit: 200,
  }
  const { items, total } = await listMarketplaceOrders(supabase, filters)

  const pendingValue = items
    .filter((i) => i.status === 'pending')
    .reduce((s, i) => s + i.totalAmountRm, 0)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
            Multi-channel sales
          </span>
          <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C]">
            Marketplace orders
          </h1>
          <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
            {total} order{total === 1 ? '' : 's'} in this view
            {pendingValue > 0 ? ` · RM ${pendingValue.toFixed(2)} pending approval` : ''}
          </p>
        </div>
        <Link
          href="/admin/marketplace-orders/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#006B3C] px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-[#006B3C]"
        >
          <Plus className="h-3.5 w-3.5" />
          Enter order
        </Link>
      </header>

      <section className="rounded-2xl border border-[#006B3C]/10 bg-white p-4 text-[12.5px] text-[#12372D]/70">
        <p className="font-semibold text-[#006B3C]">Admin-entered marketplace orders</p>
        <p className="mt-1">
          This page is for orders <strong>your clinic staff</strong> received on Shopee Seller
          Center, TikTok Seller Center, Lazada, or via WhatsApp / Instagram DM. Click{' '}
          <strong>Enter order</strong> to key one in. On approval, a real order is created in{' '}
          <strong>/admin/orders</strong> — stock auto-deducts, customer record matches by phone
          or email.
        </p>
        <p className="mt-2">
          📨 Orders submitted by brand partners (affiliates) go to a separate page:{' '}
          <Link
            href="/admin/agent-submissions"
            className="font-semibold text-[#B58A3B] hover:underline"
          >
            Agent Submissions →
          </Link>
        </p>
      </section>

      <MarketplaceFilters />
      <MarketplaceTable items={items} />
    </div>
  )
}
