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
  const { items, total } = await listProductOrders({
    search: q,
    status,
    paymentStatus: payment,
    limit: 50,
  })

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
          <p className="mt-1 font-body text-[13px] text-[#12372D]/65">{total} total orders</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#12372D]/10 bg-white">
        <table className="w-full text-left text-[13px]">
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
          <p className="p-6 text-center text-[13px] text-[#12372D]/55">No product orders yet.</p>
        )}
      </div>
    </div>
  )
}

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
