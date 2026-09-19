'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, CalendarX, Megaphone } from 'lucide-react'
import { createAnnouncement, deleteAnnouncement } from '@/lib/staff/actions'
import type { Announcement } from '@/lib/booking/announcements'
import { fmtMY } from '@/lib/datetime'

export default function AnnouncementManager({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter()
  const [kind, setKind] = useState<'closure' | 'message'>('closure')
  const [message, setMessage] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const isClosure = kind === 'closure'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await createAnnouncement({ kind, message, startDate: startDate || null, endDate: endDate || null })
      if ('error' in res) setError(res.error)
      else { setMessage(''); setStartDate(''); setEndDate(''); router.refresh() }
    })
  }

  const remove = (id: string, isClosureRow: boolean) => {
    if (!confirm(isClosureRow ? 'Remove this closure? Bookings for those dates will reopen.' : 'Remove this announcement?')) return
    setError(null)
    start(async () => {
      const res = await deleteAnnouncement(id)
      if ('error' in res) setError(res.error)
      else router.refresh()
    })
  }

  const dateText = (a: Announcement) => {
    if (!a.startDate) return 'No date'
    const fmt = (d: string) => fmtMY(`${d}T12:00:00+08:00`, { dateStyle: 'medium' })
    return a.endDate && a.endDate !== a.startDate ? `${fmt(a.startDate)} – ${fmt(a.endDate)}` : fmt(a.startDate)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      {/* Create */}
      <form onSubmit={submit} className="space-y-3 rounded-xl border border-accent/30 bg-white p-5">
        <h3 className="font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-accent">Push an announcement</h3>

        <Field label="Type">
          <select value={kind} onChange={(e) => setKind(e.target.value as 'closure' | 'message')} className={inp}>
            <option value="closure">Closure (also blocks bookings)</option>
            <option value="message">Message (banner only)</option>
          </select>
        </Field>

        <Field label={isClosure ? 'Reason (shown to customers)' : 'Message'}>
          {isClosure ? (
            <input value={message} onChange={(e) => setMessage(e.target.value)} className={inp} placeholder="e.g. Deepavali" />
          ) : (
            <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} className={inp} placeholder="e.g. Public holiday hours: 10am–4pm this week." />
          )}
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label={isClosure ? 'Closed from' : 'Show from (optional)'}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inp} />
          </Field>
          <Field label={isClosure ? 'Closed until (optional)' : 'Hide after (optional)'}>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inp} />
          </Field>
        </div>

        {isClosure && (
          <p className="font-body text-[11.5px] italic text-dark/55">
            Customers see a &ldquo;we&rsquo;re closed&rdquo; banner and can&rsquo;t book these dates.
          </p>
        )}

        {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 font-body text-[12.5px] text-red-700">{error}</p>}

        <button type="submit" disabled={pending} className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent px-5 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-white hover:bg-accent/90 disabled:opacity-60">
          {pending ? 'Publishing…' : 'Publish'}
        </button>
      </form>

      {/* Live announcements */}
      <div>
        <h3 className="mb-2 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-accent">Live announcements</h3>
        {announcements.length === 0 ? (
          <p className="rounded-xl border border-dashed border-accent/30 bg-white/60 px-5 py-10 text-center font-body text-[14px] text-dark/50">Nothing published — the site shows no banner.</p>
        ) : (
          <div className="divide-y divide-accent/10 overflow-hidden rounded-xl border border-accent/20 bg-white">
            {announcements.map((a) => {
              const Icon = a.kind === 'closure' ? CalendarX : Megaphone
              return (
                <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <Icon className={`mt-0.5 h-4 w-4 flex-none ${a.kind === 'closure' ? 'text-primary' : 'text-accent'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-primary">
                      {a.kind === 'closure' ? 'Closure' : 'Message'}
                      <span className="ml-2 font-heading text-[10px] uppercase tracking-[0.1em] text-dark/45">{dateText(a)}</span>
                    </div>
                    <div className="text-[12.5px] text-dark/65">{a.message}</div>
                  </div>
                  <button onClick={() => remove(a.id, a.kind === 'closure')} disabled={pending} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50" aria-label="Remove announcement">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const inp = 'w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">{label}</span>
      {children}
    </label>
  )
}
