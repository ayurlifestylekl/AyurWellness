import Link from 'next/link'
import { Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  listMarketplaceOrders,
  type MarketplaceOrdersFilters,
} from '@/lib/admin/marketplace-orders/queries'
import MarketplaceFilters from '../marketplace-orders/MarketplaceFilters'
import AgentSubmissionsTable from './AgentSubmissionsTable'

export const metadata = { title: 'Agent Submissions · Admin' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { status?: string; channel?: string; q?: string }
}

export default async function AgentSubmissionsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const filters: MarketplaceOrdersFilters = {
    status: (searchParams.status as MarketplaceOrdersFilters['status']) ?? 'pending',
    channel: searchParams.channel as MarketplaceOrdersFilters['channel'],
    source: 'agent',
    search: searchParams.q,
    limit: 200,
  }
  const { items, total } = await listMarketplaceOrders(supabase, filters)

  const pendingCount = items.filter((i) => i.status === 'pending').length
  const pendingValue = items
    .filter((i) => i.status === 'pending')
    .reduce((s, i) => s + i.totalAmountRm, 0)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-[#B58A3B]" />
            <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
              Brand partners
            </span>
          </div>
          <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C]">
            Agent submissions
          </h1>
          <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
            {total} submission{total === 1 ? '' : 's'} in this view
            {pendingCount > 0
              ? ` · ${pendingCount} pending · RM ${pendingValue.toFixed(2)} awaiting approval`
              : ''}
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-[#B58A3B]/30 bg-[#EDF4E7]/40 p-4 text-[12.5px] text-[#12372D]/70">
        <p className="font-semibold text-[#006B3C]">Marketplace orders from your affiliates</p>
        <p className="mt-1">
          Brand partners submit their TikTok Shop / Shopee / Instagram / WhatsApp sales via{' '}
          <code className="font-mono">/agent/marketplace-orders/new</code>. Each submission lands
          here for your review. Click into an entry → <strong>Approve & create order</strong> to
          mirror it as a real order (stock deducts, commission credits the agent), or{' '}
          <strong>Reject</strong> with a reason if it&apos;s invalid.
        </p>
        <p className="mt-2">
          Your own clinic marketplace sales (not from agents) live on a different page:{' '}
          <Link
            href="/admin/marketplace-orders"
            className="font-semibold text-[#B58A3B] hover:underline"
          >
            Marketplace orders →
          </Link>
        </p>
      </section>

      <MarketplaceFilters basePath="/admin/agent-submissions" />
      <AgentSubmissionsTable items={items} />
    </div>
  )
}
