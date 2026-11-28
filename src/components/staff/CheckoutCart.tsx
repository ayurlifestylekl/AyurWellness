'use client'

import { useMemo, useState, useTransition } from 'react'
import { useStaffBase } from '@/lib/staff/use-staff-base'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Search, Trash2 } from 'lucide-react'
import type { Bill, PackageOption, ProductOption } from '@/lib/counter/queries'
import type { CounterItem } from '@/lib/counter/catalog'
import PrescriptionPanel, { type PrescribedLine } from './PrescriptionPanel'
import { addBillItem, deleteBill, payBill, removeBillItem, setBillItemRemark, updateBill, updateBillItem } from '@/lib/counter/actions'
import { BALANCE_LABEL, ITEM_PREFIX, PAYMENT_METHODS, validityText, SPENDABLE_KINDS, amountDue, billNoText, billTotals, cashChange, parseRm, rm, type BalanceKind, type PaymentMethod, type SpendableKind } from '@/lib/counter/rules'
import { durationText, groupByCategory, matchServices, priceText, type ServiceOption } from '@/lib/staff/services'

type Tab = 'service' | 'product' | 'package' | 'deposit'

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
  packagesForSale,
  quickAdds = [],
  prescription = null,
  patientHref,
  balances,
  manageHref,
}: {
  bill: Bill
  services: ServiceOption[]
  products: ProductOption[]
  packages: PackageOption[]
  /** Packages the centre sells (Billing items). */
  packagesForSale: CounterItem[]
  /** Where staff add, hide and remove billing items. */
  manageHref: string
  /** One-tap add-ons on the bill: VIP Private Room, Hair Wash. */
  quickAdds?: CounterItem[]
  /** The doctor's latest prescription for this patient. */
  prescription?: { sheetDate: string; doctor: string | null; lines: PrescribedLine[] } | null
  patientHref: string | null
  /** The saved patient's balances; null for a walk-in (no balances or pay-later). */
  balances: Record<BalanceKind, number> | null
}) {
  const router = useRouter()
  const base = useStaffBase()
  const [tab, setTab] = useState<Tab>('service')
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [received, setReceived] = useState('')
  const [discount, setDiscount] = useState(bill.discountRm ? bill.discountRm.toFixed(2) : '')
  const [useText, setUseText] = useState<Record<SpendableKind, string>>({ deposit: '', credit: '', gift_card: '' })
  const [payLater, setPayLater] = useState(false)
  const [depositText, setDepositText] = useState('')

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
  const uses = SPENDABLE_KINDS.map((k) => ({ kind: k, amount: useText[k].trim() ? parseRm(useText[k]) ?? NaN : 0 })).filter((u) => u.amount !== 0)
  const usesValid = uses.every((u) => Number.isFinite(u.amount) && u.amount > 0)
  const due = balances ? amountDue(totals.total, usesValid ? uses : [], balances) : totals.total
  const receivedRm = received ? parseRm(received) : null
  const change = method === 'cash' && receivedRm != null && due != null ? cashChange(due, receivedRm) : null
  const needsMethod = due != null && due > 0 && !payLater
  const canPay =
    bill.items.length > 0 &&
    usesValid &&
    due != null &&
    (!needsMethod || (method !== null && (method !== 'cash' || (receivedRm != null && change != null))))
  const spendable = balances ? SPENDABLE_KINDS.filter((k) => balances[k] > 0) : []

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'service', label: 'Services' },
    { key: 'product', label: 'Products' },
    { key: 'package', label: 'Packages', count: packages.length || undefined },
    { key: 'deposit', label: 'Deposit' },
  ]
  const addService = (id: string) =>
    run(() => addBillItem(bill.id, id.startsWith(ITEM_PREFIX) ? { kind: 'item', itemId: id.slice(ITEM_PREFIX.length) } : { kind: 'service', treatmentId: id }))
  const addProduct = (id: string) =>
    run(() => addBillItem(bill.id, id.startsWith(ITEM_PREFIX) ? { kind: 'item', itemId: id.slice(ITEM_PREFIX.length) } : { kind: 'product', productId: id }))
  const depositRm = depositText.trim() ? parseRm(depositText) : null

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`${base}/checkout`} className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-dark/50 hover:text-primary">← Checkout</Link>
          <h1 className="mt-2 font-heading text-[22px] font-extrabold text-primary">
            {bill.customerName} <span className="ml-2 font-body text-[14px] font-normal text-dark/50">{billNoText(bill.billNo)}</span>
          </h1>
          <p className="font-body text-[13px] text-dark/55">
            <Link href={manageHref} className="mr-2 text-accent underline">Manage billing items</Link>·{' '}
            {bill.customerPhone ?? 'No phone'}
            {patientHref && <> · <Link href={patientHref} className="text-accent underline">Patient profile</Link></>}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => { if (confirm('Delete this unpaid bill?')) run(() => deleteBill(bill.id), () => router.push(`${base}/checkout`)) }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 font-heading text-[10px] font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" /> Delete bill
        </button>
      </div>

      {error && <p className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 font-body text-[13px] text-red-700" role="alert">{error}</p>}

      {prescription && (
        <PrescriptionPanel lines={prescription.lines} sheetDate={prescription.sheetDate} doctor={prescription.doctor} disabled={pending} onAdd={addProduct} />
      )}

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
            {(tab === 'service' || tab === 'product') && (
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
                <Tile key={s.id} disabled={pending} onClick={() => addService(s.id)} title={s.title} right={priceText(s) ?? 'Set price'} sub={s.durationMins ? durationText(s.durationMins) : ''} />
              ))}
            {tab === 'product' &&
              shownProducts.map((p) => (
                <Tile
                  key={p.id}
                  disabled={pending || (!p.untracked && !p.allowBackorder && p.stock <= 0)}
                  onClick={() => addProduct(p.id)}
                  title={p.name}
                  right={rm(p.priceRm)}
                  sub={p.untracked ? p.category : !p.allowBackorder && p.stock <= 0 ? 'Out of stock' : `${p.stock} in stock`}
                />
              ))}
            {tab === 'package' && (
              <p className="col-span-full font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-dark/55">Sell a package</p>
            )}
            {tab === 'package' && !packagesForSale.length && (
              <p className="col-span-full font-body text-[12.5px] italic text-dark/45">No packages yet. Add one under <Link href={manageHref} className="text-accent underline">Manage billing items</Link>.</p>
            )}
            {tab === 'package' &&
              packagesForSale.map((p) => (
                <Tile
                  key={p.id}
                  disabled={pending}
                  onClick={() => run(() => addBillItem(bill.id, { kind: 'item', itemId: p.id }))}
                  title={p.name}
                  right={rm(p.priceRm)}
                  sub={`${p.sessions} sessions · ${validityText(p)}`}
                />
              ))}
            {tab === 'package' && (
              <p className="col-span-full mt-2 font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-dark/55">Use a session from the customer’s package</p>
            )}
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
            {tab === 'deposit' && (
              <div className="col-span-full rounded-xl border border-accent/15 bg-cream/30 p-4">
                {balances ? (
                  <>
                    <p className="font-body text-[13px] text-dark/70">
                      Money the customer pays in advance. When the bill is paid it is added to their deposit, and can be used on a later bill. Current deposit: <strong>{rm(balances.deposit)}</strong>.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label className="font-body text-[13px] text-dark/60" htmlFor="deposit-amount">Amount (RM)</label>
                      <input id="deposit-amount" value={depositText} inputMode="decimal" placeholder="0.00" onChange={(e) => setDepositText(e.target.value)} className={`${field} w-32 text-right tabular-nums`} />
                      <button
                        type="button"
                        disabled={pending || depositRm == null || depositRm <= 0}
                        onClick={() => run(() => addBillItem(bill.id, { kind: 'deposit', amountRm: depositRm ?? 0 }), () => setDepositText(''))}
                        className="rounded-lg bg-accent px-4 py-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                      >
                        Add deposit
                      </button>
                    </div>
                    <p className="mt-2 font-body text-[12px] text-dark/50">Already paid online (e.g. a HitPay link)? Add it here and choose “Online (HitPay)” as the payment method.</p>
                  </>
                ) : (
                  <p className="font-body text-[13px] italic text-dark/55">A deposit needs a saved patient. Open the patient’s profile, save their details, and start the bill from there.</p>
                )}
              </div>
            )}
            {((tab === 'service' && !shownServices.length) || (tab === 'product' && !shownProducts.length) || (tab === 'package' && !packages.length)) && (
              <p className="col-span-full py-6 text-center font-body text-[13px] italic text-dark/45">
                {tab === 'package' ? (bill.customerPhone ? 'No packages to use on this phone number.' : 'Add a phone number to the patient to find their packages.') : 'Nothing matches.'}
              </p>
            )}
          </div>
        </section>

        {/* Bill */}
        <section className="rounded-2xl border border-accent/20 bg-white p-4 lg:sticky lg:top-20 lg:self-start">
          <h2 className="font-heading text-[15px] font-bold text-primary">Bill</h2>
          {quickAdds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {quickAdds.map((q) => {
                const added = bill.items.some((i) => i.counterItemId === q.id)
                return (
                  <button
                    key={q.id}
                    type="button"
                    disabled={pending || added}
                    onClick={() => run(() => addBillItem(bill.id, { kind: 'item', itemId: q.id }))}
                    className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-cream/50 px-3 py-1 font-heading text-[10.5px] font-bold uppercase tracking-[0.08em] text-primary hover:bg-cream disabled:opacity-50"
                  >
                    {added ? '✓' : '+'} {q.name.replace(/\s*\(add-on\)$/i, '')} · {rm(q.priceRm)}
                  </button>
                )
              })}
            </div>
          )}
          {bill.notes && <p className="mt-1 rounded-lg bg-cream/70 px-3 py-1.5 font-body text-[12.5px] text-dark/70">{bill.notes}</p>}
          {bill.items.length === 0 ? (
            <p className="mt-3 font-body text-[13px] italic text-dark/45">Nothing added yet. Tap a service, product, package or deposit.</p>
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
                    {i.kind !== 'deposit' && (
                    <div className="flex items-center rounded-lg border border-accent/25">
                      <button type="button" aria-label="One fewer" disabled={pending || i.quantity <= 1} onClick={() => run(() => updateBillItem(i.id, { quantity: i.quantity - 1 }))} className="p-1.5 text-dark/60 disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-7 text-center font-body text-[13px] tabular-nums">{i.quantity}</span>
                      <button type="button" aria-label="One more" disabled={pending} onClick={() => run(() => updateBillItem(i.id, { quantity: i.quantity + 1 }))} className="p-1.5 text-dark/60"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    )}
                    {i.kind === 'package' ? (
                      <span className="font-body text-[12px] text-dark/55">Package session — no charge</span>
                    ) : (
                      <PriceInput key={`${i.id}:${i.unitPriceRm}`} value={i.unitPriceRm} disabled={pending} onSave={(v) => run(() => updateBillItem(i.id, { unitPriceRm: v }))} />
                    )}
                    <span className="ml-auto font-body text-[13.5px] font-semibold tabular-nums">{rm(i.quantity * i.unitPriceRm)}</span>
                  </div>
                  <RemarkInput key={`${i.id}:${i.remark ?? ''}`} value={i.remark ?? ''} disabled={pending} onSave={(v) => run(() => setBillItemRemark(i.id, v))} />
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
            {balances && (spendable.length > 0 || balances.outstanding > 0) && (
              <div className="mb-3 rounded-lg bg-cream/60 p-3">
                <p className="mb-2 font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-dark/55">Use balance</p>
                {spendable.map((k) => (
                  <label key={k} className="mb-1.5 flex items-center justify-between gap-2 font-body text-[13px]">
                    <span>
                      {BALANCE_LABEL[k]} <span className="text-dark/50">· {rm(balances[k])} available</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <input
                        value={useText[k]}
                        inputMode="decimal"
                        placeholder="0.00"
                        aria-label={`Use ${BALANCE_LABEL[k]} (RM)`}
                        onChange={(e) => setUseText((u) => ({ ...u, [k]: e.target.value }))}
                        className={`${field} w-24 py-1 text-right tabular-nums`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const others = SPENDABLE_KINDS.filter((o) => o !== k).reduce((sum, o) => sum + (parseRm(useText[o]) ?? 0), 0)
                          const max = Math.max(0, Math.min(balances[k], totals.total - others))
                          setUseText((u) => ({ ...u, [k]: max ? max.toFixed(2) : '' }))
                        }}
                        className="rounded-md border border-accent/30 px-2 py-1 font-heading text-[9.5px] font-bold uppercase tracking-wide text-accent hover:bg-white"
                      >
                        Max
                      </button>
                    </span>
                  </label>
                ))}
                {balances.outstanding > 0 && (
                  <p className="mt-1 font-body text-[12px] text-amber-800">Already owes {rm(balances.outstanding)} — settle it from the patient profile.</p>
                )}
                {(!usesValid || due == null) && <p className="mt-1 font-body text-[12px] text-red-700">That’s more than the balance or the bill.</p>}
              </div>
            )}
            {balances && due != null && due > 0 && (
              <label className="mb-3 flex items-center gap-2 font-body text-[13px]">
                <input type="checkbox" checked={payLater} onChange={(e) => setPayLater(e.target.checked)} className="h-4 w-4 accent-accent" />
                Pay later — add {rm(due)} to what they owe
              </label>
            )}
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
                      <input value={received} inputMode="decimal" onChange={(e) => setReceived(e.target.value)} placeholder={(due ?? 0).toFixed(2)} className={`${field} w-full text-right tabular-nums`} />
                    </label>
                    <div className="text-right font-body text-[13px]">
                      <div className="text-dark/55">Change</div>
                      <div className="font-semibold tabular-nums">{change != null ? rm(change) : '—'}</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              bill.items.length > 0 && (
                <p className="font-body text-[12.5px] text-dark/60">
                  {payLater ? 'Nothing taken now — the amount is added to what they owe.' : totals.total > 0 ? 'Fully paid from balance.' : 'Nothing to pay — package sessions only.'}
                </p>
              )
            )}
            <button
              type="button"
              disabled={pending || !canPay}
              onClick={() =>
                run(
                  () => payBill(bill.id, { method: needsMethod ? method : null, receivedRm: needsMethod && method === 'cash' ? receivedRm : null, uses, payLater }),
                  () => router.push(`${base}/checkout/${bill.id}/receipt`),
                )
              }
              className="mt-3 w-full rounded-xl bg-primary px-5 py-3 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? 'Working…' : needsMethod ? `Take payment · ${rm(due ?? 0)}` : 'Complete'}
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

/** A line's remark, printed under it on the receipt (e.g. for an insurance claim). Saves on blur / Enter. */
function RemarkInput({ value, onSave, disabled }: { value: string; onSave: (v: string) => void; disabled?: boolean }) {
  const [text, setText] = useState(value)
  const commit = () => { if (text.trim() !== value) onSave(text.trim()) }
  return (
    <input
      value={text}
      disabled={disabled}
      maxLength={200}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      placeholder="Remark (printed on the receipt)"
      aria-label="Remark for this line"
      className="mt-1.5 w-full rounded-md border border-dashed border-accent/25 bg-transparent px-2 py-1 font-body text-[12px] italic text-dark/70 placeholder:text-dark/35 focus:border-accent focus:outline-none"
    />
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
