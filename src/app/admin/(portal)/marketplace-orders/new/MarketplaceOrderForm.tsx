'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createMarketplaceOrder } from '@/lib/admin/marketplace-orders/actions'
import {
  EXTERNAL_CHANNEL_LABEL,
  type ExternalChannel,
} from '@/lib/admin/external-sales/queries'

interface Product {
  id: string
  name: string
  sku: string | null
  priceRm: number
  stockQty: number
}

interface Agent {
  id: string
  referralCode: string
  fullName: string
  commissionRate: number
}

interface FormItem {
  productId: string
  quantity: number
  unitPriceRm: number
}

export default function MarketplaceOrderForm({
  products,
  agents,
}: {
  products: Product[]
  agents: Agent[]
}) {
  const router = useRouter()
  const [channel, setChannel] = useState<ExternalChannel>('shopee')
  const [marketplaceRef, setMarketplaceRef] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [items, setItems] = useState<FormItem[]>([])
  const [shipping, setShipping] = useState('0')
  const [agentId, setAgentId] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function addItem(productId: string) {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    setItems((arr) => [
      ...arr,
      { productId, quantity: 1, unitPriceRm: p.priceRm },
    ])
  }
  function setQty(idx: number, q: number) {
    setItems((arr) =>
      arr.map((it, i) => (i === idx ? { ...it, quantity: Math.max(1, q) } : it)),
    )
  }
  function setPrice(idx: number, p: number) {
    setItems((arr) =>
      arr.map((it, i) => (i === idx ? { ...it, unitPriceRm: Math.max(0, p) } : it)),
    )
  }
  function removeItem(idx: number) {
    setItems((arr) => arr.filter((_, i) => i !== idx))
  }

  const subtotal = items.reduce((s, it) => s + it.unitPriceRm * it.quantity, 0)
  const total = subtotal + Number(shipping || 0)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (items.length === 0) {
      setError('Add at least one product.')
      return
    }
    startTransition(async () => {
      const payload = {
        channel,
        marketplaceOrderRef: marketplaceRef || undefined,
        customerName,
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
        items: items.map((it) => {
          const p = products.find((x) => x.id === it.productId)!
          return {
            product_id: it.productId,
            product_name: p.name,
            sku: p.sku,
            quantity: it.quantity,
            unit_price_rm: it.unitPriceRm,
          }
        }),
        shippingRm: Number(shipping || 0),
        referralAgentId: agentId || null,
        notes: notes || undefined,
      }
      const r = await createMarketplaceOrder(payload)
      if (!r.ok) {
        setError(r.error)
        return
      }
      const id = (r as { ok: true; data?: { id: string } }).data?.id
      if (id) router.push(`/admin/marketplace-orders/${id}`)
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <legend className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          Source
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Channel *
            </span>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as ExternalChannel)}
              className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            >
              {(
                Object.entries(EXTERNAL_CHANNEL_LABEL) as [ExternalChannel, string][]
              ).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Marketplace order ref
            </span>
            <input
              value={marketplaceRef}
              onChange={(e) => setMarketplaceRef(e.target.value)}
              placeholder="e.g. Shopee 2026100012345"
              className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <legend className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          Customer
        </legend>
        <input
          required
          placeholder="Full name *"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
        />
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            placeholder="Phone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
          />
          <input
            type="email"
            placeholder="Email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
          />
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <legend className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          Items *
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
              {p.name} {p.sku ? `(${p.sku})` : ''} — RM {p.priceRm.toFixed(2)} · stock {p.stockQty}
            </option>
          ))}
        </select>
        {items.length > 0 ? (
          <ul className="mt-2 divide-y divide-[#006B3C]/6 text-[13px]">
            {items.map((it, i) => {
              const p = products.find((x) => x.id === it.productId)
              return (
                <li key={i} className="flex items-center gap-2 py-2">
                  <span className="flex-1">
                    {p?.name ?? 'Unknown'}
                    {p?.sku ? (
                      <span className="ml-1 text-[11px] text-[#12372D]/55">{p.sku}</span>
                    ) : null}
                  </span>
                  <label className="flex items-center gap-1 text-[11px] text-[#12372D]/65">
                    Qty
                    <input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => setQty(i, Number(e.target.value))}
                      className="w-16 rounded border border-[#006B3C]/15 px-2 py-1 text-right text-[13px]"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-[#12372D]/65">
                    Price
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={it.unitPriceRm}
                      onChange={(e) => setPrice(i, Number(e.target.value))}
                      className="w-20 rounded border border-[#006B3C]/15 px-2 py-1 text-right text-[13px]"
                    />
                  </label>
                  <span className="w-24 text-right font-semibold">
                    RM {(it.unitPriceRm * it.quantity).toFixed(2)}
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
      </fieldset>

      <fieldset className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <legend className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          Totals + attribution
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Shipping (RM)
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
              className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
              Attribute to affiliate (optional)
            </span>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
            >
              <option value="">No attribution</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName} · {a.referralCode} · {a.commissionRate}%
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1 border-t border-[#006B3C]/6 pt-3 text-[12.5px]">
          <span className="text-[#12372D]/65">Subtotal</span>
          <span className="text-right">RM {subtotal.toFixed(2)}</span>
          <span className="text-[#12372D]/65">Shipping</span>
          <span className="text-right">RM {Number(shipping || 0).toFixed(2)}</span>
          <span className="font-semibold text-[#006B3C]">Total</span>
          <span className="text-right font-semibold text-[#006B3C]">
            RM {total.toFixed(2)}
          </span>
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <legend className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          Notes
        </legend>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Anything the approver should know (delivery address, special instructions, etc.)"
          className="mt-2 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 text-[13px]"
        />
      </fieldset>

      {error ? <p className="text-[12px] text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={pending || !customerName || items.length === 0}
        className="rounded-lg bg-[#006B3C] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#006B3C] disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Submit for approval'}
      </button>
    </form>
  )
}
