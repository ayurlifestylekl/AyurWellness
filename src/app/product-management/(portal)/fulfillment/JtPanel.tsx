'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, FileSpreadsheet, Truck, Upload } from 'lucide-react'
import { applyJtWaybills, previewJtWaybills, type WaybillMatch } from '@/lib/fulfilment/jt-actions'

const STATE_TEXT: Record<WaybillMatch['state'], string> = {
  ready: 'Will be marked shipped',
  already_shipped: 'Already shipped, left as it is',
  not_found: 'No website order with this number',
  not_paid: 'Not paid, left as it is',
  cancelled: 'Cancelled, left as it is',
}

/**
 * The J&T steps for staff, and step 3: upload J&T's order export so each
 * waybill number is matched to its website order and the order marked shipped.
 */
export default function JtPanel({ missingSettings, missingIntlSettings }: { missingSettings: string[]; missingIntlSettings: string[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [matches, setMatches] = useState<WaybillMatch[] | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()
  const ready = (matches ?? []).filter((m) => m.state === 'ready' && m.orderId)

  const preview = (file: File | undefined) => {
    if (!file) return
    setMsg(null)
    setMatches(null)
    const fd = new FormData()
    fd.set('file', file)
    start(async () => {
      const res = await previewJtWaybills(fd)
      if (res.ok) setMatches(res.data)
      else setMsg({ ok: false, text: res.error })
    })
  }

  const apply = () => {
    setMsg(null)
    start(async () => {
      const res = await applyJtWaybills(ready.map((m) => ({ orderId: m.orderId!, waybill: m.waybill })))
      if (res.ok) {
        setMsg({ ok: true, text: `${res.data.shipped} order(s) marked shipped with their J&T waybill numbers. Customers can now see their tracking number.${res.data.skipped ? ` ${res.data.skipped} had already changed and were left as they are.` : ''}` })
        setMatches(null)
        router.refresh()
      } else setMsg({ ok: false, text: res.error })
    })
  }

  return (
    <section className="rounded-[24px] border border-[#E30613]/20 bg-white p-5" style={{ boxShadow: '0 1px 2px rgba(18,55,45,0.04)' }}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 text-left" aria-expanded={open}>
        <Truck className="h-5 w-5 text-[#E30613]" />
        <span className="font-heading text-[15px] font-bold text-[#12372D]">Shipping with J&amp;T Express</span>
        <ChevronDown className={`ml-auto h-4 w-4 text-[#12372D]/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <ol className="space-y-2.5 font-body text-[13.5px] leading-relaxed text-[#12372D]/80">
            <li><strong>1.</strong> Below, tick the orders to send and press <strong>J&amp;T Malaysia</strong> (orders within Malaysia) or <strong>J&amp;T International</strong> (Singapore, Brunei, Vietnam). You get J&amp;T’s import file with the orders filled in. Orders that don’t belong in that file are left out.</li>
            <li><strong>2.</strong> In the J&amp;T portal, upload it: Malaysia orders under <strong>Order → Bulk Import Orders</strong>, international ones under <strong>Order → International Orders</strong>. Print the labels from J&amp;T.</li>
            <li><strong>3.</strong> In J&amp;T’s <strong>Order Management</strong>, export the orders (the file must include the waybill numbers and the Customer Order Number). Upload it here. Each order is marked shipped with its waybill number, and the customer can track it.</li>
            {missingSettings.length > 0 && (
              <li className="rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900">
                Not set yet: <strong>{missingSettings.join(', ')}</strong>. These columns are left empty in the file; choose them in the J&amp;T portal, or ask your developer to fill them in once.
              </li>
            )}
            {missingIntlSettings.length > 0 && (
              <li className="rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900">
                International file, not set yet: <strong>{missingIntlSettings.join(', ')}</strong>. Fill these in before uploading. For Vietnam, also pick the province, city and district from the dropdowns.
              </li>
            )}
          </ol>

          <div className="rounded-2xl border border-dashed border-[#12372D]/20 bg-[#F6F7F3] p-4">
            <p className="font-heading text-[12px] font-semibold uppercase tracking-[0.12em] text-[#12372D]/60">Step 3: upload J&amp;T’s export</p>
            <label className={`mt-3 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#12372D] px-5 font-heading text-[12px] font-semibold text-white hover:bg-[#0E2C24] ${pending ? 'opacity-50' : ''}`}>
              <Upload className="h-4 w-4 text-[#E4C384]" /> {pending ? 'Reading…' : 'Choose J&T export (.xlsx or .csv)'}
              <input type="file" accept=".xlsx,.xls,.csv" className="sr-only" disabled={pending} onChange={(e) => { preview(e.target.files?.[0]); e.target.value = '' }} />
            </label>

            {msg && <p className={`mt-3 font-body text-[13px] ${msg.ok ? 'text-[#006B3C]' : 'text-red-700'}`} role="status">{msg.text}</p>}

            {matches && (
              <div className="mt-4">
                <ul className="max-h-[280px] divide-y divide-[#12372D]/[0.06] overflow-y-auto rounded-xl border border-[#12372D]/10 bg-white">
                  {matches.map((m) => (
                    <li key={m.orderNumber} className="flex items-center gap-3 px-3 py-2 font-body text-[12.5px]">
                      <FileSpreadsheet className={`h-4 w-4 shrink-0 ${m.state === 'ready' ? 'text-[#006B3C]' : 'text-[#12372D]/30'}`} />
                      <span className="font-semibold text-[#12372D]">{m.orderNumber}</span>
                      <span className="text-[#12372D]/60">{m.recipient ?? ''}</span>
                      <span className="ml-auto font-mono text-[12px] text-[#12372D]">{m.waybill}</span>
                      <span className={`w-[170px] shrink-0 text-right ${m.state === 'ready' ? 'text-[#006B3C]' : 'text-[#12372D]/45'}`}>{STATE_TEXT[m.state]}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button type="button" disabled={pending || ready.length === 0} onClick={apply} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#E30613] px-5 font-heading text-[12px] font-semibold text-white hover:bg-[#c00510] disabled:opacity-40">
                    <Truck className="h-4 w-4" /> Mark {ready.length} order{ready.length === 1 ? '' : 's'} shipped
                  </button>
                  <button type="button" onClick={() => setMatches(null)} className="font-body text-[12.5px] text-[#12372D]/60 hover:text-[#12372D]">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
