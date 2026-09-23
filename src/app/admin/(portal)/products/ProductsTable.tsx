'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import type { ProductListItem } from '@/lib/admin/products/queries'
import BulkActionsBar from './BulkActionsBar'

const STATUS_CLASS: Record<string, string> = {
  active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft:    'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-slate-100 text-slate-700 border-slate-300',
}

function stockChip(qty: number): { label: string; tone: string } {
  if (qty === 0) return { label: 'Out', tone: 'bg-red-50 text-red-700 border-red-200' }
  if (qty <= 5) return { label: `${qty} left`, tone: 'bg-amber-50 text-amber-700 border-amber-200' }
  return { label: String(qty), tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}

export default function ProductsTable({ items }: { items: ProductListItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => {
      if (prev.size === items.length) return new Set()
      return new Set(items.map((p) => p.id))
    })
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#006B3C]/15 p-12 text-center font-body text-sm italic text-[#12372D]/55">
        No products match your filters. Click <strong>+ Add product</strong> to create one,
        or <strong>Import CSV</strong> to bulk-load.
      </div>
    )
  }

  const allSelected = selected.size === items.length

  return (
    <div className="flex flex-col gap-3">
      <BulkActionsBar selectedIds={Array.from(selected)} />

      <div className="overflow-x-auto rounded-2xl border border-[#006B3C]/8 bg-white">
        <table className="min-w-[640px] w-full text-left text-[13px]">
          <thead className="bg-[#EDF4E7]/40 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-center">Stock</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">⭐</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#006B3C]/6">
            {items.map((p) => {
              const stock = stockChip(p.stockQty)
              return (
                <tr key={p.id} className="hover:bg-[#EDF4E7]/30">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                      aria-label={`Select ${p.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-10 w-10 rounded-lg border border-[#006B3C]/10 object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg border border-dashed border-[#006B3C]/15 bg-[#EDF4E7]/40" />
                      )}
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="font-semibold text-[#006B3C] hover:text-[#B58A3B]"
                      >
                        {p.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-[#12372D]/65">{p.sku}</td>
                  <td className="px-4 py-3 text-right">
                    {p.salePriceRm != null ? (
                      <>
                        <span className="text-[#B58A3B] font-semibold">
                          RM {p.salePriceRm.toFixed(2)}
                        </span>
                        <span className="ml-1 line-through text-[11px] text-[#12372D]/55">
                          RM {p.priceRm.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <>RM {p.priceRm.toFixed(2)}</>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${stock.tone}`}
                    >
                      {stock.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#12372D]/65">
                    {p.category ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_CLASS[p.status] ?? ''}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.featured ? (
                      <Star className="inline h-3.5 w-3.5 fill-[#B58A3B] text-[#B58A3B]" />
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[11.5px] text-[#12372D]/55">
                    {new Date(p.updatedAt).toLocaleDateString('en-MY')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
