'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import type { Therapist, Vaidya } from '@/lib/staff/therapist-format'
import { createBlock, deleteBlock } from '@/lib/staff/actions'
import { fmtMY } from '@/lib/datetime'
import type { ScheduleBlock } from '@/lib/booking/blocks'

const RECUR_LABEL = { none: 'One-off', weekly: 'Weekly', monthly: 'Monthly' } as const

interface Props {
  blocks: ScheduleBlock[]
  therapists: Therapist[]
  vaidyas: Vaidya[]
}

export default function BlockManager({ blocks, therapists, vaidyas }: Props) {
  const router = useRouter()
  const [therapistCode, setTherapistCode] = useState('')
  const [allDay, setAllDay] = useState(true)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:30')
  const [endTime, setEndTime] = useState('20:30')
  const [recurrence, setRecurrence] = useState<'none' | 'weekly' | 'monthly'>('none')
  const [until, setUntil] = useState('')
  const [reason, setReason] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!date) return setError('Pick a date.')
    const startAt = allDay ? `${date}T00:00:00+08:00` : `${date}T${startTime}:00+08:00`
    const endAt = allDay ? `${date}T23:59:00+08:00` : `${date}T${endTime}:00+08:00`
    start(async () => {
      const res = await createBlock({
        therapistCode: therapistCode || null,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        allDay,
        recurrence,
        untilDate: recurrence !== 'none' ? until || null : null,
        reason,
      })
      if ('error' in res) setError(res.error)
      else {
        setDate(''); setReason(''); setUntil('')
        router.refresh()
      }
    })
  }

  const remove = (id: string) => {
    if (!confirm('Remove this block?')) return
    start(async () => {
      const res = await deleteBlock(id)
      if (!('error' in res)) router.refresh()
      else setError(res.error)
    })
  }

  const therapistName = (code: string | null) => {
    if (!code) return 'All therapists'
    const v = vaidyas.find((v) => v.code === code)
    if (v) return `${v.name} (consultations only)`
    return therapists.find((t) => t.code === code)?.name ?? code
  }

  // Searchable across therapist, date, time and reason so staff can pinpoint the
  // exact block to remove.
  const haystack = (b: ScheduleBlock) =>
    [
      therapistName(b.therapist_code),
      b.therapist_code ?? 'centre closed',
      fmtMY(b.start_at, { dateStyle: 'medium' }),
      fmtMY(b.start_at, { timeStyle: 'short' }),
      b.all_day ? 'all day' : fmtMY(b.end_at, { timeStyle: 'short' }),
      RECUR_LABEL[b.recurrence],
      b.reason ?? '',
    ]
      .join(' ')
      .toLowerCase()
  const q = query.trim().toLowerCase()
  const filtered = q ? blocks.filter((b) => haystack(b).includes(q)) : blocks

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      {/* Create form */}
      <form onSubmit={submit} className="space-y-3 rounded-xl border border-accent/30 bg-white p-5">
        <h3 className="font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-accent">Add a block</h3>

        <Field label="Therapist">
          <select value={therapistCode} onChange={(e) => setTherapistCode(e.target.value)} className={inp}>
            <option value="">All therapists (centre closed)</option>
            {therapists.map((t) => (
              <option key={t.code} value={t.code}>{t.name} · {t.code}</option>
            ))}
            {vaidyas.map((v) => (
              <option key={v.code} value={v.code}>{v.name} (consultations only)</option>
            ))}
          </select>
        </Field>

        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="h-4 w-4 accent-[#006B3C]" />
          <span className="font-body text-[13px] text-dark/80">All day (leave / closure)</span>
        </label>

        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
        </Field>

        {!allDay && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="From"><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inp} /></Field>
            <Field label="To"><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inp} /></Field>
          </div>
        )}

        <Field label="Repeat">
          <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as typeof recurrence)} className={inp}>
            <option value="none">One-off</option>
            <option value="weekly">Weekly (same weekday)</option>
            <option value="monthly">Monthly (same date)</option>
          </select>
        </Field>

        {recurrence !== 'none' && (
          <Field label="Repeat until (optional)">
            <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className={inp} />
          </Field>
        )}

        <Field label="Reason (optional)">
          <input value={reason} onChange={(e) => setReason(e.target.value)} className={inp} placeholder="e.g. Annual leave, public holiday" />
        </Field>

        {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 font-body text-[12.5px] text-red-700">{error}</p>}

        <button type="submit" disabled={pending} className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent px-5 font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-white hover:bg-accent/90 disabled:opacity-60">
          {pending ? 'Saving…' : 'Add block'}
        </button>
      </form>

      {/* Existing blocks */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-accent">Current blocks</h3>
          {blocks.length > 0 && (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search date, time, therapist, reason…"
              className="w-full rounded-lg border border-accent/30 bg-white px-3 py-1.5 font-body text-[13px] text-dark placeholder:text-dark/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40 sm:w-64"
            />
          )}
        </div>
        {blocks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-accent/30 bg-white/60 px-5 py-10 text-center font-body text-[14px] text-dark/50">No blocks set.</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-accent/30 bg-white/60 px-5 py-10 text-center font-body text-[14px] text-dark/50">No blocks match &ldquo;{query}&rdquo;.</p>
        ) : (
          <div className="divide-y divide-accent/10 overflow-hidden rounded-xl border border-accent/20 bg-white">
            {filtered.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-primary">{therapistName(b.therapist_code)}</div>
                  <div className="text-[12.5px] text-dark/60">
                    {b.all_day
                      ? `${fmtMY(b.start_at, { dateStyle: 'medium' })} · All day`
                      : `${fmtMY(b.start_at, { dateStyle: 'medium', timeStyle: 'short' })} – ${fmtMY(b.end_at, { timeStyle: 'short' })}`}
                    {b.recurrence !== 'none' && ` · ${RECUR_LABEL[b.recurrence]}${b.until_date ? ` until ${b.until_date}` : ''}`}
                    {b.reason ? ` · ${b.reason}` : ''}
                  </div>
                </div>
                <button onClick={() => remove(b.id)} disabled={pending} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50" aria-label="Remove block">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
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
