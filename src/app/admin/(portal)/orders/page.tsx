import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { listAdminOrders, type AdminOrderFilters } from '@/lib/admin/orders/queries'
import { DEMO_ADMIN_EMAIL, MOCK_ORDER_LIST } from '@/lib/admin/orders/mocks'
import OrdersFilters from './OrdersFilters'
import OrdersTable from './OrdersTable'

import type { AdminOrderListItem } from '@/lib/admin/orders/queries'

export const metadata = { title: 'Orders · Admin' }
export const dynamic = 'force-dynamic'

function filterMocksByQuery(
  items: AdminOrderListItem[],
  filters: AdminOrderFilters,
): AdminOrderListItem[] {
  return items.filter((o) => {
    if (filters.fulfillmentStatus?.length && !filters.fulfillmentStatus.includes(o.fulfillmentStatus))
      return false
    if (filters.paymentStatus?.length && !filters.paymentStatus.includes(o.paymentStatus))
      return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const hay = [o.shortId, o.customerName, o.customerEmail].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

type FulfillmentStatus =
  | 'pending'
  | 'processing'
  | 'packing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

interface PageProps {
  searchParams: { q?: string; status?: string; payment?: string }
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const me = await getCurrentUser()
  const filters: AdminOrderFilters = {
    search: searchParams.q,
    fulfillmentStatus: searchParams.status
      ? [searchParams.status as FulfillmentStatus]
      : undefined,
    paymentStatus: searchParams.payment
      ? [searchParams.payment as PaymentStatus]
      : undefined,
    limit: 50,
  }
  const real = await listAdminOrders(supabase, filters)

  // Demo fallback: if signed in as the demo admin and no real orders exist
  // yet, show the in-memory mocks so the screen renders populated. Zero DB
  // writes — these never leave the request lifecycle.
  const isDemoAdmin = me?.email === DEMO_ADMIN_EMAIL
  const showMocks = isDemoAdmin && real.items.length === 0
  const items = showMocks ? filterMocksByQuery(MOCK_ORDER_LIST, filters) : real.items
  const total = showMocks ? items.length : real.total

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header className="flex items-end justify-between">
        <div>
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
            Fulfilment
          </span>
          <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C]">
            Orders
          </h1>
          <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
            {total} total {showMocks ? '· demo data (no real orders yet)' : ''}
          </p>
        </div>
        <Link
          href="/admin/orders/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#006B3C] px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-[#006B3C]"
        >
          <Plus className="h-3.5 w-3.5" />
          Manual order
        </Link>
      </header>

      <OrdersFilters />
      <OrdersTable items={items} />
    </div>
  )
}
