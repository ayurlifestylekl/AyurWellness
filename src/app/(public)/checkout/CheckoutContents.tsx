'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ShoppingBag, AlertCircle } from 'lucide-react'
import { useCart } from '@/lib/cart/CartProvider'
import { createProductOrder, estimateShipping } from '@/lib/checkout/actions'
import { countries } from '@/data/countries'
import type { Product } from '@/types/content'

interface CheckoutUser {
  id: string
  fullName: string | null
  email: string | null
  phone: string | null
  role: string
}

interface CheckoutContentsProps {
  products: Product[]
  user: CheckoutUser | null
}

export default function CheckoutContents({ products, user }: CheckoutContentsProps) {
  const { lines, removeItem } = useCart()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const productMap = useMemo(() => {
    const map = new Map<string, Product>()
    for (const p of products) map.set(p.id, p)
    return map
  }, [products])

  const items = useMemo(() => {
    return lines
      .map((line) => {
        const p = productMap.get(line.productId)
        if (!p) return null
        return { ...line, product: p }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [lines, productMap])

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    postcode: '',
    state: '',
    country: 'MY',
  })

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: user.fullName ?? f.name,
        email: user.email ?? f.email,
        phone: user.phone ?? f.phone,
      }))
    }
  }, [user])

  const subtotal = useMemo(
    () => items.reduce((sum, { product, quantity }) => sum + product.priceRm * quantity, 0),
    [items],
  )
  const [shipping, setShipping] = useState(10)
  const [zoneName, setZoneName] = useState('Malaysia')
  const [shippingError, setShippingError] = useState<string | null>(null)
  const total = subtotal + shipping

  useEffect(() => {
    if (items.length === 0) return
    setShippingError(null)
    estimateShipping({
      countryCode: form.country,
      lines: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
    }).then((result) => {
      if (result.ok && result.data) {
        setShipping(result.data.rateRm)
        setZoneName(result.data.zoneName)
      } else if ('error' in result) {
        setShippingError(result.error ?? 'Could not calculate shipping.')
      }
    })
  }, [form.country, items])

  const [idempotencyKey] = useState(() => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  })

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (items.length === 0) {
      setError('Your cart is empty.')
      return
    }
    startTransition(async () => {
      const result = await createProductOrder({
        shipping: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          postcode: form.postcode,
          state: form.state,
          country: form.country,
        },
        lines: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        guestCheckout: !user,
        idempotencyKey,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (!result.data) {
        setError('Checkout failed.')
        return
      }
      // Redirect to Billplz hosted payment page
      window.location.href = result.data.billUrl
    })
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-16 text-center sm:pt-24">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#12372D]/[0.06]">
          <ShoppingBag className="h-6 w-6 text-[#149447]" strokeWidth={1.5} />
        </span>
        <h1 className="mt-5 font-heading text-[28px] font-bold text-[#12372D]">
          Your bag is empty.
        </h1>
        <p className="mx-auto mt-2 max-w-md font-body text-[14px] text-[#12372D]/65">
          Add some products before checking out.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#149447] px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-white"
        >
          Shop products
        </Link>
      </div>
    )
  }

  return (
    <section className="relative min-h-screen bg-cream">
      <div className="relative mx-auto max-w-6xl px-6 py-12 sm:px-8 md:py-16 lg:px-12">
        <Link
          href="/cart"
          className="group inline-flex items-center gap-1.5 font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary/55 transition-colors duration-300 hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to cart
        </Link>

        <h1 className="mt-6 font-heading text-[32px] font-bold text-[#12372D] sm:text-[40px]">
          Checkout
        </h1>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {user && (
              <div className="rounded-2xl border border-[#12372D]/10 bg-white p-4">
                <p className="font-heading text-[12px] font-semibold uppercase tracking-wider text-[#12372D]">
                  Member checkout
                </p>
                <p className="mt-1 text-[13px] text-[#12372D]/65">
                  Signed in as <strong>{user.email}</strong>. Member pricing will be applied where available.
                </p>
              </div>
            )}

            <fieldset className="rounded-2xl border border-[#12372D]/10 bg-white p-5">
              <legend className="px-2 font-heading text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
                Shipping details
              </legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full name *">
                  <input required value={form.name} onChange={(e) => update('name', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Email *">
                  <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Phone *">
                  <input required value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Address line 1 *">
                  <input required value={form.line1} onChange={(e) => update('line1', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Address line 2">
                  <input value={form.line2} onChange={(e) => update('line2', e.target.value)} className={inputCls} />
                </Field>
                <Field label="City *">
                  <input required value={form.city} onChange={(e) => update('city', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Postcode *">
                  <input required value={form.postcode} onChange={(e) => update('postcode', e.target.value)} className={inputCls} />
                </Field>
                <Field label="State *">
                  <input required value={form.state} onChange={(e) => update('state', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Country *">
                  <select
                    required
                    value={form.country}
                    onChange={(e) => update('country', e.target.value)}
                    className={inputCls}
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </fieldset>

            {(error || shippingError) && (
              <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {error ?? shippingError}
              </div>
            )}

            <button
              type="submit"
              disabled={pending || !!shippingError}
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#12372D] px-8 font-heading text-[13px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#12372D]/90 disabled:opacity-60"
            >
              {pending ? 'Processing…' : `Pay RM ${total.toFixed(2)}`}
            </button>
          </form>

          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-[#12372D]/10 bg-white p-5">
              <h2 className="font-heading text-[16px] font-bold text-[#12372D]">Order summary</h2>
              <ul className="mt-4 flex flex-col gap-4">
                {items.map(({ product, quantity }) => (
                  <li key={product.id} className="flex gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#12372D]/[0.06]">
                      {product.image ? (
                        <Image src={product.image} alt={product.name} fill className="object-cover" sizes="64px" />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <p className="font-heading text-[13px] font-semibold text-[#12372D]">{product.name}</p>
                      <p className="text-[12px] text-[#12372D]/55">Qty {quantity}</p>
                      <p className="font-heading text-[13px] font-bold text-[#12372D]">
                        RM {(product.priceRm * quantity).toFixed(2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(product.id)}
                      className="text-[11px] text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-5 space-y-2 border-t border-[#12372D]/10 pt-4 text-[13px]">
                <div className="flex justify-between text-[#12372D]/70">
                  <span>Subtotal</span>
                  <span>RM {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#12372D]/70">
                  <span>Shipping — {zoneName}</span>
                  <span>{shipping === 0 ? 'Free' : `RM ${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-heading text-[16px] font-bold text-[#12372D]">
                  <span>Total</span>
                  <span>RM {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

const inputCls =
  'w-full rounded-lg border border-[#12372D]/15 bg-white px-3 py-2 text-[13px] focus:border-[#12372D] focus:outline-none'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">{label}</span>
      {children}
    </label>
  )
}
