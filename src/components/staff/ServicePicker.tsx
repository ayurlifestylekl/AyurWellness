'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { durationText, groupByCategory, matchServices, priceText, type ServiceOption } from '@/lib/staff/services'

interface Props {
  services: ServiceOption[]
  value: string
  onChange: (id: string) => void
  /** Shown when nothing is picked, e.g. "Select service" or "Same as guest 1". */
  placeholder?: string
}

/**
 * "Select service": category tabs, a search box and each therapy with its
 * duration and price — so staff pick the therapy itself, not a bare duration.
 */
export default function ServicePicker({ services, value, onChange, placeholder = 'Select service' }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const categories = useMemo(() => groupByCategory(services), [services])
  const selected = services.find((s) => s.id === value) ?? null
  const [tab, setTab] = useState<string | null>(null)
  const activeTab = tab ?? selected?.categoryId ?? categories[0]?.id ?? null

  const shown = query.trim()
    ? matchServices(services, query)
    : categories.find((c) => c.id === activeTab)?.services ?? []

  const pick = (id: string) => {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  return (
    // Forms wrap fields in <label>; a click on empty space inside the panel
    // would otherwise be forwarded to the first button and close it.
    <div onClick={(e) => e.preventDefault()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-accent/30 bg-white px-3 py-2 text-left font-body text-[14px] text-dark hover:border-accent focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
      >
        {selected ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-primary">{selected.title}</span>
            <span className="block text-[12px] text-dark/55">
              {durationText(selected.durationMins)}
              {priceText(selected) ? ` · ${priceText(selected)}` : ''}
            </span>
          </span>
        ) : (
          <span className="flex-1 text-dark/45">{placeholder}</span>
        )}
        {selected && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear service"
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onChange('') } }}
            className="rounded p-0.5 text-dark/40 hover:text-primary"
          >
            <X className="h-4 w-4" />
          </span>
        )}
        <ChevronDown className={`h-4 w-4 flex-none text-dark/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-accent/30 bg-white p-2 shadow-sm">
          <label className="flex items-center gap-2 rounded-lg border border-accent/20 px-2.5 py-1.5">
            <Search className="h-4 w-4 flex-none text-dark/40" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search therapy…"
              className="w-full bg-transparent font-body text-[13px] text-dark focus:outline-none"
            />
          </label>

          {!query.trim() && categories.length > 1 && (
            <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={c.id === activeTab}
                  onClick={() => setTab(c.id)}
                  className={`flex-none whitespace-nowrap rounded-full border px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-[0.1em] ${
                    c.id === activeTab ? 'border-accent bg-accent text-white' : 'border-accent/25 bg-white text-dark/65 hover:bg-cream'
                  }`}
                >
                  {c.title} <span className="opacity-70">{c.services.length}</span>
                </button>
              ))}
            </div>
          )}

          <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
            {shown.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => pick(s.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left hover:bg-cream ${
                    s.id === value ? 'border-accent bg-cream/70' : 'border-transparent'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-body text-[13.5px] font-semibold text-dark">{s.title}</span>
                    {query.trim() && <span className="block text-[11px] text-dark/45">{s.categoryTitle}</span>}
                  </span>
                  <span className="flex-none text-right font-body text-[12px] tabular-nums text-dark/60">
                    {priceText(s) && <span className="block font-semibold text-primary">{priceText(s)}</span>}
                    {durationText(s.durationMins)}
                  </span>
                </button>
              </li>
            ))}
            {shown.length === 0 && (
              <li className="px-3 py-4 text-center font-body text-[12.5px] italic text-dark/45">No therapy matches “{query}”.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
