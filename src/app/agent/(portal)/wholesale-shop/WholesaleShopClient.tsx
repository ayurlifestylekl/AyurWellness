'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, ShoppingCart, X } from 'lucide-react'
import type { WholesaleCatalogItem } from '@/lib/agent/wholesale-shop/queries'
import { useWholesaleCart } from '@/components/agent/WholesaleCartProvider'

export default function WholesaleShopClient({
  catalog,
}: {
  catalog: WholesaleCatalogItem[]
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')
  const cart = useWholesaleCart()

  const categories = useMemo(() => {
    const set = new Set<string>()
    catalog.forEach((p) => p.category && set.add(p.category))
    return Array.from(set).sort()
  }, [catalog])

  const filtered = useMemo(() => {
    return catalog.filter((p) => {
      if (category && p.category !== category) return false
      if (search) {
        const s = search.toLowerCase()
        if (
          !p.name.toLowerCase().includes(s) &&
          !(p.sku ?? '').toLowerCase().includes(s)
        )
          return false
      }
      return true
    })
  }, [catalog, category, search])

  if (catalog.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#12372D]/15 p-12 text-center font-body text-sm italic text-[#12372D]/55">
        No products are currently available for wholesale. Check back later or
        ask admin to enable products in the wholesale shop.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar + cart trigger */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#12372D]/10 bg-white p-3">
        <input
          type="search"
          placeholder="Search product or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-[#12372D]/15 bg-white px-3 py-1.5 text-[13px]"
        />
        {categories.length > 0 ? (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-[#12372D]/15 bg-white px-3 py-1.5 text-[13px]"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : null}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#149447] px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#12372D]"
        >
          <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2} />
          Cart
          {cart.totalUnits > 0 ? (
            <span className="ml-0.5 rounded-full bg-[#B58A3B] px-1.5 py-0.5 text-[10.5px] font-bold text-white">
              {cart.totalUnits}
            </span>
          ) : null}
        </button>
      </div>

      {/* Catalog grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#12372D]/15 p-12 text-center font-body text-sm italic text-[#12372D]/55">
          No products match your filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        catalog={catalog}
      />
    </div>
  )
}

function ProductCard({ product: p }: { product: WholesaleCatalogItem }) {
  const cart = useWholesaleCart()
  const qty = cart.getQty(p.id)
  const margin = p.retailPriceRm - p.wholesalePriceRm
  const marginPct =
    p.retailPriceRm > 0 ? Math.round((margin / p.retailPriceRm) * 100) : 0
  const outOfStock = p.stockQty <= 0 && !p.allowBackorder

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[#12372D]/8 bg-white">
      <div className="relative aspect-square bg-[#EDF4E7]/40">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt={p.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#12372D]/30">
            No image
          </div>
        )}
        {outOfStock ? (
          <span className="absolute right-2 top-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
            Out of stock
          </span>
        ) : p.stockQty <= 5 ? (
          <span className="absolute right-2 top-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            {p.stockQty} left
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-heading text-[13.5px] font-semibold text-[#12372D]">
          {p.name}
        </h3>
        {p.sku ? (
          <p className="mt-0.5 font-mono text-[10.5px] text-[#12372D]/55">{p.sku}</p>
        ) : null}
        {p.shortDescription ? (
          <p className="mt-1.5 line-clamp-2 text-[11.5px] text-[#12372D]/65">
            {p.shortDescription}
          </p>
        ) : null}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-heading text-[16px] font-bold text-[#12372D]">
            RM {p.wholesalePriceRm.toFixed(2)}
          </span>
          <span className="text-[11px] text-[#12372D]/55 line-through">
            RM {p.retailPriceRm.toFixed(2)}
          </span>
        </div>
        {margin > 0 ? (
          <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">
            Your margin: RM {margin.toFixed(2)} ({marginPct}%)
          </p>
        ) : null}

        <div className="mt-3">
          {qty === 0 ? (
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => cart.add(p.id, 1)}
              className="w-full rounded-lg bg-[#149447] py-2 text-[12.5px] font-semibold text-white hover:bg-[#12372D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {outOfStock ? 'Out of stock' : 'Add to cart'}
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-[#149447]/30 bg-[#EDF4E7]/40 p-1">
              <button
                type="button"
                onClick={() => cart.setQty(p.id, qty - 1)}
                aria-label="Decrease"
                className="flex h-7 w-7 items-center justify-center rounded-md text-[#12372D] hover:bg-white"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => {
                  const n = Math.max(0, Math.floor(Number(e.target.value) || 0))
                  cart.setQty(p.id, n)
                }}
                className="w-12 bg-transparent text-center text-[13px] font-semibold text-[#12372D] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => cart.add(p.id, 1)}
                aria-label="Increase"
                className="flex h-7 w-7 items-center justify-center rounded-md text-[#12372D] hover:bg-white"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function CartDrawer({
  open,
  onClose,
  catalog,
}: {
  open: boolean
  onClose: () => void
  catalog: WholesaleCatalogItem[]
}) {
  const cart = useWholesaleCart()
  const productMap = useMemo(() => {
    const m = new Map<string, WholesaleCatalogItem>()
    catalog.forEach((p) => m.set(p.id, p))
    return m
  }, [catalog])

  const enriched = cart.lines
    .map((l) => {
      const p = productMap.get(l.productId)
      if (!p) return null
      return { line: l, product: p }
    })
    .filter((x): x is { line: { productId: string; quantity: number }; product: WholesaleCatalogItem } => x !== null)

  const subtotal = enriched.reduce(
    (s, e) => s + e.product.wholesalePriceRm * e.line.quantity,
    0,
  )

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close cart"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-[#12372D]/10 px-5 py-4">
          <h2 className="font-heading text-[15px] font-semibold text-[#12372D]">
            Your wholesale cart
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#12372D]/60 hover:bg-[#12372D]/[0.06]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {enriched.length === 0 ? (
            <p className="mt-12 text-center text-[13px] italic text-[#12372D]/55">
              Your cart is empty. Browse the shop and add products to get started.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {enriched.map(({ line, product: p }) => (
                <li
                  key={p.id}
                  className="flex gap-3 rounded-2xl border border-[#12372D]/8 p-3"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#EDF4E7]/40">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="font-heading text-[13px] font-semibold text-[#12372D]">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-[#12372D]/55">
                      RM {p.wholesalePriceRm.toFixed(2)} each
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-lg border border-[#12372D]/15 p-0.5">
                        <button
                          type="button"
                          onClick={() => cart.setQty(p.id, line.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded text-[#12372D]"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-[12.5px] font-semibold">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => cart.add(p.id, 1)}
                          className="flex h-6 w-6 items-center justify-center rounded text-[#12372D]"
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-heading text-[13px] font-bold text-[#12372D]">
                        RM {(p.wholesalePriceRm * line.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => cart.remove(p.id)}
                    className="self-start text-[11px] font-semibold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {enriched.length > 0 ? (
          <footer className="border-t border-[#12372D]/10 px-5 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] text-[#12372D]/65">Subtotal</span>
              <span className="font-heading text-[18px] font-bold text-[#12372D]">
                RM {subtotal.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-[10.5px] text-[#12372D]/50">
              Shipping confirmed at checkout
            </p>
            <Link
              href="/agent/wholesale-shop/checkout"
              onClick={onClose}
              className="mt-3 block w-full rounded-lg bg-[#149447] py-2.5 text-center text-[13px] font-semibold text-white hover:bg-[#12372D]"
            >
              Review & checkout
            </Link>
          </footer>
        ) : null}
      </aside>
    </>
  )
}
