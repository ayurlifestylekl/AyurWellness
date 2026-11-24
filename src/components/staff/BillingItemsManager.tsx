'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react'
import type { CounterItem, CounterItemKind } from '@/lib/counter/catalog'
import { deleteCounterItem, saveCounterItem, setCounterItemHidden, setWebsiteItemHidden } from '@/lib/counter/catalog-actions'
import { parseRm, rm } from '@/lib/counter/rules'

export interface WebsiteRow {
  id: string
  name: string
  priceRm: number | null
  group: string
  hidden: boolean
}

const field = 'rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[13.5px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40'
const KIND_LABEL: Record<CounterItemKind, string> = { service: 'Services', product: 'Products', package: 'Packages' }

/**
 * Billing items: what checkout offers. Website therapies and shop products can
 * be hidden from checkout (they stay on the website); the centre's own
 * services, products and packages can be added, edited, hidden and removed.
 */
export default function BillingItemsManager({
  ready,
  items,
  websiteServices,
  shopProducts,
}: {
  ready: boolean
  items: CounterItem[]
  websiteServices: WebsiteRow[]
  shopProducts: WebsiteRow[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [editing, setEditing] = useState<Partial<CounterItem> & { kind: CounterItemKind } | null>(null)

  const run = (fn: () => Promise<{ ok: boolean; error?: string; note?: string }>, after?: () => void) => {
    setMsg(null)
    start(async () => {
      const res = await fn()
      if (!res.ok) { setMsg({ ok: false, text: res.error ?? 'Something went wrong.' }); return }
      if (res.note) setMsg({ ok: true, text: res.note })
      after?.()
      router.refresh()
    })
  }

  if (!ready) {
    return <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 font-body text-[13.5px] text-amber-900">Billing items aren’t set up yet. Please ask your developer to finish the setup.</p>
  }

  return (
    <div className="space-y-8">
      {msg && <p role="status" className={`rounded-lg border px-3 py-2 font-body text-[13px] ${msg.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-red-300 bg-red-50 text-red-700'}`}>{msg.text}</p>}

      {(['service', 'product', 'package'] as CounterItemKind[]).map((kind) => {
        const own = items.filter((i) => i.kind === kind)
        const website = kind === 'service' ? websiteServices : kind === 'product' ? shopProducts : []
        return (
          <section key={kind} className="rounded-2xl border border-accent/20 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-[16px] font-bold text-primary">{KIND_LABEL[kind]}</h2>
              <button
                type="button"
                onClick={() => setEditing({ kind, name: '', priceRm: 0, durationMins: kind === 'service' ? 30 : null, sessions: kind === 'package' ? 5 : null, validDays: kind === 'package' ? 180 : null })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 font-heading text-[10px] font-bold uppercase tracking-[0.12em] text-white"
              >
                <Plus className="h-4 w-4" /> Add {kind}
              </button>
            </div>

            {editing?.kind === kind && !editing.id && <ItemForm value={editing} pending={pending} onCancel={() => setEditing(null)} onSave={(v) => run(() => saveCounterItem(v), () => setEditing(null))} />}

            <ul className="mt-3 divide-y divide-accent/10">
              {own.map((i) =>
                editing?.id === i.id ? (
                  <li key={i.id} className="py-2"><ItemForm value={editing} pending={pending} onCancel={() => setEditing(null)} onSave={(v) => run(() => saveCounterItem(v), () => setEditing(null))} /></li>
                ) : (
                  <Row
                    key={i.id}
                    name={i.name}
                    detail={[rm(i.priceRm), i.durationMins ? `${i.durationMins} min` : null, i.sessions ? `${i.sessions} sessions · valid ${i.validDays} days` : null].filter(Boolean).join(' · ')}
                    tag="Added by the centre"
                    hidden={i.hidden}
                    pending={pending}
                    onToggle={() => run(() => setCounterItemHidden(i.id, !i.hidden))}
                    onEdit={() => setEditing(i)}
                    onRemove={() => { if (confirm(`Remove “${i.name}”?`)) run(() => deleteCounterItem(i.id)) }}
                  />
                ),
              )}
              {website.map((w) => (
                <Row
                  key={w.id}
                  name={w.name}
                  detail={[w.priceRm != null ? rm(w.priceRm) : 'Price on consultation', w.group].filter(Boolean).join(' · ')}
                  tag={kind === 'service' ? 'Website therapy' : 'Shop product'}
                  hidden={w.hidden}
                  pending={pending}
                  onToggle={() => run(() => setWebsiteItemHidden(kind === 'service' ? 'treatment' : 'product', w.id, !w.hidden))}
                />
              ))}
              {!own.length && !website.length && <li className="py-4 font-body text-[13px] italic text-dark/45">Nothing yet.</li>}
            </ul>
            {kind !== 'package' && (
              <p className="mt-2 font-body text-[11.5px] text-dark/45">
                Website {kind === 'service' ? 'therapies' : 'products'} can only be hidden here; hiding takes them off checkout, not off the website. Their names and prices are changed in the admin {kind === 'service' ? 'Treatments' : 'Products'} page.
              </p>
            )}
          </section>
        )
      })}
    </div>
  )
}

function Row({ name, detail, tag, hidden, pending, onToggle, onEdit, onRemove }: {
  name: string; detail: string; tag: string; hidden: boolean; pending: boolean
  onToggle: () => void; onEdit?: () => void; onRemove?: () => void
}) {
  return (
    <li className={`flex flex-wrap items-center gap-3 py-2.5 ${hidden ? 'opacity-55' : ''}`}>
      <div className="min-w-0 flex-1">
        <p className="font-body text-[13.5px] font-semibold text-dark">{name}{hidden && <span className="ml-2 rounded-full bg-dark/10 px-2 py-0.5 font-heading text-[9px] font-bold uppercase tracking-wide text-dark/60">Hidden</span>}</p>
        <p className="font-body text-[12px] text-dark/55">{detail} · <span className="text-dark/40">{tag}</span></p>
      </div>
      <div className="flex gap-1.5">
        <IconBtn label={hidden ? 'Show' : 'Hide'} disabled={pending} onClick={onToggle}>{hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</IconBtn>
        {onEdit && <IconBtn label="Edit" disabled={pending} onClick={onEdit}><Pencil className="h-4 w-4" /></IconBtn>}
        {onRemove && <IconBtn label="Remove" danger disabled={pending} onClick={onRemove}><Trash2 className="h-4 w-4" /></IconBtn>}
      </div>
    </li>
  )
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 font-heading text-[9.5px] font-bold uppercase tracking-[0.1em] disabled:opacity-50 ${danger ? 'border-red-300 text-red-700 hover:bg-red-50' : 'border-accent/30 text-dark/70 hover:bg-cream'}`}>
      {children} {label}
    </button>
  )
}

function ItemForm({ value, pending, onSave, onCancel }: {
  value: Partial<CounterItem> & { kind: CounterItemKind }
  pending: boolean
  onSave: (v: unknown) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(value.name ?? '')
  const [price, setPrice] = useState(value.priceRm != null && value.id ? value.priceRm.toFixed(2) : '')
  const [mins, setMins] = useState(String(value.durationMins ?? ''))
  const [sessions, setSessions] = useState(String(value.sessions ?? ''))
  const [days, setDays] = useState(String(value.validDays ?? ''))
  const [err, setErr] = useState<string | null>(null)
  const int = (t: string) => (t.trim() && /^\d+$/.test(t.trim()) ? Number(t) : null)

  const submit = () => {
    const p = parseRm(price)
    if (!name.trim()) return setErr('Enter a name.')
    if (p == null) return setErr('Enter the price, e.g. 25 or 25.50.')
    if (value.kind === 'package' && (!int(sessions) || !int(days))) return setErr('Enter the number of sessions and how many days the package lasts.')
    setErr(null)
    onSave({ id: value.id, kind: value.kind, name: name.trim(), priceRm: p, durationMins: value.kind === 'service' ? int(mins) : null, sessions: int(sessions), validDays: int(days) })
  }

  return (
    <div className="mt-3 rounded-xl border border-accent/25 bg-cream/40 p-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Lbl text="Name"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={`${field} w-full`} placeholder={value.kind === 'package' ? 'e.g. 5 × Head Massage' : value.kind === 'service' ? 'e.g. Hair Wash (add-on)' : 'e.g. Herbal powder 100 g'} /></Lbl>
        <Lbl text="Price (RM)"><input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className={`${field} w-full text-right`} placeholder="0.00" /></Lbl>
        {value.kind === 'service' && <Lbl text="Minutes"><input value={mins} onChange={(e) => setMins(e.target.value)} inputMode="numeric" className={`${field} w-full text-right`} /></Lbl>}
        {value.kind === 'package' && (
          <>
            <Lbl text="Sessions"><input value={sessions} onChange={(e) => setSessions(e.target.value)} inputMode="numeric" className={`${field} w-full text-right`} /></Lbl>
            <Lbl text="Valid (days)"><input value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" className={`${field} w-full text-right`} /></Lbl>
          </>
        )}
      </div>
      {err && <p className="mt-2 font-body text-[12.5px] text-red-700">{err}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={pending} onClick={submit} className="rounded-lg bg-primary px-4 py-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50">{pending ? 'Saving…' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-accent/30 px-4 py-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-dark/70">Cancel</button>
      </div>
    </div>
  )
}

function Lbl({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-dark/55">{text}</span>
      {children}
    </label>
  )
}
