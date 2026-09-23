import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Package, ShoppingCart } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { getAgentProfileByUserId } from '@/lib/agent/dashboard/queries'
import {
  listAgentWholesaleOrders,
  WHOLESALE_STATUS_LABEL,
  type WholesaleStatus,
} from '@/lib/agent/wholesale-orders/queries'

export const metadata = { title: 'My Wholesale Orders' }
export const dynamic = 'force-dynamic'

const STATUS_CLASS: Record<WholesaleStatus, string> = {
  pending_payment: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  fulfilling: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

export default async function AgentMyWholesaleOrdersPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/agent/login')

  const supabase = await createClient()
  const profile = await getAgentProfileByUserId(supabase, me.profile.id)
  if (!profile) redirect('/agent/dashboard')

  const orders = await listAgentWholesaleOrders(supabase, profile.id)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
            Your purchases
          </span>
          <h1 className="mt-2 font-heading text-3xl font-bold leading-tight text-[#12372D]">
            My wholesale orders
          </h1>
          <p className="mt-2 font-body text-[13.5px] text-[#12372D]/70">
            Every order you&apos;ve placed in the wholesale shop, with current status and
            tracking when shipped.
          </p>
        </div>
        <Link
          href="/agent/wholesale-shop"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#149447] px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-[#12372D]"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Place new order
        </Link>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[#12372D]/15 p-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#12372D]/[0.06]">
            <Package className="h-5 w-5 text-[#149447]" strokeWidth={1.8} />
          </span>
          <p className="font-heading text-[14px] font-semibold text-[#12372D]">
            No wholesale orders yet
          </p>
          <p className="max-w-sm font-body text-[12.5px] text-[#12372D]/65">
            Browse the wholesale shop and stock up on products to resell.
          </p>
          <Link
            href="/agent/wholesale-shop"
            className="mt-1 text-[12px] font-semibold text-[#B58A3B] hover:underline"
          >
            Open the wholesale shop →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#12372D]/8 bg-white">
          <table className="min-w-[640px] w-full text-left text-[13px]">
            <thead className="bg-[#EDF4E7]/40 text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#12372D]/6">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-[#EDF4E7]/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/agent/wholesale-orders/${o.id}`}
                      className="font-mono text-[11.5px] font-semibold text-[#12372D] hover:text-[#B58A3B]"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-[#12372D]/65">
                    {new Date(o.createdAt).toLocaleDateString('en-MY')}
                  </td>
                  <td className="px-4 py-3 text-right">{o.itemCount}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    RM {o.totalRm.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_CLASS[o.status] ?? ''}`}
                    >
                      {WHOLESALE_STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#12372D]/70">
                    {o.trackingNumber ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
