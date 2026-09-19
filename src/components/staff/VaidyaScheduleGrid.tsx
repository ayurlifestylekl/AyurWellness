'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { GridAppt, GridBlock } from '@/lib/staff/appointments'
import type { Vaidya } from '@/lib/staff/therapist-format'
import { createBlock, deleteBlock, updateBlockReason, createConsultationFromGrid, setAppointmentColorTag } from '@/lib/staff/actions'
import { fmtMY } from '@/lib/datetime'
import type { StaffColorTag } from '@/types/booking'
import { STAFF_COLOR_SWATCHES, apptClasses } from './ScheduleGrid'

const OPEN = 9 * 60 + 30   // 09:30
const CLOSE = 20 * 60 + 30 // 20:30
const ROW = 30
const ROW_PX = 46
const HEADER_PX = 40
const COL_W = 150
const totalPx = ((CLOSE - OPEN) / ROW) * ROW_PX

const SLOTS: number[] = []
for (let m = OPEN; m < CLOSE; m += ROW) SLOTS.push(m)

function shiftDay(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00+08:00`)
  d.setDate(d.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

const topFor = (min: number) => ((min - OPEN) / ROW) * ROW_PX
const clamp = (min: number) => Math.max(OPEN, Math.min(CLOSE, min))

interface Props {
  date: string
  vaidyas: Vaidya[]
  appts: GridAppt[]
  blocks: GridBlock[]
  detailBase?: string
  editable?: boolean
}

export default function VaidyaScheduleGrid({
  date,
  vaidyas,
  appts,
  blocks,
  detailBase = '/console',
  editable = false,
}: Props) {
  const router = useRouter()
  const go = (d: string) => router.push(`/console/doctors?date=${d}`)

  const [mode, setMode] = useState<'book' | 'block'>('book')

  // Quick-block draft: a Vaidya column + a slot range.
  const [draft, setDraft] = useState<{ code: string; startMin: number; endMin: number } | null>(null)
  const [reason, setReason] = useState('')
  // An existing block the user tapped.
  const [blockSel, setBlockSel] = useState<{ id: string | null; name: string; startMin: number; endMin: number } | null>(null)
  const [editReason, setEditReason] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  // Booking draft from the grid.
  const [bookDraft, setBookDraft] = useState<{ code: string; startMin: number } | null>(null)
  const [bookName, setBookName] = useState('')
  const [bookPhone, setBookPhone] = useState('')
  const [bookEmail, setBookEmail] = useState('')
  const [bookReason, setBookReason] = useState('')

  // Manual colour-tag picker.
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null)
  const setColorTag = (appointmentId: string, tag: StaffColorTag | null) => {
    setColorPickerFor(null)
    start(async () => {
      await setAppointmentColorTag(appointmentId, tag)
      router.refresh()
    })
  }

  const isoAt = (min: number) => {
    const hh = String(Math.floor(min / 60)).padStart(2, '0')
    const mm = String(min % 60).padStart(2, '0')
    return new Date(`${date}T${hh}:${mm}:00+08:00`).toISOString()
  }

  const minLabel = (min: number) =>
    fmtMY(`${date}T${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}:00+08:00`, { hour: 'numeric', minute: '2-digit', hour12: true })

  const tapSlot = (code: string, m: number) => {
    setErr(null)
    setBlockSel(null)
    if (mode === 'book') {
      setBookDraft({ code, startMin: m })
      return
    }
    setDraft((prev) => {
      if (!prev || prev.code !== code) return { code, startMin: m, endMin: m + ROW }
      if (m + ROW > prev.endMin) return { ...prev, endMin: m + ROW }
      if (m < prev.startMin) return { ...prev, startMin: m }
      return { code, startMin: m, endMin: m + ROW }
    })
  }

  const addBlock = () => {
    if (!draft) return
    setErr(null)
    start(async () => {
      const res = await createBlock({
        therapistCode: draft.code,
        startAt: isoAt(draft.startMin),
        endAt: isoAt(draft.endMin),
        allDay: false,
        recurrence: 'none',
        untilDate: null,
        reason,
      })
      if ('error' in res) setErr(res.error)
      else { setDraft(null); setReason(''); router.refresh() }
    })
  }

  const removeBlock = () => {
    if (!blockSel?.id) return
    if (!confirm('Remove this block?')) return
    setErr(null)
    start(async () => {
      const res = await deleteBlock(blockSel.id as string)
      if ('error' in res) setErr(res.error)
      else { setBlockSel(null); router.refresh() }
    })
  }

  const saveReason = () => {
    if (!blockSel?.id) return
    setErr(null)
    start(async () => {
      const res = await updateBlockReason(blockSel.id as string, editReason)
      if ('error' in res) setErr(res.error)
      else { setBlockSel(null); router.refresh() }
    })
  }

  const resetBookDraft = () => {
    setBookDraft(null)
    setBookName('')
    setBookPhone('')
    setBookEmail('')
    setBookReason('')
  }

  const addBooking = () => {
    if (!bookDraft) return
    if (!bookName.trim()) { setErr('Enter the patient name.'); return }
    setErr(null)
    start(async () => {
      const res = await createConsultationFromGrid({
        vaidyaCode: bookDraft.code,
        startAt: isoAt(bookDraft.startMin),
        patientName: bookName.trim(),
        patientPhone: bookPhone.trim() || null,
        patientEmail: bookEmail.trim() || null,
        reason: bookReason.trim() || null,
      })
      if ('error' in res) setErr(res.error)
      else { resetBookDraft(); router.refresh() }
    })
  }

  const vaidyaName = (code: string) => vaidyas.find((v) => v.code === code)?.name ?? code

  const hourLabels: number[] = []
  for (let m = Math.ceil(OPEN / 60) * 60; m <= CLOSE; m += 60) hourLabels.push(m)

  const columns = vaidyas.map((v) => ({ code: v.code, name: v.name }))
  const apptsFor = (code: string) => appts.filter((a) => a.therapistCode === code)
  const blocksFor = (code: string) => blocks.filter((b) => b.therapistCode === null || b.therapistCode === code)

  return (
    <div>
      {/* Date nav */}
      <div className="mb-4 flex items-center gap-3">
        <Link href={`/console/doctors?date=${shiftDay(date, -1)}`} className="rounded-lg border border-accent/30 p-1.5 text-dark/60 hover:text-primary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && go(e.target.value)}
          className="rounded-lg border border-accent/30 bg-white px-3 py-1.5 font-body text-[13px] text-dark focus:border-accent focus:outline-none"
        />
        <Link href={`/console/doctors?date=${shiftDay(date, 1)}`} className="rounded-lg border border-accent/30 p-1.5 text-dark/60 hover:text-primary">
          <ChevronRight className="h-4 w-4" />
        </Link>
        <span className="font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-dark/55">
          {fmtMY(`${date}T12:00:00+08:00`, { weekday: 'long', day: 'numeric', month: 'long' })}
          <span className="ml-2 text-accent">{appts.length} consultations</span>
        </span>
      </div>

      {editable && (
        <div className="mb-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-dark/60">Mode:</span>
            {(['book', 'block'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setDraft(null); resetBookDraft(); setBlockSel(null); setErr(null) }}
                className={`rounded-full border px-3 py-1 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] ${
                  mode === m ? 'border-accent bg-accent text-white' : 'border-accent/30 bg-white text-dark/70 hover:bg-cream'
                }`}
              >
                {m === 'book' ? 'Book consultation' : 'Block slots'}
              </button>
            ))}
            <span className="ml-auto font-body text-[11.5px] italic text-dark/50">
              {mode === 'book'
                ? 'Tap a free slot to book a 30-minute consultation.'
                : 'Tap a free slot to start a block. Tap more slots to extend it · tap a block to edit or remove it.'}
            </span>
          </div>

          {mode === 'book' && bookDraft ? (
            <div className="rounded-xl border border-accent/40 bg-cream/60 p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                  Book {vaidyaName(bookDraft.code)} · {minLabel(bookDraft.startMin)}
                </span>
                <button onClick={resetBookDraft} className="rounded-lg border border-accent/30 p-1.5 text-dark/50 hover:text-primary" aria-label="Cancel">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Patient name" required>
                  <input value={bookName} onChange={(e) => setBookName(e.target.value)} className={bookInput} required />
                </Field>
                <Field label="Contact number (optional)">
                  <input value={bookPhone} onChange={(e) => setBookPhone(e.target.value)} className={bookInput} />
                </Field>
                <Field label="Email (optional)">
                  <input value={bookEmail} onChange={(e) => setBookEmail(e.target.value)} type="email" className={bookInput} />
                </Field>
                <Field label="Remark (optional)">
                  <input value={bookReason} onChange={(e) => setBookReason(e.target.value)} className={bookInput} placeholder="e.g. Room 2" />
                </Field>
              </div>
              <button onClick={addBooking} disabled={pending} className="mt-3 rounded-xl bg-accent px-5 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-accent/90 disabled:opacity-60">
                {pending ? 'Booking…' : 'Confirm booking'}
              </button>
            </div>
          ) : mode === 'block' && draft ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-accent/40 bg-cream/60 p-3">
              <span className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                Block {vaidyaName(draft.code)} · {minLabel(draft.startMin)} –
              </span>
              <select
                value={draft.endMin}
                onChange={(e) => setDraft((p) => (p ? { ...p, endMin: Number(e.target.value) } : p))}
                className="rounded-lg border border-accent/30 bg-white px-2 py-1.5 font-body text-[13px] focus:border-accent focus:outline-none"
                aria-label="Block end time"
              >
                {SLOTS.filter((m) => m + ROW > draft.startMin).map((m) => (
                  <option key={m + ROW} value={m + ROW}>{minLabel(m + ROW)}</option>
                ))}
              </select>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional)"
                className="min-w-[180px] flex-1 rounded-lg border border-accent/30 bg-white px-3 py-1.5 font-body text-[13px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                autoFocus
              />
              <button onClick={addBlock} disabled={pending} className="rounded-lg bg-accent px-4 py-1.5 font-heading text-[10.5px] font-bold uppercase tracking-[0.14em] text-white hover:bg-accent/90 disabled:opacity-60">
                {pending ? 'Blocking…' : `Block ${(draft.endMin - draft.startMin) / ROW > 1 ? `${(draft.endMin - draft.startMin) / ROW} slots` : 'slot'}`}
              </button>
              <button onClick={() => { setDraft(null); setReason(''); setErr(null) }} className="rounded-lg border border-accent/30 p-1.5 text-dark/50 hover:text-primary" aria-label="Cancel">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : blockSel ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-accent/40 bg-cream/60 p-3">
              <span className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                Blocked · {blockSel.name} · {minLabel(blockSel.startMin)}–{minLabel(blockSel.endMin)}
              </span>
              {blockSel.id ? (
                <>
                  <input
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="Reason (optional)"
                    className="min-w-[180px] flex-1 rounded-lg border border-accent/30 bg-white px-3 py-1.5 font-body text-[13px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                    autoFocus
                  />
                  <button onClick={saveReason} disabled={pending} className="rounded-lg bg-accent px-4 py-1.5 font-heading text-[10.5px] font-bold uppercase tracking-[0.14em] text-white hover:bg-accent/90 disabled:opacity-60">
                    {pending ? 'Saving…' : 'Save reason'}
                  </button>
                  <button onClick={removeBlock} disabled={pending} className="rounded-lg border border-red-300 px-4 py-1.5 font-heading text-[10.5px] font-bold uppercase tracking-[0.14em] text-red-700 hover:bg-red-50 disabled:opacity-60">
                    {pending ? '…' : 'Remove block'}
                  </button>
                </>
              ) : (
                <span className="font-body text-[12px] italic text-dark/55">
                  Recurring / availability block — edit it from the Availability page.
                </span>
              )}
              <button onClick={() => { setBlockSel(null); setErr(null) }} className="rounded-lg border border-accent/30 p-1.5 text-dark/50 hover:text-primary" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}
          {err && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 font-body text-[12px] text-red-700">{err}</p>}
        </div>
      )}

      {editable && (
        <div className="mb-3 flex flex-wrap items-center gap-2 font-body text-[11px] text-dark/70">
          <span className="font-heading text-[10px] font-bold uppercase tracking-[0.12em] text-dark/55">Legend:</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-rose-100 border border-rose-300" /> Pending</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-sky-100 border border-sky-300" /> Scheduled</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-100 border border-amber-300" /> Awaiting payment</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-100 border border-emerald-300" /> Confirmed</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-pink-100 border border-pink-300" /> Checked in</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-violet-100 border border-violet-300" /> In progress</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-100 border border-slate-300" /> Completed</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-yellow-400" /> Web booking</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-accent/20 bg-white">
        <div className="flex min-w-full">
          {/* Time gutter */}
          <div className="sticky left-0 z-10 flex-none bg-white" style={{ width: 64 }}>
            <div style={{ height: HEADER_PX }} className="border-b border-accent/20" />
            <div className="relative" style={{ height: totalPx }}>
              {hourLabels.map((m) => (
                <div key={m} className="absolute right-2 -translate-y-1/2 whitespace-nowrap font-heading text-[10.5px] font-semibold tabular-nums text-dark/55" style={{ top: topFor(m) }}>
                  {fmtMY(`${date}T${String(Math.floor(m / 60)).padStart(2, '0')}:00:00+08:00`, { hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>
              ))}
            </div>
          </div>

          {/* Vaidya columns */}
          {columns.map((col) => (
            <div key={col.code} className="flex-1 border-l border-accent/15" style={{ minWidth: COL_W }}>
              <div
                style={{ height: HEADER_PX }}
                className="flex items-center justify-center border-b border-accent/20 px-2 text-center font-heading text-[11px] font-bold uppercase tracking-[0.1em] bg-cream/60 text-primary"
              >
                {col.name}
              </div>
              <div
                className="relative"
                style={{
                  height: totalPx,
                  backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent ${ROW_PX - 1}px, rgba(0,107,60,0.06) ${ROW_PX - 1}px, rgba(0,107,60,0.06) ${ROW_PX}px)`,
                }}
              >
                {/* Click-to-book / click-to-block overlay */}
                {editable && SLOTS.map((m) => (
                  <button
                    key={`s${m}`}
                    type="button"
                    onClick={() => tapSlot(col.code, m)}
                    title={`${mode === 'book' ? 'Book' : 'Block'} ${minLabel(m)}`}
                    className="group absolute inset-x-0 z-0 hover:bg-accent/10"
                    style={{ top: topFor(m), height: ROW_PX }}
                  >
                    <span className="pointer-events-none absolute left-1 top-0.5 text-[8px] font-semibold tabular-nums text-dark/25 group-hover:text-accent">
                      {minLabel(m)}
                    </span>
                    <span className="pointer-events-none absolute inset-0 hidden items-center justify-center text-[9px] font-bold uppercase tracking-wide text-accent group-hover:flex">
                      {mode === 'book' ? '+ Book' : '+ Block'}
                    </span>
                  </button>
                ))}

                {/* Draft range preview */}
                {editable && draft && draft.code === col.code && (
                  <div
                    className="pointer-events-none absolute inset-x-0.5 z-[1] rounded-md border-2 border-dashed border-accent/70 bg-accent/10"
                    style={{ top: topFor(draft.startMin), height: ((draft.endMin - draft.startMin) / ROW) * ROW_PX }}
                  />
                )}

                {/* Booking draft preview — always 30 min */}
                {editable && mode === 'book' && bookDraft && bookDraft.code === col.code && (
                  <div
                    className="pointer-events-none absolute inset-x-0.5 z-[1] rounded-md border-2 border-dashed border-emerald-500/70 bg-emerald-500/10"
                    style={{ top: topFor(bookDraft.startMin), height: ROW_PX }}
                  />
                )}

                {/* Blocked / leave shading */}
                {blocksFor(col.code).map((b, i) => {
                  const isDayOff = b.endMin - b.startMin >= 1440
                  const content = (
                    <span className="flex max-w-full flex-col items-center gap-0.5 px-1 text-center">
                      <span className="rounded-full border border-dark/10 bg-white/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-dark/60 shadow-sm backdrop-blur-sm">
                        {isDayOff ? 'Day off' : 'Blocked'}
                      </span>
                      {b.reason && (
                        <span className="line-clamp-2 max-w-full break-words text-[9.5px] font-semibold leading-tight text-dark/70">
                          {b.reason}
                        </span>
                      )}
                    </span>
                  )
                  const style = {
                    top: topFor(clamp(b.startMin)),
                    height: ((clamp(b.endMin) - clamp(b.startMin)) / ROW) * ROW_PX,
                    backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 7px, rgba(18,55,45,0.05) 7px, rgba(18,55,45,0.05) 8px)',
                  }
                  return editable ? (
                    <button
                      key={`b${i}`}
                      type="button"
                      onClick={() => {
                        setErr(null)
                        setDraft(null)
                        setReason('')
                        setBlockSel({ id: b.id, name: vaidyaName(col.code), startMin: clamp(b.startMin), endMin: clamp(b.endMin) })
                        setEditReason(b.reason ?? '')
                      }}
                      disabled={pending}
                      title={`${b.reason ?? (isDayOff ? 'Day off' : 'Blocked')} — tap to edit or remove`}
                      className="absolute inset-x-0 z-[1] flex items-center justify-center bg-dark/[0.07] hover:bg-accent/10"
                      style={style}
                    >
                      {content}
                    </button>
                  ) : (
                    <div
                      key={`b${i}`}
                      className="absolute inset-x-0 z-0 flex items-center justify-center bg-dark/[0.07]"
                      style={style}
                      title={b.reason ?? (isDayOff ? 'Day off' : 'Blocked')}
                    >
                      {content}
                    </div>
                  )
                })}

                {/* Consultations */}
                {apptsFor(col.code).map((a) => (
                  <div
                    key={a.id}
                    className={`absolute inset-x-1 z-[2] rounded-md border px-1.5 py-1 text-[10.5px] leading-tight ${apptClasses(a)}`}
                    style={{ top: topFor(clamp(a.startMin)) + 1, height: Math.max(ROW_PX - 2, (a.durationMins / ROW) * ROW_PX) - 2 }}
                  >
                    <Link href={`${detailBase}/${a.id}`} className="block">
                      <div className="flex items-start justify-between gap-1">
                        <div className="truncate font-bold">{a.patientName ?? '—'}</div>
                        {a.createdByAdminId == null && (
                          <span className="inline-block h-2 w-2 flex-none rounded-full bg-yellow-400" title="Web booking" />
                        )}
                      </div>
                      <div className="truncate opacity-80">{a.treatmentName ?? 'Consultation'}</div>
                      <div className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-wide opacity-60">
                        {fmtMY(`${date}T${String(Math.floor(a.startMin / 60)).padStart(2, '0')}:${String(a.startMin % 60).padStart(2, '0')}:00+08:00`, { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </div>
                      {a.room && (
                        <div className="mt-0.5 truncate text-[9px] opacity-70" title={a.room}>
                          {a.room}
                        </div>
                      )}
                      {a.internalNotes && (
                        <div className="mt-0.5 truncate text-[9px] italic opacity-70" title={a.internalNotes}>
                          📝 {a.internalNotes}
                        </div>
                      )}
                    </Link>
                    {editable && (
                      <div className="mt-1 flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setColorPickerFor(colorPickerFor === a.id ? null : a.id) }}
                          title="Set colour tag"
                          className="flex-1 rounded border border-current/20 bg-white/60 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide hover:bg-white"
                        >
                          🎨 Tag
                        </button>
                      </div>
                    )}
                    {editable && colorPickerFor === a.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute inset-x-1 top-full z-[3] mt-1 flex flex-wrap gap-1 rounded-md border border-accent/30 bg-white p-1.5 shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={() => setColorTag(a.id, null)}
                          title="Clear (use automatic colour)"
                          className="h-5 w-5 flex-none rounded-full border-2 border-dashed border-dark/30 bg-white"
                        />
                        {STAFF_COLOR_SWATCHES.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setColorTag(a.id, s.value)}
                            title={s.label}
                            className={`h-5 w-5 flex-none rounded-full ${s.swatch} ${a.staffColorTag === s.value ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const bookInput = 'w-full rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-dark/55">
        {label}{required && <span className="text-red-600"> *</span>}
      </span>
      {children}
    </label>
  )
}
