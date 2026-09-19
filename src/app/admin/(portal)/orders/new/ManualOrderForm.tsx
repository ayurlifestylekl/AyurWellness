'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createManualOrder } from '@/lib/admin/orders/actions'

interface Product {
  id: string
  name: string
  sku: string | null
  price_rm: number
}

type Channel = 'manual' | 'walk_in' | 'phone'
type PaymentMethod = 'cod' | 'bank_transfer' | 'fpx' | 'cash' | 'card'

export default function ManualOrderForm({ products }: { products: Product[] }) {
  const router = useRouter()
  const [walkInName, setWalkInName] = useState('')
  const [walkInPhone, setWalkInPhone] = useState('')
  const [walkInEmail, setWalkInEmail] = useState('')
  const [channel, setChannel] = useState<Channel>('walk_in')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addItem(productId: string) {
    setItems((arr) => [...arr, { productId, quantity: 1 }])
  }
  function setQty(i: number, q: number) {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, quantity: Math.max(1, q) } : it)))
  }
  function removeItem(i: number) {
    setItems((arr) => arr.filter((_, idx) => idx !== i))
  }

  const total = items.reduce((s, it) => {
    const p = products.find((p) => p.id === it.productId)
    return s + (p ? Number(p.price_rm) * it.quantity : 0)
  }, 0)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) {
      setError('Add at least one item.')
      return
    }
    setPending(true)
    setError(null)
    const r = await createManualOrder({
      customerId: null,
      walkInName,
      walkInPhone: walkInPhone || undefined,
      walkInEmail: walkInEmail || undefined,
      items: items.map((it) => {
        const p = products.find((p) => p.id === it.productId)!
        return {
          productId: it.productId,
          quantity: it.quantity,
          unitPriceRm: Number(p.price_rm),
        }
      }),
      paymentMethod,
      channel,
    })
    setPending(false)
    if (!r.ok) {
      setError(r.error)
      return
    }
    const orderId = (r as { ok: true; data?: { orderId: string } }).data?.orderId
    if (orderId) router.push(`/admin/orders/${orderId}`)
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
      <fieldset className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <legend className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          Customer (walk-in)
        </legend>
        <input
          required
          placeholder="Full name"
          value={walkInName}
          onChange={(e) => setWalkInName(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
        />
        <input
          placeholder="Phone (optional)"
          value={walkInPhone}
          onChange={(e) => setWalkInPhone(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={walkInEmail}
          onChange={(e) => setWalkInEmail(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
        />
      </fieldset>

      <fieldset className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <legend className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          Items
        </legend>
        <select
          onChange={(e) => {
            if (e.target.value) {
              addItem(e.target.value)
              e.target.value = ''
            }
          }}
          className="mt-2 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
        >
          <option value="">Add product…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.sku ? `(${p.sku})` : ''} — RM {Number(p.price_rm).toFixed(2)}
            </option>
          ))}
        </select>
        {items.length > 0 ? (
          <ul className="mt-2 divide-y divide-[#006B3C]/6">
            {items.map((it, i) => {
              const p = products.find((p) => p.id === it.productId)
              return (
                <li key={i} className="flex items-center gap-2 py-2 text-[13px]">
                  <span className="flex-1">{p?.name ?? 'Unknown product'}</span>
                  <input
                    type="number"
                    min="1"
                    value={it.quantity}
                    onChange={(e) => setQty(i, Number(e.target.value))}
                    className="w-16 rounded border border-[#006B3C]/15 px-2 py-1 text-right"
                  />
                  <span className="w-24 text-right font-semibold">
                    RM {(Number(p?.price_rm ?? 0) * it.quantity).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
        <p className="mt-2 border-t border-[#006B3C]/6 pt-2 text-right font-semibold text-[#006B3C]">
          Total: RM {total.toFixed(2)}
        </p>
      </fieldset>

      <fieldset className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <legend className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          Channel + payment
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as Channel)}
            className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
          >
            <option value="walk_in">Walk-in</option>
            <option value="phone">Phone</option>
            <option value="manual">Manual (other)</option>
          </select>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
          >
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="cod">COD</option>
            <option value="fpx">FPX</option>
            <option value="card">Card</option>
          </select>
        </div>
      </fieldset>

      {error ? <p className="text-[12px] text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={pending || items.length === 0 || !walkInName}
        className="rounded-lg bg-[#006B3C] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#006B3C] disabled:opacity-50"
      >
        Create order
      </button>
    </form>
  )
}
