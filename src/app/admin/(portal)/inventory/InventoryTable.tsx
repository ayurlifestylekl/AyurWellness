import Link from 'next/link'
import type { InventoryRow } from '@/lib/admin/products/queries'

const STATUS_CHIP: Record<InventoryRow['status'], { label: string; tone: string }> = {
  healthy:  { label: 'Healthy',  tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  low:      { label: 'Low',      tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  out:      { label: 'Out',      tone: 'bg-red-50 text-red-700 border-red-200' },
  expiring: { label: 'Expiring', tone: 'bg-orange-50 text-orange-700 border-orange-200' },
}

export default function InventoryTable({ items }: { items: InventoryRow[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#006B3C]/15 p-12 text-center font-body text-sm italic text-[#12372D]/55">
        No products match this filter.
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-[#EDF4E7]/40 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3 text-right">Stock</th>
            <th className="px-4 py-3 text-right">Threshold</th>
            <th className="px-4 py-3">Expiry</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#006B3C]/6">
          {items.map((r) => {
            const chip = STATUS_CHIP[r.status]
            return (
              <tr key={r.id} className="hover:bg-[#EDF4E7]/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {r.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.imageUrl}
                        alt=""
                        className="h-10 w-10 rounded-lg border border-[#006B3C]/10 object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg border border-dashed border-[#006B3C]/15 bg-[#EDF4E7]/40" />
                    )}
                    <Link
                      href={`/admin/inventory/${r.id}`}
                      className="font-semibold text-[#006B3C] hover:text-[#B58A3B]"
                    >
                      {r.name}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-[11.5px] text-[#12372D]/65">{r.sku}</td>
                <td className="px-4 py-3 text-[12px] text-[#12372D]/65">
                  {r.category ?? '—'}
                </td>
                <td
                  className={`px-4 py-3 text-right font-semibold ${
                    r.status === 'out'
                      ? 'text-red-600'
                      : r.status === 'low'
                        ? 'text-amber-600'
                        : 'text-[#006B3C]'
                  }`}
                >
                  {r.stockQty}
                </td>
                <td className="px-4 py-3 text-right text-[12px] text-[#12372D]/65">
                  {r.effectiveThreshold}
                  {r.lowStockThreshold == null ? (
                    <span className="text-[10px] text-[#12372D]/45"> (global)</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-[12px] text-[#12372D]/65">
                  {r.expiryDate
                    ? new Date(r.expiryDate).toLocaleDateString('en-MY')
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${chip.tone}`}
                  >
                    {chip.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
