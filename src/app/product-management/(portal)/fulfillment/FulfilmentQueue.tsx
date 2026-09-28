'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNowStrict } from 'date-fns'
import { PackageCheck, Printer, Receipt, Send, Tag, Truck, X } from 'lucide-react'
import type { FulfilmentQueueItem } from '@/lib/product-management/queries'
import { markProductOrdersPacking, updateProductOrderStatus } from '@/lib/product-management/actions'

const TABS = [
  { key: 'paid', label: 'To pack' },
  { key: 'processing', label: 'Packing' },
  { key: 'shipped', label: 'Shipped · 7 days' },
] as const

export const COURIERS = ['Pos Laju', 'J&T Express', 'DHL eCommerce', 'Ninja Van', 'City-Link Express', 'GDEX', 'SPX Express', 'Lalamove']

function printUrl(ids: string[], type: 'label' | 'slip', format?: 'thermal' | 'a4') {
  const p = new URLSearchParams({ ids: ids.join(','), type })
  if (format) p.set('format', format)
  return `/product-management/print?${p.toString()}`
}

export default function FulfilmentQueue({ orders }: { orders: FulfilmentQueueItem[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('paid')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [shipping, setShipping] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.key, orders.filter((o) => o.status === t.key).length])), [orders])
  const rows = orders.filter((o) => o.status === tab)
  const selectedIds = rows.filter((o) => selected.has(o.id)).map((o) => o.id)
  const allSelected = rows.length > 0 && selectedIds.length === rows.length

  function switchTab(key: typeof tab) {
    setTab(key)
    setSelected(new Set())
    setShipping(null)
  }
  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function markPacking() {
    setMsg(null)
    start(async () => {
      const res = await markProductOrdersPacking({ orderIds: selectedIds })
      if (res.ok) {
        setMsg({ ok: true, text: `${res.data?.updated ?? 0} order(s) moved to Packing.` })
        setSelected(new Set())
        router.refresh()
      } else setMsg({ ok: false, text: res.error })
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => switchTab(t.key)}
            className={[
              'inline-flex h-10 items-center gap-2 rounded-xl px-4 font-heading text-[12px] font-semibold transition-colors',
              tab === t.key ? 'bg-[#12372D] text-white' : 'border border-[#12372D]/10 bg-white text-[#12372D]/70 hover:text-[#12372D]',
            ].join(' ')}
          >
            {t.label}
            <span className={`rounded-full px-2 py-0.5 text-[10.5px] ${tab === t.key ? 'bg-[#E4C384] text-[#12372D]' : 'bg-[#12372D]/[0.06]'}`}>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <div className="sticky top-[80px] z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-[#B58A3B]/30 bg-[#FBF6EC] p-3 shadow-[0_12px_30px_-20px_rgba(18,55,45,0.5)]">
          <span className="px-1 font-heading text-[12.5px] font-semibold text-[#12372D]">{selectedIds.length} selected</span>
          <BulkLink href={printUrl(selectedIds, 'label', 'thermal')} icon={Tag} label="4×6 labels" />
          <BulkLink href={printUrl(selectedIds, 'label', 'a4')} icon={Printer} label="A4 labels" />
          <BulkLink href={printUrl(selectedIds, 'slip')} icon={Receipt} label="Packing slips" />
          {tab === 'paid' && (
            <button
              type="button"
              onClick={markPacking}
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#12372D] px-3 font-heading text-[11.5px] font-semibold text-white hover:bg-[#0E2C24] disabled:opacity-50"
            >
              <PackageCheck className="h-3.5 w-3.5 text-[#E4C384]" />
              {pending ? 'Updating…' : 'Mark as packing'}
            </button>
          )}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-[#12372D]/50 hover:bg-white" aria-label="Clear selection">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {msg && <p className={`font-body text-[13px] ${msg.ok ? 'text-[#006B3C]' : 'text-red-700'}`}>{msg.text}</p>}

      <div className="overflow-hidden rounded-[24px] border border-[#12372D]/[0.06] bg-white" style={{ boxShadow: '0 1px 2px rgba(18,55,45,0.04), 0 24px 48px -32px rgba(18,55,45,0.35)' }}>
        {rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Truck className="mx-auto h-8 w-8 text-[#B58A3B]/60" strokeWidth={1.5} />
            <p className="mt-3 font-heading text-[15px] font-semibold text-[#12372D]">
              {tab === 'shipped' ? 'Nothing shipped in the last 7 days.' : 'All caught up — nothing to ' + (tab === 'paid' ? 'pack' : 'ship') + '.'}
            </p>
            <p className="mt-1 font-body text-[13px] text-[#12372D]/50">Paid product orders appear here automatically.</p>
          </div>
        ) : (
          <>
            <label className="flex items-center gap-3 border-b border-[#12372D]/[0.06] bg-[#F6F7F3] px-5 py-3 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#12372D]/55">
              <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((o) => o.id)))} className="h-4 w-4 accent-[#12372D]" />
              Select all {rows.length}
            </label>
            <ul className="divide-y divide-[#12372D]/[0.06]">
              {rows.map((o) => (
                <li key={o.id} className={selected.has(o.id) ? 'bg-[#FBF6EC]/60' : ''}>
                  <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggle(o.id)} className="mt-1 h-4 w-4 shrink-0 accent-[#12372D]" aria-label={`Select ${o.order_number}`} />
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 font-heading text-[14px] font-semibold text-[#12372D]">
                          <Link href={`/product-management/orders/${o.id}`} className="hover:text-[#B58A3B]">{o.order_number}</Link>
                          <span className="font-body text-[12.5px] font-normal text-[#12372D]/60">· {o.recipient}</span>
                        </p>
                        <p className="mt-0.5 truncate font-body text-[12.5px] text-[#12372D]/55">{o.items_summary}</p>
                        <p className="mt-0.5 font-body text-[11.5px] text-[#12372D]/45">
                          {[o.city, o.state, o.country].filter(Boolean).join(', ')}
                          {o.status === 'shipped'
                            ? ` · ${o.courier ?? ''} ${o.tracking_number ?? ''}`
                            : o.paid_at
                              ? ` · paid ${formatDistanceToNowStrict(new Date(o.paid_at))} ago`
                              : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pl-7 sm:pl-0">
                      <a
                        href={printUrl([o.id], 'label', 'thermal')}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#12372D]/12 bg-white px-3 font-heading text-[11.5px] font-semibold text-[#12372D] hover:border-[#B58A3B]/50"
                      >
                        <Tag className="h-3.5 w-3.5 text-[#B58A3B]" /> Label
                      </a>
                      {o.status !== 'shipped' && (
                        <button
                          type="button"
                          onClick={() => setShipping(shipping === o.id ? null : o.id)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#12372D] px-3 font-heading text-[11.5px] font-semibold text-white hover:bg-[#0E2C24]"
                        >
                          <Send className="h-3.5 w-3.5 text-[#E4C384]" /> Ship
                        </button>
                      )}
                    </div>
                  </div>
                  {shipping === o.id && <ShipForm orderId={o.id} onDone={(text) => { setShipping(null); setMsg({ ok: true, text }); router.refresh() }} />}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

function BulkLink({ href, icon: Icon, label }: { href: string; icon: typeof Tag; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#12372D]/12 bg-white px-3 font-heading text-[11.5px] font-semibold text-[#12372D] hover:border-[#B58A3B]/50">
      <Icon className="h-3.5 w-3.5 text-[#B58A3B]" /> {label}
    </a>
  )
}

function ShipForm({ orderId, onDone }: { orderId: string; onDone: (msg: string) => void }) {
  const [courier, setCourier] = useState('')
  const [tracking, setTracking] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    start(async () => {
      const res = await updateProductOrderStatus({ orderId, status: 'shipped', courier, trackingNumber: tracking })
      if (res.ok) onDone('Marked as shipped. The customer can now see the tracking number.')
      else setErr(res.error)
    })
  }

  return (
    <form onSubmit={submit} className="mx-5 mb-4 grid gap-3 rounded-xl border border-[#12372D]/10 bg-[#F6F7F3] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="block">
        <span className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#12372D]/60">Courier</span>
        <input list="couriers" required value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. Pos Laju" className={fieldCls} />
        <datalist id="couriers">{COURIERS.map((c) => <option key={c} value={c} />)}</datalist>
      </label>
      <label className="block">
        <span className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#12372D]/60">Tracking number</span>
        <input required value={tracking} onChange={(e) => setTracking(e.target.value.trim())} placeholder="e.g. EP123456789MY" className={fieldCls} />
      </label>
      <button type="submit" disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#12372D] px-5 font-heading text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#0E2C24] disabled:opacity-50">
        <Truck className="h-4 w-4 text-[#E4C384]" /> {pending ? 'Saving…' : 'Mark shipped'}
      </button>
      {err && <p className="font-body text-[12.5px] text-red-700 sm:col-span-3">{err}</p>}
    </form>
  )
}

const fieldCls =
  'mt-1.5 block h-11 w-full rounded-xl border border-[#12372D]/12 bg-white px-3 font-body text-[14px] text-[#12372D] placeholder:text-[#12372D]/30 focus:border-[#006B3C] focus:outline-none focus:ring-4 focus:ring-[#006B3C]/10'
