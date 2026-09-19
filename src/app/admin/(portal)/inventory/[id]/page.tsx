import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getInventoryProductDetail,
  listStockMovements,
} from '@/lib/admin/products/queries'
import StockMovementsLog from './StockMovementsLog'
import ReceiveStockDialog from './ReceiveStockDialog'
import WriteOffDialog from './WriteOffDialog'
import RecountDialog from './RecountDialog'
import ProductSummaryCard from './ProductSummaryCard'

export const metadata = { title: 'Inventory · Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminInventoryDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const [product, movements] = await Promise.all([
    getInventoryProductDetail(supabase, params.id),
    listStockMovements(supabase, params.id, 100),
  ])
  if (!product) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p: any = product
  const threshold = p.low_stock_threshold ?? 5
  const isLow = p.stock_qty <= threshold
  const isOut = p.stock_qty === 0

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <Link
        href="/admin/inventory"
        className="text-[11px] uppercase tracking-wider text-[#006B3C]/55 hover:text-[#B58A3B]"
      >
        ← Back to inventory
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
            Stock & Movements
          </span>
          <h1 className="mt-2 font-heading text-[24px] font-bold text-[#006B3C]">
            {p.name}
          </h1>
          <p className="mt-1 text-[12px] text-[#12372D]/65">
            SKU {p.sku} · stock threshold {threshold}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`flex flex-col items-end ${
              isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-[#006B3C]'
            }`}
          >
            <span className="font-heading text-[36px] font-bold leading-none">
              {p.stock_qty}
            </span>
            <span className="text-[10.5px] uppercase tracking-wider">
              in stock
            </span>
          </div>
        </div>
      </header>

      <section className="flex flex-wrap items-center gap-2">
        <ReceiveStockDialog productId={p.id} />
        <WriteOffDialog productId={p.id} />
        <RecountDialog productId={p.id} currentSystemQty={p.stock_qty} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article
          className="overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white lg:col-span-2"
          style={{
            boxShadow:
              '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
          }}
        >
          <header className="border-b border-[#006B3C]/6 px-5 py-3 font-heading text-[13px] font-semibold text-[#006B3C]">
            Movement history
          </header>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <StockMovementsLog movements={movements as any} />
        </article>

        <aside className="flex flex-col gap-3">
          <ProductSummaryCard product={p} />
        </aside>
      </section>
    </div>
  )
}
