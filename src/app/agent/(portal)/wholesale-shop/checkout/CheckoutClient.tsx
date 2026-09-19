'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { WholesaleCatalogItem } from '@/lib/agent/wholesale-shop/queries'
import { placeWholesaleOrder } from '@/lib/agent/wholesale-shop/actions'
import { useWholesaleCart } from '@/components/agent/WholesaleCartProvider'

const MY_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang',
  'Penang', 'Perak', 'Perlis', 'Sabah', 'Sarawak', 'Selangor',
  'Terengganu', 'Kuala Lumpur', 'Labuan', 'Putrajaya',
]

export default function CheckoutClient({
  catalog,
  defaultShippingAddress,
  defaultShippingPostcode,
  defaultShippingState,
}: {
  catalog: WholesaleCatalogItem[]
  defaultShippingAddress: string
  defaultShippingPostcode: string
  defaultShippingState: string
}) {
  const router = useRouter()
  const cart = useWholesaleCart()
  const [address, setAddress] = useState(defaultShippingAddress)
  const [postcode, setPostcode] = useState(defaultShippingPostcode)
  const [state, setState] = useState(defaultShippingState)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const productMap = useMemo(() => {
    const m = new Map<string, WholesaleCatalogItem>()
    catalog.forEach((p) => m.set(p.id, p))
    return m
  }, [catalog])

  const lines = cart.lines
    .map((l) => {
      const p = productMap.get(l.productId)
      if (!p) return null
      return { ...l, product: p }
    })
    .filter((x): x is { productId: string; quantity: number; product: WholesaleCatalogItem } => x !== null)

  const subtotal = lines.reduce(
    (s, l) => s + l.product.wholesalePriceRm * l.quantity,
    0,
  )

  const canPlace =
    lines.length > 0 &&
    address.trim().length >= 5 &&
    postcode.trim().length >= 1 &&
    state.trim().length >= 1

  function submit() {
    setError(null)
    startTransition(async () => {
      const r = await placeWholesaleOrder({
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        shippingAddress: address,
        shippingPostcode: postcode,
        shippingState: state,
        agentNotes: notes,
      })
      if (!r.ok) {
        setError(r.error)
        return
      }
      cart.clear()
      router.push(`/agent/wholesale-orders/${r.data!.orderId}`)
    })
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#12372D]/15 p-12 text-center">
        <p className="font-body text-sm italic text-[#12372D]/55">
          Your cart is empty.
        </p>
        <Link
          href="/agent/wholesale-shop"
          className="mt-3 inline-block text-[12.5px] font-semibold text-[#B58A3B] hover:underline"
        >
          Back to shop →
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      {/* Items + shipping + notes */}
      <div className="flex flex-col gap-4">
        <section className="rounded-3xl border border-[#12372D]/10 bg-white p-5">
          <h2 className="font-heading text-[15px] font-semibold text-[#12372D]">
            Order items
          </h2>
          <ul className="mt-3 divide-y divide-[#12372D]/6">
            {lines.map((l) => (
              <li key={l.productId} className="flex items-center gap-3 py-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#EDF4E7]/40">
                  {l.product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.product.imageUrl}
                      alt={l.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-[#12372D]">
                    {l.product.name}
                  </p>
                  <p className="text-[11px] text-[#12372D]/55">
                    {l.quantity} × RM {l.product.wholesalePriceRm.toFixed(2)}
                  </p>
                </div>
                <span className="font-heading text-[13px] font-bold text-[#12372D]">
                  RM {(l.product.wholesalePriceRm * l.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-[#12372D]/10 bg-white p-5">
          <h2 className="font-heading text-[15px] font-semibold text-[#12372D]">
            Ship to
          </h2>
          <p className="mt-0.5 text-[11.5px] text-[#12372D]/55">
            Pre-filled from your profile. Edit if this order needs to go somewhere else.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
                Address *
              </span>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="rounded-lg border border-[#12372D]/15 bg-white px-3 py-2 text-[13px]"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
                  Postcode *
                </span>
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="rounded-lg border border-[#12372D]/15 bg-white px-3 py-2 text-[13px]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
                  State *
                </span>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="rounded-lg border border-[#12372D]/15 bg-white px-3 py-2 text-[13px]"
                >
                  <option value="">Select state…</option>
                  {MY_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#12372D]/10 bg-white p-5">
          <h2 className="font-heading text-[15px] font-semibold text-[#12372D]">
            Notes for admin (optional)
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. please pack each product separately, or deliver after 5pm"
            className="mt-2 w-full rounded-lg border border-[#12372D]/15 bg-white px-3 py-2 text-[13px]"
          />
        </section>
      </div>

      {/* Summary + place order */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <section className="flex flex-col gap-3 rounded-3xl border border-[#B58A3B]/40 bg-gradient-to-br from-[#12372D] to-[#12372D] p-5 text-white">
          <h2 className="font-heading text-[14px] font-semibold text-[#B58A3B]">
            Order summary
          </h2>
          <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
            <span className="text-[12px] text-white/65">
              Subtotal ({lines.length} item{lines.length === 1 ? '' : 's'})
            </span>
            <span className="font-heading text-[15px] font-bold">
              RM {subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex items-baseline justify-between pb-3 text-[12px] text-white/65">
            <span>Shipping</span>
            <span className="italic">Confirmed by admin</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-white/15 pt-3">
            <span className="font-semibold">Total today</span>
            <span className="font-heading text-[22px] font-bold text-[#B58A3B]">
              RM {subtotal.toFixed(2)}
            </span>
          </div>

          {error ? (
            <p className="rounded-lg bg-red-500/15 px-3 py-2 text-[11.5px] text-red-200">
              ⚠ {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={pending || !canPlace}
            onClick={submit}
            className="rounded-lg bg-[#B58A3B] py-2.5 text-[13px] font-bold text-[#12372D] hover:bg-[#B58A3B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Placing order…' : 'Place order'}
          </button>

          <p className="text-[11px] leading-relaxed text-white/60">
            By placing this order you agree to transfer payment to the clinic via
            bank transfer / TNG eWallet. Admin will confirm and ship once payment
            arrives. Stock deducts from the clinic on payment confirmation.
          </p>
        </section>
      </aside>
    </div>
  )
}
