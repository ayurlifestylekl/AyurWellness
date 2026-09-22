'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingBag, Leaf, ArrowRight } from 'lucide-react'
import { useCart } from '@/lib/cart/CartProvider'
import { createClient } from '@/lib/supabase/client'

interface ProductInfo {
  slug: string
  name: string
  price_rm: number
  image_url: string | null
  stock_qty: number
}

export default function CartContents() {
  const { lines, setQuantity, removeItem, hydrated } = useCart()
  const [products, setProducts] = useState<Record<string, ProductInfo>>({})
  const [loading, setLoading] = useState(false)

  // Fetch product info for each line in the cart
  useEffect(() => {
    if (!hydrated || lines.length === 0) {
      setProducts({})
      return
    }
    const missing = lines.map((l) => l.productId).filter((id) => !products[id])
    if (missing.length === 0) return

    setLoading(true)
    const supabase = createClient()
    supabase
      .from('products')
      .select('slug, name, price_rm, image_url, stock_qty')
      .in('slug', missing)
      .then(({ data, error }) => {
        if (!error && data) {
          setProducts((prev) => {
            const next = { ...prev }
            for (const p of data as ProductInfo[]) {
              next[p.slug] = p
            }
            return next
          })
        }
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, lines])

  const subtotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const p = products[l.productId]
      if (!p) return sum
      return sum + Number(p.price_rm) * l.quantity
    }, 0)
  }, [lines, products])

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center font-body text-sm text-[#12372D]/55">
        Loading your bag…
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-16 text-center sm:pt-24">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#12372D]/[0.06]">
          <ShoppingBag className="h-6 w-6 text-[#149447]" strokeWidth={1.5} />
        </span>
        <h1
          className="mt-5 font-heading text-[28px] font-bold text-[#12372D] sm:text-[32px]"
          style={{ letterSpacing: '-0.02em' }}
        >
          Your bag is empty.
        </h1>
        <p className="mx-auto mt-2 max-w-md font-body text-[14px] text-[#12372D]/65" style={{ lineHeight: 1.6 }}>
          Find a formula for your dosha, or pick up where your practitioner left off.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/products"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#149447] px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#12372D]"
          >
            Shop products
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/account/assessments"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[#12372D]/15 bg-white px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-[#12372D] transition-colors hover:border-[#12372D]/35"
          >
            My assessments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
      <header className="mb-6">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[#12372D]/60">
          Your bag
        </span>
        <h1
          className="mt-1 font-heading text-[28px] font-bold text-[#12372D] sm:text-[34px]"
          style={{ letterSpacing: '-0.02em' }}
        >
          {lines.length} {lines.length === 1 ? 'item' : 'items'} saved
        </h1>
        <p className="mt-1 font-body text-[12.5px] text-[#12372D]/55">
          Cart is saved on this device until you check out.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Lines */}
        <ul className="flex flex-col gap-3 lg:col-span-8">
          {lines.map((line) => {
            const p = products[line.productId]
            const lineTotal = p ? Number(p.price_rm) * line.quantity : 0
            return (
              <li
                key={line.productId}
                className="flex items-center gap-4 rounded-3xl border border-[#12372D]/8 bg-white px-4 py-3 sm:px-5"
                style={{
                  boxShadow:
                    '0 1px 0 0 rgba(18, 55, 45,0.04), 0 12px 30px -16px rgba(18, 55, 45,0.18)',
                }}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#12372D]/[0.06]">
                  {p?.image_url ? (
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Leaf className="h-5 w-5 text-[#149447]/40" strokeWidth={1.6} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="truncate font-heading text-[14px] font-semibold text-[#12372D]">
                    {p?.name ?? (loading ? 'Loading…' : 'Unavailable product')}
                  </p>
                  <p className="font-body text-[12px] text-[#12372D]/55">
                    {p ? `RM ${Number(p.price_rm).toFixed(2)} each` : '—'}
                  </p>

                  {/* Qty stepper */}
                  <div className="mt-2 inline-flex items-stretch gap-1 rounded-full border border-[#12372D]/12 bg-white p-0.5">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(line.productId, Math.max(1, line.quantity - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[#12372D] transition-colors hover:bg-[#12372D]/[0.06]"
                    >
                      <Minus className="h-3 w-3" strokeWidth={2} />
                    </button>
                    <span className="flex min-w-[2ch] items-center justify-center font-heading text-[12px] font-bold text-[#12372D]">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(line.productId, line.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[#12372D] transition-colors hover:bg-[#12372D]/[0.06]"
                    >
                      <Plus className="h-3 w-3" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end justify-between self-stretch gap-2 py-1">
                  <span className="font-heading text-[15px] font-bold text-[#12372D]">
                    RM {lineTotal.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(line.productId)}
                    className="inline-flex items-center gap-1 font-heading text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#12372D]/45 transition-colors hover:text-red-700"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={2} />
                    Remove
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Summary */}
        <aside className="lg:col-span-4">
          <div
            className="overflow-hidden rounded-3xl border border-[#12372D]/8 bg-white"
            style={{
              boxShadow:
                '0 1px 0 0 rgba(18, 55, 45,0.04), 0 12px 30px -16px rgba(18, 55, 45,0.18)',
            }}
          >
            <div className="border-b border-[#12372D]/6 px-5 py-3">
              <h2 className="font-heading text-[13px] font-semibold text-[#12372D]">Summary</h2>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between border-b border-[#12372D]/6 pb-3">
                <span className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#12372D]/55">
                  Subtotal
                </span>
                <span className="font-heading text-[16px] font-bold text-[#12372D]">
                  RM {subtotal.toFixed(2)}
                </span>
              </div>
              <p className="mt-3 font-body text-[11.5px] italic text-[#12372D]/55" style={{ lineHeight: 1.55 }}>
                Shipping calculated at checkout. Cart saved on this device.
              </p>
              <Link
                href="/checkout"
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#149447] px-5 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#12372D]"
              >
                Proceed to checkout
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <p className="mt-2 text-center font-body text-[11px] text-[#12372D]/45">
                Prefer to order over chat?{' '}
                <a
                  href="https://wa.me/601163393436?text=Hi%2C%20I%27d%20like%20to%20place%20an%20order%20from%20my%20cart."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#B58A3B] underline-offset-4 hover:underline"
                >
                  WhatsApp us
                </a>
                .
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
