import Link from 'next/link'
import {
  getTodaysOrderStats,
  getLowStockCount,
  listPendingCancellations,
} from '@/lib/product-management/queries'

export const metadata = { title: 'Product Management · Dashboard' }
export const dynamic = 'force-dynamic'

export default async function ProductManagementDashboardPage() {
  const [{ orders, revenue }, lowStock, pendingCancellations] = await Promise.all([
    getTodaysOrderStats(),
    getLowStockCount(),
    listPendingCancellations(),
  ])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div>
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          Overview
        </span>
        <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#12372D]">
          Product Management
        </h1>
        <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
          Catalog, inventory, orders, fulfillment, and refunds in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today’s orders" value={String(orders)} />
        <StatCard label="Revenue today" value={`RM ${revenue.toFixed(2)}`} />
        <StatCard label="Low-stock SKUs" value={String(lowStock)} href="/admin/inventory" />
        <StatCard label="Pending refunds" value={String(pendingCancellations.length)} href="/product-management/cancellations" />
      </div>

      <div className="rounded-2xl border border-[#12372D]/8 bg-white p-6">
        <h2 className="font-heading text-[16px] font-bold text-[#12372D]">
          Quick links
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-[13px] text-[#12372D]/80 sm:grid-cols-2 lg:grid-cols-3">
          <li>• <Link href="/admin/products" className="text-[#12372D] hover:underline">Add / edit products in Catalog</Link></li>
          <li>• <Link href="/admin/inventory" className="text-[#12372D] hover:underline">Receive or write off stock in Inventory</Link></li>
          <li>• <Link href="/product-management/orders" className="text-[#12372D] hover:underline">View and update orders in Orders</Link></li>
          <li>• <Link href="/product-management/orders" className="text-[#12372D] hover:underline">Print shipping labels in Fulfillment</Link></li>
          <li>• <Link href="/product-management/cancellations" className="text-[#12372D] hover:underline">Approve cancellations in Cancellations & Refunds</Link></li>
          <li>• <Link href="/product-management/reports" className="text-[#12372D] hover:underline">Review sales in Reports</Link></li>
        </ul>
      </div>
    </div>
  )
}

function StatCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <div className="rounded-2xl border border-[#12372D]/8 bg-white p-4 transition-colors hover:bg-[#EDF4E7]/40">
      <p className="font-body text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/55">
        {label}
      </p>
      <p className="mt-2 font-heading text-[24px] font-bold text-[#12372D]">
        {value}
      </p>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}
