'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, UserCheck } from 'lucide-react'
import { findReturningClients } from '@/lib/staff/patient-actions'
import type { ReturningClient } from '@/lib/staff/patients'

/**
 * Search past patients by name or phone and fill the booking form with their
 * details, so returning clients don't have to be typed in again.
 */
export default function ClientLookup({ onPick }: { onPick: (c: ReturningClient) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<ReturningClient[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const latest = useRef(0)

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    const run = ++latest.current
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const rows = await findReturningClients(term)
        if (run === latest.current) setResults(rows)
      } catch {
        if (run === latest.current) setResults([])
      } finally {
        if (run === latest.current) setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  const pick = (c: ReturningClient) => {
    onPick(c)
    setPicked(c.name)
    setQ('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="relative rounded-lg border border-accent/30 bg-cream/40 p-3">
      <label className="block">
        <span className="mb-1 flex items-center gap-1.5 font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">
          <Search className="h-3 w-3" /> Returning client? Find by name or phone
        </span>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="e.g. Priya or 0162345678"
          className="w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          autoComplete="off"
        />
      </label>

      {picked && !q && (
        <p className="mt-2 flex items-center gap-1.5 font-body text-[12px] text-emerald-700">
          <UserCheck className="h-3.5 w-3.5" /> Details filled in for {picked}. Check them, then continue.
        </p>
      )}

      {open && q.trim().length >= 2 && (
        <div className="absolute inset-x-3 top-full z-20 -mt-1 max-h-72 overflow-y-auto rounded-lg border border-accent/30 bg-white shadow-lg">
          {loading && results.length === 0 ? (
            <p className="px-3 py-2.5 font-body text-[12.5px] text-dark/50">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2.5 font-body text-[12.5px] text-dark/50">No past client found — enter their details below.</p>
          ) : (
            results.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => pick(c)}
                className="block w-full border-b border-accent/10 px-3 py-2 text-left last:border-0 hover:bg-cream/60"
              >
                <span className="font-semibold text-primary">{c.name}</span>
                <span className="ml-2 font-body text-[12px] text-dark/60">{c.phone ?? 'no phone'}</span>
                <span className="block font-body text-[11.5px] text-dark/45">
                  {[
                    c.gender ? (c.gender === 'male' ? 'Male' : 'Female') : null,
                    c.email,
                    `${c.visits} visit${c.visits === 1 ? '' : 's'}`,
                    c.lastVisitISO
                      ? `last ${new Date(c.lastVisitISO).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric' })}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
