'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Check,
  ChevronDown,
  Clock,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react'

import type { Treatment, TreatmentCategory } from '@/types/treatments'

interface TreatmentPickerProps {
  categories: TreatmentCategory[]
  treatments: Treatment[]
  selected: Treatment | null
}

interface Group {
  category: TreatmentCategory
  treatments: Treatment[]
}

/**
 * Searchable treatment picker grouped by category. Selection is persisted
 * to the URL as `?id=<sanity-id>` — the page re-renders and a parent
 * orchestrator decides which embed / notice to show.
 *
 * Desktop: inline dropdown panel anchored under the trigger.
 * Mobile: full-screen overlay so the on-screen keyboard doesn't eat the
 * list.
 */
export default function TreatmentPicker({
  categories,
  treatments,
  selected,
}: TreatmentPickerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Focus search input when panel opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  // Lock body scroll while the mobile sheet is open. Desktop's panel is an
  // inline dropdown, not a full-screen sheet, so it should never freeze the
  // page — checked at open-time via matchMedia rather than a fixed width so
  // it tracks the sm: breakpoint used throughout this component.
  useEffect(() => {
    if (!open) return
    if (window.matchMedia('(min-width: 640px)').matches) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>()
    for (const c of categories) {
      map.set(c._id, { category: c, treatments: [] })
    }
    for (const t of treatments) {
      const g = map.get(t.categoryId)
      if (g) g.treatments.push(t)
    }
    return Array.from(map.values())
      .filter((g) => g.treatments.length > 0)
      .sort(
        (a, b) => (a.category.order ?? 99) - (b.category.order ?? 99),
      )
  }, [categories, treatments])

  const filteredGroups = useMemo<Group[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups
      .map((g) => ({
        category: g.category,
        treatments: g.treatments.filter((t) => {
          const haystack = `${t.title} ${t.description ?? ''} ${g.category.title}`.toLowerCase()
          return haystack.includes(q)
        }),
      }))
      .filter((g) => g.treatments.length > 0)
  }, [groups, query])

  const selectTreatment = useCallback(
    (t: Treatment) => {
      const params = new URLSearchParams(Array.from(searchParams.entries()))
      params.set('id', t._id)
      router.replace(`/book/treatment?${params.toString()}`, {
        scroll: false,
      })
      setOpen(false)
      setQuery('')
    },
    [router, searchParams],
  )

  const clearSelection = useCallback(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.delete('id')
    const qs = params.toString()
    router.replace(qs ? `/book/treatment?${qs}` : '/book/treatment', {
      scroll: false,
    })
  }, [router, searchParams])

  const totalCount = treatments.length

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ── Trigger ───────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl bg-white px-5 py-4 text-left ring-1 ring-primary/15 transition-[ring-color,box-shadow] duration-300 hover:ring-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:px-6 sm:py-5"
        style={{
          boxShadow:
            '0 2px 6px rgba(20, 148, 71,0.04), 0 20px 40px -20px rgba(20, 148, 71,0.18)',
        }}
      >
        {/* Gold accent bar */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[2px] opacity-70 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              'linear-gradient(to right, rgba(181, 138, 59,0.4), rgba(181, 138, 59,0.9) 50%, rgba(181, 138, 59,0.4))',
          }}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-heading text-[9.5px] font-bold uppercase tracking-[0.22em] text-accent">
            {selected ? 'Selected Treatment' : 'Choose Your Treatment'}
          </span>
          {selected ? (
            <span className="truncate font-heading text-[16px] font-extrabold leading-tight tracking-[-0.01em] text-primary sm:text-[18px]">
              {selected.title}
            </span>
          ) : (
            <span className="font-body text-[14px] italic text-dark/55 sm:text-[15px]">
              Search {totalCount} authentic Ayurvedic therapies…
            </span>
          )}
          {selected?.categoryTitle && (
            <span className="font-heading text-[9px] font-semibold uppercase tracking-[0.18em] text-primary/45">
              {selected.categoryTitle}
            </span>
          )}
        </div>
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/[0.06] text-primary/60 transition-[transform,background-color,color] duration-300 group-hover:bg-accent/10 group-hover:text-accent"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2.2} />
        </span>
      </button>

      {/* Secondary row — clear selection */}
      {selected && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={clearSelection}
            className="inline-flex items-center gap-1.5 font-heading text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/45 transition-colors hover:text-primary focus-visible:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <X className="h-3 w-3" strokeWidth={2.2} />
            Clear selection
          </button>
        </div>
      )}

      {/* ── Panel ─────────────────────────────────────── */}
      {open && (
        <>
          {/*
            Dimming backdrop — always rendered, not just on mobile. The
            parent orchestrator only goes two-column once a treatment is
            selected; before that (the very first screen most customers
            see) it's single-column at any width, so the picker's dropdown
            can sit directly over other translucent content below it
            (e.g. the "Pick a treatment to start" placeholder) with no
            backdrop to prevent visual bleed-through.
          */}
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-primary/40"
          />
          <div
            role="listbox"
            aria-label="Treatments"
            className="fixed inset-x-4 bottom-4 top-24 z-50 flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-primary/10 sm:absolute sm:inset-auto sm:left-0 sm:right-0 sm:top-[calc(100%+8px)] sm:max-h-[520px]"
            style={{
              boxShadow:
                '0 10px 30px -10px rgba(20, 148, 71,0.3), 0 40px 80px -30px rgba(20, 148, 71,0.35)',
            }}
          >
            {/* Search */}
            <div className="flex items-center gap-3 border-b border-primary/8 px-5 py-4">
              <Search
                className="h-4 w-4 shrink-0 text-primary/40"
                strokeWidth={2.2}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search therapies, conditions, categories…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent font-body text-[14px] text-dark placeholder:text-dark/35 focus:outline-none sm:text-[15px]"
                aria-label="Search treatments"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close treatment picker"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary/45 transition-colors hover:bg-primary/[0.06] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:hidden"
              >
                <X className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filteredGroups.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                  <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/35">
                    No matches
                  </span>
                  <p className="max-w-xs font-body text-[14px] italic text-dark/55">
                    We couldn&apos;t find a treatment for &ldquo;{query}&rdquo;. Try a
                    different term or message us on WhatsApp and we&apos;ll help.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col divide-y divide-primary/6">
                  {filteredGroups.map((g) => (
                    <li key={g.category._id}>
                      <div className="sticky top-0 z-10 flex items-center gap-3 bg-white px-5 py-2">
                        <span
                          aria-hidden
                          className="h-px w-4 bg-accent/60"
                        />
                        <span className="font-heading text-[9.5px] font-bold uppercase tracking-[0.2em] text-primary/55">
                          {g.category.title}
                        </span>
                        <span
                          aria-hidden
                          className="flex-1 h-px bg-primary/5"
                        />
                      </div>
                      <ul>
                        {g.treatments.map((t) => {
                          const isSelected = selected?._id === t._id
                          return (
                            <li key={t._id}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => selectTreatment(t)}
                                className={`group flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:bg-accent/[0.08] ${
                                  isSelected
                                    ? 'bg-accent/[0.08]'
                                    : 'hover:bg-primary/[0.03]'
                                }`}
                              >
                                <div className="flex min-w-0 flex-col gap-1">
                                  <span className="flex items-center gap-2">
                                    <span
                                      className={`truncate font-heading text-[14px] font-bold leading-tight tracking-[-0.005em] ${
                                        isSelected
                                          ? 'text-accent'
                                          : 'text-primary'
                                      }`}
                                    >
                                      {t.title}
                                    </span>
                                    {t.requiresConsultation && (
                                      <span
                                        title="Practitioner consultation required"
                                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/35 bg-accent/10 px-1.5 py-0.5 font-heading text-[8px] font-bold uppercase tracking-[0.14em] text-accent"
                                      >
                                        <ShieldAlert
                                          className="h-2.5 w-2.5"
                                          strokeWidth={2.2}
                                        />
                                        Consult
                                      </span>
                                    )}
                                  </span>
                                  {t.duration && (
                                    <span className="flex items-center gap-1.5 font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/50">
                                      <Clock
                                        className="h-3 w-3 text-accent/70"
                                        strokeWidth={2}
                                      />
                                      {t.duration}
                                    </span>
                                  )}
                                </div>
                                <span
                                  aria-hidden
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                                    isSelected
                                      ? 'bg-accent text-white'
                                      : 'bg-primary/[0.04] text-transparent group-hover:bg-primary/10'
                                  }`}
                                >
                                  <Check
                                    className="h-3.5 w-3.5"
                                    strokeWidth={2.6}
                                  />
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer count */}
            <div className="flex items-center justify-between border-t border-primary/8 px-5 py-2.5">
              <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/50">
                {filteredGroups.reduce(
                  (sum, g) => sum + g.treatments.length,
                  0,
                )}{' '}
                of {totalCount} therapies
              </span>
              <span className="hidden font-heading text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/35 sm:block">
                Esc to close
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
