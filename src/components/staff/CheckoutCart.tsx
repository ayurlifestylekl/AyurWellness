'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Search, Trash2 } from 'lucide-react'
import type { Bill, PackageOption, ProductOption } from '@/lib/counter/queries'
import { addBillItem, deleteBill, payBill, removeBillItem, updateBill, updateBillItem } from '@/lib/counter/actions'
import { PAYMENT_METHODS, billNoText, billTotals, cashChange, parseRm, rm, type PaymentMethod } from '@/lib/counter/rules'
import { durationText, groupByCategory, matchServices, priceText, type ServiceOption } from '@/lib/staff/services'

type Tab = 'service' | 'product' | 'package'

const field = 'rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[13.5px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40'

/**
 * The counter cart: pick services, products and package sessions on the left,
 * adjust the bill on the right, then take payment. Every change is saved on
 * the server straight away, so the bill survives a refresh or a second device.
 */
export default function CheckoutCart({
  bill,
  services,
  products,
  packages,
  patientHref,
}: {
  bill: Bill
  services: ServiceOption[]
  products: ProductOption[]
  packages: PackageOption[]
  patientHref: string | null
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('service')
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [received, setReceived] = useState('')
  const [discount, setDiscount] = useState(bill.discountRm ? bill.discountRm.toFixed(2) : '')

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => {
    setError(null)
    start(async () => {
      const res = await fn()
      if (!res.ok) { setError(res.error ?? 'Something went wrong.'); return }
      after?.()
      router.refresh()
    })
  }

  const categories = useMemo(() => groupByCategory(services), [services])
  const activeCat = cat ?? categories[0]?.id ?? null
  const shownServices = query.trim() ? matchServices(services, query) : categories.find((c) => c.id === activeCat)?.services ?? []
  const shownProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) : products
  }, [products, query])

  const totals = billTotals(bill.items, bill.discountRm)
  const receivedRm = received ? parseRm(received) : null
  const change = method === 'cash' && receivedRm != null ? cashChange(totals.total, receivedRm) : null
  const needsMethod = totals.total > 0
  const canPay =
    bill.items.length > 0 && (!needsMethod || (method !== null && (method !== 'cash' || (receivedRm != null && change != null))))

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'service', label: 'Services' },
    { key: 'product', label: 'Products' },
    { key: 'package', label: 'Packages', count: packages.length },
  ]

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/console/checkout" className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-dark/50 hover:text-primary">← Checkout</Link>
          <h1 className="mt-2 font-heading text-[22px] font-extrabold text-primary">
            {bill.customerName} <span className="ml-2 font-body text-[14px] font-normal text-dark/50">{billNoText(bill.billNo)}</span>
          </h1>
          <p className="font-body text-[13px] text-dark/55">
            {bill.customerPhone ?? 'No phone'}
            {patientHref && <> · <Link href={patientHref} className="text-accent underline">Patient profile</Link></>}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => { if (confirm('Delete this unpaid bill?')) run(() => deleteBill(bill.id), () => router.push('/console/checkout')) }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 font-heading text-[10px] font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" /> Delete bill
        </button>
      </div>

      {error && <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 font-body text-[13px] text-red-700" role="alert">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Catalogue */}
        <section className="rounded-2xl border border-accent/20 bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => { setTab(t.key); setQuery('') }}
                className={`rounded-full px-4 py-1.5 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] ${tab === t.key ? 'bg-accent text-white' : 'border border-accent/25 text-dark/65 hover:bg-cream'}`}
              >
                {t.label}{t.count ? ` · ${t.count}` : ''}
              </button>
            ))}
            {tab !== 'package' && (
              <label className="ml-auto flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-accent/20 px-2.5 py-1.5 sm:flex-none">
                <Search className="h-4 w-4 text-dark/40" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tab === 'service' ? 'Search therapy…' : 'Search product…'} className="w-full bg-transparent font-body text-[13px] focus:outline-none" />
              </label>
            )}
          </div>

          {tab === 'service' && !query.trim() && categories.length > 1 && (
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
              {categories.map((c) => (
                <button key={c.id} type="button" onClick={() => setCat(c.id)} className={`flex-none whitespace-nowrap rounded-full border px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-[0.1em] ${c.id === activeCat ? 'border-primary bg-primary text-white' : 'border-accent/25 text-dark/65 hover:bg-cream'}`}>
                  {c.title}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 grid max-h-[60vh] gap-2 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
            {tab === 'service' &&
              shownServices.map((s) => (
                <Tile key={s.id} disabled={pending} onClick={() => run(() => addBillItem(bill.id, { kind: 'service', treatmentId: s.id }))} title={s.title} right={priceText(s) ?? 'Set price'} sub={durationText(s.durationMins)} />
              ))}
            {tab === 'product' &&
              shownProducts.map((p) => (
                <Tile
                  key={p.id}
                  disabled={pending || (!p.allowBackorder && p.stock <= 0)}
                  onClick={() => run(() => addBillItem(bill.id, { kind: 'product', productId: p.id }))}
                  title={p.name}
                  right={rm(p.priceRm)}
                  sub={!p.allowBackorder && p.stock <= 0 ? 'Out of stock' : `${p.stock} in stock`}
                />
              ))}
            {tab === 'package' &&
              packages.map((p) => (
                <Tile
                  key={p.id}
                  disabled={pending}
                  onClick={() => run(() => addBillItem(bill.id, { kind: 'package', packagePurchaseId: p.id }))}
                  title={p.name}
                  right="Redeem"
                  sub={`${p.sessionCount - p.sessionsUsed} of ${p.sessionCount} left${p.expiresAt ? ` · until ${new Date(p.expiresAt).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric' })}` : ''}`}
                />
              ))}
            {((tab === 'service' && !shownServices.length) || (tab === 'product' && !shownProducts.length) || (tab === 'package' && !packages.length)) && (
              <p className="col-span-full py-6 text-center font-body text-[13px] italic text-dark/45">
                {tab === 'package' ? (bill.customerPhone ? 'No active packages on this phone number.' : 'Add a phone number to the patient to find their packages.') : 'Nothing matches.'}
              </p>
            )}
          </div>
        </section>

        {/* Bill */}
        <section className="rounded-2xl border border-accent/20 bg-white p-4 lg:sticky lg:top-20 lg:self-start">
          <h2 className="font-heading text-[15px] font-bold text-primary">Bill</h2>
          {bill.notes && <p className="mt-1 rounded-lg bg-cream/70 px-3 py-1.5 font-body text-[12.5px] text-dark/70">{bill.notes}</p>}
          {bill.items.length === 0 ? (
            <p className="mt-3 font-body text-[13px] italic text-dark/45">Nothing added yet. Tap a service, product or package.</p>
          ) : (
            <ul className="mt-3 divide-y divide-accent/10">
              {bill.items.map((i) => (
                <li key={i.id} className="py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-body text-[13.5px] font-semibold text-dark">{i.description}</span>
                    <button type="button" aria-label={`Remove ${i.description}`} disabled={pending} onClick={() => run(() => removeBillItem(i.id))} className="rounded p-1 text-dark/35 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex items-center rounded-lg border border-accent/25">
                      <button type="button" aria-label="One fewer" disabled={pending || i.quantity <= 1} onClick={() => run(() => updateBillItem(i.id, { quantity: i.quantity - 1 }))} className="p-1.5 text-dark/60 disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-7 text-center font-body text-[13px] tabular-nums">{i.quantity}</span>
                      <button type="button" aria-label="One more" disabled={pending} onClick={() => run(() => updateBillItem(i.id, { quantity: i.quantity + 1 }))} className="p-1.5 text-dark/60"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    {i.kind === 'package' ? (
                      <span className="font-body text-[12px] text-dark/55">Package session — no charge</span>
                    ) : (
                      <PriceInput key={`${i.id}:${i.unitPriceRm}`} value={i.unitPriceRm} disabled={pending} onSave={(v) => run(() => updateBillItem(i.id, { unitPriceRm: v }))} />
                    )}
                    <span className="ml-auto font-body text-[13.5px] font-semibold tabular-nums">{rm(i.quantity * i.unitPriceRm)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-3 space-y-1 border-t border-accent/20 pt-3 font-body text-[13.5px]">
            <div className="flex justify-between"><dt className="text-dark/60">Subtotal</dt><dd className="tabular-nums">{rm(totals.subtotal)}</dd></div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-dark/60">Discount (RM)</dt>
              <dd>
                <input
                  value={discount}
                  inputMode="decimal"
                  onChange={(e) => setDiscount(e.target.value)}
                  onBlur={() => {
                    const v = discount.trim() ? parseRm(discount) : 0
                    if (v == null) { setError('Enter the discount as an amount, e.g. 10 or 12.50.'); return }
                    if (v !== bill.discountRm) run(() => updateBill(bill.id, { discountRm: v }))
                  }}
                  placeholder="0.00"
                  aria-label="Discount in RM"
                  className={`${field} w-28 py-1 text-right tabular-nums`}
                />
              </dd>
            </div>
            <div className="flex justify-between pt-1 font-heading text-[18px] font-extrabold text-primary"><dt>Total</dt><dd className="tabular-nums">{rm(totals.total)}</dd></div>
          </dl>

          <div className="mt-4 border-t border-accent/20 pt-3">
            {needsMethod ? (
              <>
                <p className="mb-2 font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-dark/55">Payment method</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PAYMENT_METHODS.map((m) => (
                    <button key={m.value} type="button" onClick={() => setMethod(m.value)} aria-pressed={method === m.value} className={`rounded-lg border px-2 py-2 font-body text-[12.5px] ${method === m.value ? 'border-accent bg-accent text-white' : 'border-accent/25 hover:bg-cream'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
                {method === 'cash' && (
                  <div className="mt-3 flex items-center gap-3">
                    <label className="flex-1">
                      <span className="mb-1 block font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-dark/55">Cash received (RM)</span>
                      <input value={received} inputMode="decimal" onChange={(e) => setReceived(e.target.value)} placeholder={totals.total.toFixed(2)} className={`${field} w-full text-right tabular-nums`} />
                    </label>
                    <div className="text-right font-body text-[13px]">
                      <div className="text-dark/55">Change</div>
                      <div className="font-semibold tabular-nums">{change != null ? rm(change) : '—'}</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              bill.items.length > 0 && <p className="font-body text-[12.5px] text-dark/60">Nothing to pay — package sessions only.</p>
            )}
            <button
              type="button"
              disabled={pending || !canPay}
              onClick={() => run(() => payBill(bill.id, { method: needsMethod ? method : null, receivedRm: method === 'cash' ? receivedRm : null }), () => router.push(`/console/checkout/${bill.id}/receipt`))}
              className="mt-3 w-full rounded-xl bg-primary px-5 py-3 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? 'Working…' : needsMethod ? `Take payment · ${rm(totals.total)}` : 'Complete'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function Tile({ title, sub, right, onClick, disabled }: { title: string; sub: string; right: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="flex items-start justify-between gap-2 rounded-xl border border-accent/15 bg-cream/30 px-3 py-2.5 text-left hover:border-accent hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50">
      <span className="min-w-0">
        <span className="block font-body text-[13px] font-semibold leading-snug text-dark">{title}</span>
        <span className="block font-body text-[11.5px] text-dark/50">{sub}</span>
      </span>
      <span className="flex-none font-body text-[12px] font-semibold text-primary">{right}</span>
    </button>
  )
}

/** Unit price, editable for therapies priced "on consultation" or a special rate. Saves on blur / Enter. */
function PriceInput({ value, onSave, disabled }: { value: number; onSave: (v: number) => void; disabled?: boolean }) {
  const [text, setText] = useState(value.toFixed(2))
  const [bad, setBad] = useState(false)
  const commit = () => {
    const v = parseRm(text)
    if (v == null) { setBad(true); return }
    setBad(false)
    if (v !== value) onSave(v)
  }
  return (
    <label className="flex items-center gap-1 font-body text-[12px] text-dark/55">
      RM
      <input
        value={text}
        disabled={disabled}
        inputMode="decimal"
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        aria-label="Unit price in RM"
        aria-invalid={bad}
        className={`w-20 rounded-md border px-2 py-1 text-right text-[13px] tabular-nums text-dark focus:outline-none ${bad ? 'border-red-400' : 'border-accent/25 focus:border-accent'}`}
      />
    </label>
  )
}
