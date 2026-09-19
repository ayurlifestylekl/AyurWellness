'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  MapPin,
  Package,
  Plus,
  Receipt,
  ShoppingBag,
  Trash2,
  User,
} from 'lucide-react'
import { submitMarketplaceOrder } from '@/lib/agent/marketplace-orders/actions'
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

interface FormItem {
  productId: string
  quantity: number
  unitPriceRm: number
}

const MY_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang',
  'Penang', 'Perak', 'Perlis', 'Sabah', 'Sarawak', 'Selangor',
  'Terengganu', 'Kuala Lumpur', 'Labuan', 'Putrajaya',
]

export default function AgentMarketplaceForm({ products }: { products: Product[] }) {
  const router = useRouter()
  const [channel, setChannel] = useState<ExternalChannel>('shopee')
  const [marketplaceRef, setMarketplaceRef] = useState('')

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerCity, setCustomerCity] = useState('')
  const [customerPostcode, setCustomerPostcode] = useState('')
  const [customerState, setCustomerState] = useState('')

  const [items, setItems] = useState<FormItem[]>([])
  const [productPicker, setProductPicker] = useState('')

  const [shipping, setShipping] = useState('0')
  const [notes, setNotes] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function addItem(productId: string) {
    if (!productId) return
    const p = products.find((x) => x.id === productId)
    if (!p) return
    setItems((arr) => {
      const existing = arr.findIndex((x) => x.productId === productId)
      if (existing >= 0) {
        return arr.map((it, i) =>
          i === existing ? { ...it, quantity: it.quantity + 1 } : it,
        )
      }
      return [...arr, { productId, quantity: 1, unitPriceRm: p.priceRm }]
    })
    setProductPicker('')
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

  const customerComplete = useMemo(
    () =>
      customerName.trim().length > 0 &&
      customerAddress.trim().length >= 5 &&
      customerPostcode.trim().length > 0 &&
      customerState.trim().length > 0,
    [customerName, customerAddress, customerPostcode, customerState],
  )

  const canSubmit = customerComplete && items.length > 0

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!canSubmit) {
      setError('Please complete customer details and add at least one product.')
      return
    }
    startTransition(async () => {
      const payload = {
        channel,
        marketplaceOrderRef: marketplaceRef || undefined,
        customerName,
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
        customerAddress,
        customerCity: customerCity || undefined,
        customerPostcode,
        customerState,
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
        notes: notes || undefined,
      }
      const r = await submitMarketplaceOrder(payload)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.push('/agent/marketplace-orders')
    })
  }

  return (
    <form
      onSubmit={submit}
      className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]"
    >
      <div className="flex flex-col gap-4">
        {/* Channel / Source */}
        <Card icon={ShoppingBag} title="Where did the sale come from?">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Channel *">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as ExternalChannel)}
                className={inputCls}
              >
                {(Object.entries(EXTERNAL_CHANNEL_LABEL) as [
                  ExternalChannel,
                  string,
                ][]).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Marketplace order ref">
              <input
                value={marketplaceRef}
                onChange={(e) => setMarketplaceRef(e.target.value)}
                placeholder="e.g. 250523ABC123"
                className={inputCls}
              />
            </Field>
          </div>
        </Card>

        {/* Customer */}
        <Card
          icon={User}
          title="Customer details"
          subtitle="The clinic needs these to ship the order."
          status={customerComplete ? 'complete' : 'incomplete'}
        >
          <Field label="Full name *">
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="As it should appear on the package"
              className={inputCls}
            />
          </Field>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Phone">
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+60 12-345 6789"
                className={inputCls}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                className={inputCls}
              />
            </Field>
          </div>
        </Card>

        {/* Shipping address */}
        <Card icon={MapPin} title="Shipping address">
          <Field label="Address line *">
            <textarea
              required
              rows={2}
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="No 5, Jalan Berhala, Brickfields"
              className={inputCls}
            />
          </Field>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="City">
              <input
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                placeholder="Kuala Lumpur"
                className={inputCls}
              />
            </Field>
            <Field label="Postcode *">
              <input
                required
                value={customerPostcode}
                onChange={(e) => setCustomerPostcode(e.target.value)}
                placeholder="50470"
                className={inputCls}
              />
            </Field>
            <Field label="State *">
              <select
                required
                value={customerState}
                onChange={(e) => setCustomerState(e.target.value)}
                className={inputCls}
              >
                <option value="">Select state…</option>
                {MY_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        {/* Items */}
        <Card
          icon={Package}
          title="What did they buy?"
          status={items.length > 0 ? 'complete' : 'incomplete'}
        >
          <div className="flex items-center gap-2">
            <select
              value={productPicker}
              onChange={(e) => addItem(e.target.value)}
              className={`${inputCls} flex-1`}
            >
              <option value="">Pick a product to add…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.sku ? `(${p.sku})` : ''} — RM {p.priceRm.toFixed(2)}
                </option>
              ))}
            </select>
            <span className="hidden text-[11px] text-[#12372D]/55 sm:block">
              {products.length} available
            </span>
          </div>

          {items.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-[#12372D]/15 p-6 text-center text-[12.5px] italic text-[#12372D]/55">
              No items yet — pick a product above to start.
            </div>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {items.map((it, i) => {
                const p = products.find((x) => x.id === it.productId)
                const lineTotal = it.unitPriceRm * it.quantity
                return (
                  <li
                    key={i}
                    className="rounded-xl border border-[#12372D]/8 bg-[#EDF4E7]/30 p-3"
                  >
                    {/* Row 1: name + remove */}
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-heading text-[13.5px] font-semibold leading-snug text-[#12372D]">
                          {p?.name ?? 'Unknown'}
                        </p>
                        {p?.sku ? (
                          <p className="mt-0.5 font-mono text-[10.5px] text-[#12372D]/55">
                            {p.sku}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="shrink-0 rounded-md p-1.5 text-red-600 hover:bg-red-50"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>

                    {/* Row 2: qty / price / line total (stable grid that wraps) */}
                    <div className="mt-2.5 grid grid-cols-[auto_auto_1fr] items-center gap-x-3 gap-y-2">
                      <label className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#12372D]/65">
                        Qty
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => setQty(i, Number(e.target.value))}
                          className="w-14 rounded-lg border border-[#12372D]/15 bg-white px-2 py-1 text-right text-[13px]"
                        />
                      </label>
                      <label className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#12372D]/65">
                        Price&nbsp;RM
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={it.unitPriceRm}
                          onChange={(e) => setPrice(i, Number(e.target.value))}
                          className="w-20 rounded-lg border border-[#12372D]/15 bg-white px-2 py-1 text-right text-[13px]"
                        />
                      </label>
                      <span className="text-right font-heading text-[14px] font-bold text-[#12372D]">
                        RM {lineTotal.toFixed(2)}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Notes only — payment is uploaded later in a batch */}
        <Card icon={Receipt} title="Notes for admin">
          <Field label="Anything special?">
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. customer wants delivery before Friday, fragile package, etc."
              className={inputCls}
            />
          </Field>
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-900">
            💡 You don&apos;t pay per order. After submitting, head to{' '}
            <strong>My Marketplace Orders</strong> — you&apos;ll see all unpaid
            orders, pay the lump sum to the clinic, and upload one receipt.
          </p>
        </Card>
      </div>

      {/* Sticky summary */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <section className="flex flex-col gap-3 rounded-3xl border border-[#B58A3B]/40 bg-gradient-to-br from-[#12372D] to-[#12372D] p-5 text-white">
          <h2 className="font-heading text-[14px] font-semibold text-[#B58A3B]">
            Order summary
          </h2>

          <div className="grid grid-cols-1 gap-2 text-[12px]">
            <SummaryRow ok={customerComplete} label="Customer + shipping" />
            <SummaryRow
              ok={items.length > 0}
              label={`${items.length} item${items.length === 1 ? '' : 's'}`}
            />
          </div>

          <div className="border-t border-white/15 pt-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/70">
              Shipping (RM)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[13px] text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
            />
          </div>

          <div className="flex items-baseline justify-between border-t border-white/15 pt-3 text-[12px] text-white/65">
            <span>Subtotal</span>
            <span className="font-heading text-[13px] font-semibold text-white">
              RM {subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-[12px] text-white/65">
            <span>Shipping</span>
            <span className="font-heading text-[13px] font-semibold text-white">
              RM {Number(shipping || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex items-baseline justify-between border-t border-white/15 pt-3">
            <span className="font-semibold">Total</span>
            <span className="font-heading text-[22px] font-bold text-[#B58A3B]">
              RM {total.toFixed(2)}
            </span>
          </div>

          {error ? (
            <p className="rounded-lg bg-red-500/15 px-3 py-2 text-[11.5px] text-red-200">
              ⚠ {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || !canSubmit}
            className="rounded-lg bg-[#B58A3B] py-2.5 text-[13px] font-bold text-[#12372D] hover:bg-[#B58A3B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Submitting…' : 'Submit for admin approval'}
          </button>

          <p className="text-[10.5px] leading-relaxed text-white/55">
            Once admin approves, a real order is created with the customer&apos;s
            shipping address and your commission is credited.
          </p>
        </section>
      </aside>
    </form>
  )
}

const inputCls =
  'w-full rounded-lg border border-[#12372D]/15 bg-white px-3 py-2 text-[13px] focus:border-[#149447] focus:outline-none'

function Card({
  icon: Icon,
  title,
  subtitle,
  status,
  children,
}: {
  icon: typeof User
  title: string
  subtitle?: string
  status?: 'complete' | 'incomplete'
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-[#12372D]/10 bg-white p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#149447]/8">
            <Icon className="h-4 w-4 text-[#149447]" strokeWidth={1.8} />
          </span>
          <div>
            <h3 className="font-heading text-[14px] font-semibold text-[#12372D]">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-0.5 text-[11.5px] text-[#12372D]/60">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {status === 'complete' ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
        ) : status === 'incomplete' ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={2} />
        ) : null}
      </header>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#12372D]/70">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function SummaryRow({
  ok,
  label,
  optional,
}: {
  ok: boolean
  label: string
  optional?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} />
      ) : (
        <Plus
          className={`h-3.5 w-3.5 ${optional ? 'text-white/30' : 'text-amber-300'}`}
          strokeWidth={2}
        />
      )}
      <span
        className={
          ok ? 'text-white/85' : optional ? 'text-white/45' : 'text-amber-200'
        }
      >
        {label}
        {optional && !ok ? ' (optional)' : ''}
      </span>
    </div>
  )
}
