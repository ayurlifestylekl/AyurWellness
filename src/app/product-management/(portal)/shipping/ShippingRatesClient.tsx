'use client'

import { useState, useTransition } from 'react'
import { Check, Globe2, MapPin, Truck } from 'lucide-react'
import { format } from 'date-fns'
import { updateShippingZone, type ShippingZoneRow } from '@/lib/product-management/shipping'
import { calculateShipping } from '@/lib/shipping/zones'

const REGION_HINT: Record<string, string> = {
  MY: 'All Malaysian addresses',
  '*-ASEAN': 'Singapore, Thailand, Indonesia, Philippines, Vietnam, Brunei, Cambodia, Laos, Myanmar',
  '*-APAC': 'Australia, NZ, Japan, Korea, China, Hong Kong, Taiwan, India & rest of Asia-Pacific',
  '*': 'Every other country',
}

export default function ShippingRatesClient({ zones }: { zones: ShippingZoneRow[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {zones.map((z) => (
        <ZoneCard key={z.id} zone={z} />
      ))}
    </div>
  )
}

function ZoneCard({ zone }: { zone: ShippingZoneRow }) {
  const [base, setBase] = useState(zone.baseRateRm.toFixed(2))
  const [perKg, setPerKg] = useState(zone.perKgRateRm.toFixed(2))
  const [free, setFree] = useState(zone.freeThresholdRm === null ? '' : zone.freeThresholdRm.toFixed(2))
  const [saved, setSaved] = useState({ base: zone.baseRateRm, perKg: zone.perKgRateRm, free: zone.freeThresholdRm, at: zone.updatedAt })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  const num = (v: string) => (v.trim() === '' ? NaN : Number(v))
  const dirty =
    num(base) !== saved.base || num(perKg) !== saved.perKg || (free.trim() === '' ? null : num(free)) !== saved.free
  const valid = [base, perKg].every((v) => Number.isFinite(num(v)) && num(v) >= 0) && (free.trim() === '' || num(free) > 0)

  const preview = (subtotal: number, grams: number) =>
    valid
      ? calculateShipping(
          { id: zone.id, name: zone.name, countryCode: zone.countryCode, baseRateRm: num(base), perKgRateRm: num(perKg), freeThresholdRm: free.trim() === '' ? null : num(free) },
          subtotal,
          grams,
        ).rateRm
      : null

  function save() {
    setMsg(null)
    start(async () => {
      const res = await updateShippingZone({
        id: zone.id,
        baseRateRm: num(base),
        perKgRateRm: num(perKg),
        freeThresholdRm: free.trim() === '' ? null : num(free),
      })
      if (res.ok) {
        setSaved({ base: num(base), perKg: num(perKg), free: free.trim() === '' ? null : num(free), at: new Date().toISOString() })
        setMsg({ ok: true, text: 'Saved — new orders use these rates.' })
      } else setMsg({ ok: false, text: res.error })
    })
  }

  const Icon = zone.countryCode === 'MY' ? MapPin : Globe2
  return (
    <section
      className="rounded-[24px] border border-[#12372D]/[0.06] bg-white p-5 sm:p-6"
      style={{ boxShadow: '0 1px 2px rgba(18,55,45,0.04), 0 24px 48px -32px rgba(18,55,45,0.35)' }}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#12372D] text-[#E4C384]">
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-[16px] font-bold text-[#12372D]">{zone.name}</h2>
          <p className="mt-0.5 font-body text-[12.5px] leading-snug text-[#12372D]/55">{REGION_HINT[zone.countryCode] ?? zone.countryCode}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MoneyField label="Base rate" hint="Per order" value={base} onChange={setBase} />
        <MoneyField label="Per kg" hint="Each kg, rounded up" value={perKg} onChange={setPerKg} />
        <MoneyField label="Free over" hint="Empty = never free" value={free} onChange={setFree} placeholder="—" />
      </div>

      <div className="mt-4 rounded-xl bg-[#F6F7F3] px-4 py-3">
        <p className="flex items-center gap-2 font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-[#12372D]/50">
          <Truck className="h-3.5 w-3.5" /> Customer pays
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2 font-body text-[12px] text-[#12372D]/60">
          {[
            { sub: 60, g: 500, label: 'RM 60 · 0.5 kg' },
            { sub: 120, g: 1800, label: 'RM 120 · 1.8 kg' },
            { sub: 300, g: 2500, label: 'RM 300 · 2.5 kg' },
          ].map((ex) => {
            const r = preview(ex.sub, ex.g)
            return (
              <div key={ex.label}>
                <p>{ex.label}</p>
                <p className="font-heading text-[14px] font-bold text-[#12372D]">{r === null ? '—' : r === 0 ? 'Free' : `RM ${r.toFixed(2)}`}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className={`font-body text-[12px] ${msg ? (msg.ok ? 'text-[#006B3C]' : 'text-red-700') : 'text-[#12372D]/45'}`}>
          {msg ? msg.text : `Last updated ${format(new Date(saved.at), 'd MMM yyyy, h:mm a')}`}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || !valid || pending}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#12372D] px-5 font-heading text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#0E2C24] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="h-4 w-4 text-[#E4C384]" />
          {pending ? 'Saving…' : 'Save rates'}
        </button>
      </div>
    </section>
  )
}

function MoneyField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#12372D]/60">{label}</span>
      <span className="mt-1.5 flex h-11 items-center rounded-xl border border-[#12372D]/12 bg-[#FAFAF7] px-3 focus-within:border-[#006B3C] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#006B3C]/10">
        <span className="mr-1.5 font-body text-[13px] text-[#12372D]/45">RM</span>
        <input
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          className="w-full bg-transparent font-heading text-[15px] font-semibold tabular-nums text-[#12372D] outline-none placeholder:text-[#12372D]/30"
        />
      </span>
      <span className="mt-1 block font-body text-[11px] text-[#12372D]/45">{hint}</span>
    </label>
  )
}
