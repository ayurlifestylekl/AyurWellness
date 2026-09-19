import Link from 'next/link'
import { Boxes, ArrowRight } from 'lucide-react'

export default function StockSummaryCard({
  productId,
  stockQty,
  lowStockThreshold,
  expiryDate,
}: {
  productId: string
  stockQty: number
  lowStockThreshold: number | null
  expiryDate: string | null
}) {
  const threshold = lowStockThreshold ?? 5
  const isLow = stockQty <= threshold
  const isOut = stockQty === 0

  return (
    <div className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
      <div className="flex items-center gap-2 text-[#006B3C]">
        <Boxes className="h-3.5 w-3.5" />
        <h3 className="font-heading text-[12.5px] font-semibold">Stock</h3>
      </div>
      <p
        className={`mt-2 font-heading text-[28px] font-bold ${
          isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-[#006B3C]'
        }`}
      >
        {stockQty}
      </p>
      <p className="text-[11.5px] text-[#12372D]/65">
        {isOut
          ? 'Out of stock'
          : isLow
            ? `Low (threshold ${threshold})`
            : `Healthy (threshold ${threshold})`}
      </p>
      {expiryDate ? (
        <p className="mt-2 text-[11.5px] text-[#12372D]/65">
          Expires {new Date(expiryDate).toLocaleDateString('en-MY')}
        </p>
      ) : null}
      <Link
        href={`/admin/inventory/${productId}`}
        className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#B58A3B] hover:text-[#006B3C]"
      >
        View stock history
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}
