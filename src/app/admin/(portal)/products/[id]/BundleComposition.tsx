'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import { addBundleItem, removeBundleItem } from '@/lib/admin/products/actions'

interface Component {
  id: string
  childProductId: string
  childName: string
  childSku: string
  childPriceRm: number
  quantity: number
}

interface ProductOption {
  id: string
  name: string
  sku: string
  price_rm: number
}

export default function BundleComposition({
  bundleId,
  initial,
  availableProducts,
}: {
  bundleId: string
  initial: Component[]
  availableProducts: ProductOption[]
}) {
  const [items, setItems] = useState<Component[]>(initial)
  const [picked, setPicked] = useState('')
  const [qty, setQty] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const usedIds = new Set(items.map((i) => i.childProductId))
  const choices = availableProducts.filter((p) => p.id !== bundleId && !usedIds.has(p.id))
  const total = items.reduce((s, i) => s + i.childPriceRm * i.quantity, 0)

  function add() {
    if (!picked) return
    const p = availableProducts.find((x) => x.id === picked)
    if (!p) return
    startTransition(async () => {
      setError(null)
      const r = await addBundleItem({
        bundleId,
        componentProductId: picked,
        quantity: qty,
      })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setItems((arr) => [
        ...arr,
        {
          id: 'tmp-' + Date.now(),
          childProductId: p.id,
          childName: p.name,
          childSku: p.sku,
          childPriceRm: Number(p.price_rm),
          quantity: qty,
        },
      ])
      setPicked('')
      setQty(1)
    })
  }

  function remove(it: Component) {
    startTransition(async () => {
      setError(null)
      const r = await removeBundleItem({ bundleId, itemId: it.id })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setItems((arr) => arr.filter((x) => x.id !== it.id))
    })
  }

  return (
    <div className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
      <h3 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
        Bundle composition
      </h3>
      <p className="mt-1 text-[11px] text-[#12372D]/55">
        Add the products that make up this kit. Customers see the bundle as one purchasable item.
      </p>

      {items.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-[#006B3C]/15 bg-[#EDF4E7]/40 p-4 text-center text-[12px] italic text-[#12372D]/55">
          No components yet.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[#006B3C]/6">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-2 py-2 text-[13px]">
              <span className="flex-1">
                <span className="font-semibold text-[#006B3C]">{it.childName}</span>
                <span className="ml-2 text-[11px] text-[#12372D]/55">{it.childSku}</span>
              </span>
              <span className="w-12 text-right">×{it.quantity}</span>
              <span className="w-24 text-right text-[12px] text-[#12372D]/65">
                RM {(it.childPriceRm * it.quantity).toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => remove(it)}
                disabled={pending}
                className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
          <li className="flex items-center justify-end gap-2 pt-2 text-[12.5px] font-semibold text-[#006B3C]">
            Components total: RM {total.toFixed(2)}
          </li>
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <select
          value={picked}
          onChange={(e) => setPicked(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
        >
          <option value="">Add component…</option>
          {choices.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku}) — RM {Number(p.price_rm).toFixed(2)}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
          className="w-16 rounded-lg border border-[#006B3C]/15 px-2 py-2 text-center text-[13px]"
        />
        <button
          type="button"
          disabled={pending || !picked}
          onClick={add}
          className="inline-flex items-center gap-1 rounded-lg bg-[#006B3C] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#006B3C] disabled:opacity-50"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>

      {error ? <p className="mt-2 text-[12px] text-red-600">{error}</p> : null}
    </div>
  )
}
