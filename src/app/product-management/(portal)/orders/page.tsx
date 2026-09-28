import Link from 'next/link'
import { format } from 'date-fns'
import { listProductOrders } from '@/lib/product-management/queries'

export const metadata = { title: 'Orders · Product Management' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string; payment?: string }>
}

export default async function ProductOrdersPage({ searchParams }: PageProps) {
  const { q, status, payment } = await searchParams
  const activeStatus = STATUS_FILTERS.some((f) => f.key === status) ? status : undefined
  const { items, total } = await listProductOrders({
    search: q,
    status: activeStatus,
    paymentStatus: payment,
    limit: 50,
  })
  const hrefFor = (key?: string) => {
    const p = new URLSearchParams()
    if (key) p.set('status', key)
    if (q) p.set('q', q)
    const qs = p.toString()
    return `/product-management/orders${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
            Fulfillment
          </span>
          <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#12372D]">
            Product Orders
          </h1>
          <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
            {total} {activeStatus || q ? 'matching' : 'total'} order{total === 1 ? '' : 's'}
          </p>
        </div>
        <form method="get" className="flex w-full gap-2 sm:w-auto">
          {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Order #, email or phone"
            className="h-10 w-full rounded-xl border border-[#12372D]/12 bg-white px-3.5 font-body text-[13.5px] text-[#12372D] placeholder:text-[#12372D]/35 focus:border-[#006B3C] focus:outline-none focus:ring-4 focus:ring-[#006B3C]/10 sm:w-72"
          />
          <button type="submit" className="h-10 rounded-xl bg-[#12372D] px-4 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#0E2C24]">
            Search
          </button>
        </form>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by status">
        {[{ key: undefined, label: 'All' }, ...STATUS_FILTERS].map((f) => (
          <Link
            key={f.label}
            href={hrefFor(f.key)}
            className={[
              'inline-flex h-9 shrink-0 items-center rounded-lg px-3.5 font-heading text-[12px] font-semibold transition-colors',
              activeStatus === f.key ? 'bg-[#12372D] text-white' : 'border border-[#12372D]/10 bg-white text-[#12372D]/65 hover:text-[#12372D]',
            ].join(' ')}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-2xl border border-[#12372D]/10 bg-white">
        <table className="min-w-[640px] w-full text-left text-[13px]">
          <thead className="bg-[#EDF4E7]">
            <tr>
              <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Order</th>
              <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Customer</th>
              <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Total</th>
              <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Status</th>
              <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">Date</th>
              <th className="px-4 py-3 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#12372D]/8">
            {items.map((order) => (
              <tr key={order.id} className="hover:bg-[#EDF4E7]/40">
                <td className="px-4 py-3 font-heading font-semibold text-[#12372D]">{order.order_number}</td>
                <td className="px-4 py-3">
                  <p className="text-[#12372D]/80">{order.email}</p>
                  {order.phone && <p className="text-[11px] text-[#12372D]/55">{order.phone}</p>}
                </td>
                <td className="px-4 py-3 font-heading font-semibold text-[#12372D]">RM {order.total_rm.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                  <span className="ml-1.5 text-[11px] text-[#12372D]/55">({order.payment_status})</span>
                </td>
                <td className="px-4 py-3 text-[#12372D]/65">{format(new Date(order.created_at), 'dd MMM yyyy')}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/product-management/orders/${order.id}`}
                    className="rounded-md bg-[#12372D] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#12372D]/90"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="p-6 text-center text-[13px] text-[#12372D]/55">
            {activeStatus || q ? 'No orders match this filter.' : 'No product orders yet.'}
          </p>
        )}
      </div>
    </div>
  )
}

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'awaiting_payment', label: 'Awaiting payment' },
  { key: 'paid', label: 'To pack' },
  { key: 'processing', label: 'Packing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'refunded', label: 'Refunded' },
]

function StatusBadge({ status }: { status: string }) {
  const colour =
    status === 'paid'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'awaiting_payment'
        ? 'bg-amber-100 text-amber-800'
        : status === 'cancelled' || status === 'refunded'
          ? 'bg-red-100 text-red-800'
          : 'bg-slate-100 text-slate-800'
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${colour}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
