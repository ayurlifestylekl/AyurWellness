'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { GridAppt, GridBlock } from '@/lib/staff/appointments'
import type { Therapist } from '@/lib/staff/therapist-format'
import { createBlock, deleteBlock, updateBlockReason, createBookingFromGrid, createConsultationFromGrid, setAppointmentColorTag } from '@/lib/staff/actions'
import { createGroupBooking, type GroupGuest } from '@/lib/booking/actions'
import { fmtMY } from '@/lib/datetime'
import type { Gender, StaffColorTag } from '@/types/booking'
import type { Vaidya } from '@/lib/staff/therapist-format'
import ConsoleRescheduleDialog from './ConsoleRescheduleDialog'

/** Client-requested manual palette for front desk's own slot bookkeeping. */
export const STAFF_COLOR_SWATCHES: { value: StaffColorTag; label: string; swatch: string; classes: string }[] = [
  { value: 'red', label: 'Red', swatch: 'bg-red-500', classes: 'bg-red-100 border-red-400 text-red-900' },
  { value: 'blue_light', label: 'Light blue', swatch: 'bg-sky-400', classes: 'bg-sky-100 border-sky-400 text-sky-900' },
  { value: 'blue_dark', label: 'Dark blue', swatch: 'bg-blue-700', classes: 'bg-blue-100 border-blue-500 text-blue-900' },
  { value: 'green_light', label: 'Light green', swatch: 'bg-green-400', classes: 'bg-green-100 border-green-400 text-green-900' },
  { value: 'green_dark', label: 'Dark green', swatch: 'bg-green-800', classes: 'bg-green-200 border-green-600 text-green-950' },
  { value: 'purple', label: 'Purple', swatch: 'bg-purple-500', classes: 'bg-purple-100 border-purple-400 text-purple-900' },
  { value: 'pink', label: 'Pink', swatch: 'bg-fuchsia-500', classes: 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-900' },
  { value: 'black', label: 'Black', swatch: 'bg-neutral-900', classes: 'bg-neutral-200 border-neutral-600 text-neutral-950' },
]

const GENERIC_DURATIONS = [
  { value: 30, label: 'Treatment 1 — 30 min' },
  { value: 45, label: 'Treatment 2 — 45 min' },
  { value: 60, label: 'Treatment 3 — 1 hr' },
  { value: 90, label: 'Treatment 4 — 1 hr 30 min' },
  { value: 120, label: 'Treatment 5 — 2 hrs' },
]

/** ConsoleShell's own sticky top bar is h-16 (64px) — our sticky header stacks below it. */
const SHELL_HEADER_PX = 64

const OPEN = 9 * 60 + 30   // 09:30
const CLOSE = 20 * 60 + 30 // 20:30
const ROW = 30
const ROW_PX = 46
const HEADER_PX = 40
const COL_W = 150
const totalPx = ((CLOSE - OPEN) / ROW) * ROW_PX

function shiftDay(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00+08:00`)
  d.setDate(d.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}
const topFor = (min: number) => ((min - OPEN) / ROW) * ROW_PX
const clamp = (min: number) => Math.max(OPEN, Math.min(CLOSE, min))

/** An additional guest in a front-desk group booking — each can pick their own treatment & remark, falling back to the primary guest's when left blank. */
type ExtraGuest = { name: string; gender: Gender | ''; therapistCode: string; duration: number | ''; remark: string }

interface Props {
  basePath: string // e.g. '/console/schedule' or '/doctor/calendar'
  detailBase: string // e.g. '/console' or '/doctor'
  date: string
  therapists: Therapist[]
  appts: GridAppt[]
  unassigned: GridAppt[]
  blocks: GridBlock[]
  /** Vaidya columns for displaying doctor consultations in the same grid. */
  vaidyas?: Vaidya[]
  /** Front desk / admin can add & remove blocks straight from the grid. */
  editable?: boolean
}

/**
 * Colour priority: a manually-set staff tag always wins (that's the whole
 * point of letting front desk set one). Otherwise a web-origin booking
 * renders fully in the client's requested "usual yellow." Failing both,
 * fall back to the automatic status colour.
 */
export function apptClasses(a: GridAppt): string {
  if (a.staffColorTag) {
    return STAFF_COLOR_SWATCHES.find((s) => s.value === a.staffColorTag)?.classes ?? 'bg-white border-accent/30 text-dark'
  }
  const isWeb = a.createdByAdminId == null
  if (isWeb) return 'bg-yellow-100 border-yellow-400 text-yellow-900'
  const base: Record<string, string> = {
    pending: 'bg-rose-100 border-rose-300 text-rose-900',
    scheduled: 'bg-sky-100 border-sky-300 text-sky-900',
    awaiting_payment: 'bg-amber-100 border-amber-300 text-amber-900',
    confirmed: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    checked_in: 'bg-pink-100 border-pink-300 text-pink-900',
    in_progress: 'bg-violet-100 border-violet-300 text-violet-900',
    completed: 'bg-slate-100 border-slate-300 text-slate-500',
  }
  return base[a.status] ?? 'bg-white border-accent/30 text-dark'
}

const SLOTS: number[] = []
for (let m = OPEN; m < CLOSE; m += ROW) SLOTS.push(m)

export default function ScheduleGrid({ basePath, detailBase, date, therapists, appts, unassigned, blocks, vaidyas = [], editable = false }: Props) {
  const router = useRouter()
  const go = (d: string) => router.push(`${basePath}?date=${d}`)

  const [mode, setMode] = useState<'book' | 'block'>('book')

  // Height of the sticky mode/legend bar, measured live so the grid's frozen
  // header row (therapist names) can sit flush beneath it however tall it
  // renders (legend wraps to 2 lines on narrow screens, hint text varies, etc).
  const [stickyBarH, setStickyBarH] = useState(0)
  const stickyBarRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = stickyBarRef.current
    if (!editable || !el) { setStickyBarH(0); return }
    const ro = new ResizeObserver(([entry]) => setStickyBarH(entry.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [editable])

  // The frozen header row lives in its own overflow-hidden strip (sticky
  // doesn't engage inside the body's overflow-x-auto — see below), so its
  // horizontal scroll is driven programmatically from the body's real scroll.
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)
  const syncHeaderScroll = () => {
    if (headerScrollRef.current && bodyScrollRef.current) {
      headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft
    }
  }

  // Quick-block draft: a therapist column + a slot RANGE. Tapping more free
  // slots in the same column extends the range, so several slots block together.
  const [draft, setDraft] = useState<{ code: string; startMin: number; endMin: number } | null>(null)
  const [reason, setReason] = useState('')
  // An existing block the user tapped — offers Remove / Edit-reason.
  const [blockSel, setBlockSel] = useState<{ id: string | null; name: string; startMin: number; endMin: number } | null>(null)
  const [editReason, setEditReason] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()

  // Booking draft from the grid.
  const [bookDraft, setBookDraft] = useState<{ code: string; startMin: number } | null>(null)
  const [bookName, setBookName] = useState('')
  const [bookPhone, setBookPhone] = useState('')
  const [bookEmail, setBookEmail] = useState('')
  const [bookGender, setBookGender] = useState<Gender | ''>('')
  const [bookDuration, setBookDuration] = useState<number | ''>('')
  const [bookRemark, setBookRemark] = useState('')
  const [bookPartySize, setBookPartySize] = useState(1)
  const [bookExtraGuests, setBookExtraGuests] = useState<ExtraGuest[]>([])

  // Reschedule dialog.
  const [rescheduleAppt, setRescheduleAppt] = useState<GridAppt | null>(null)

  // Manual colour-tag picker — which appointment's swatch row is open.
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null)
  const setColorTag = (appointmentId: string, tag: StaffColorTag | null) => {
    setColorPickerFor(null)
    start(async () => {
      const res = await setAppointmentColorTag(appointmentId, tag)
      if ('error' in res) {
        setErr(res.error)
      } else {
        setErr(null)
      }
      router.refresh()
    })
  }

  const allAppts = useMemo(() => [...appts, ...unassigned], [appts, unassigned])
  const groupCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of allAppts) {
      if (!a.groupId) continue
      counts.set(a.groupId, (counts.get(a.groupId) ?? 0) + 1)
    }
    return counts
  }, [allAppts])

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
      return { code, startMin: m, endMin: m + ROW } // tap inside the range → restart there
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
    setBookGender('')
    setBookDuration('')
    setBookRemark('')
    setBookPartySize(1)
    setBookExtraGuests([])
  }

  const addBooking = () => {
    if (!bookDraft) return
    if (!bookName.trim()) { setErr('Enter the patient name.'); return }
    setErr(null)
    start(async () => {
      if (vaidyaCodes.has(bookDraft.code)) {
        const res = await createConsultationFromGrid({
          vaidyaCode: bookDraft.code,
          startAt: isoAt(bookDraft.startMin),
          patientName: bookName.trim(),
          patientPhone: bookPhone.trim() || null,
          patientEmail: bookEmail.trim() || null,
          reason: bookRemark.trim() || null,
        })
        if ('error' in res) setErr(res.error)
        else { resetBookDraft(); router.refresh() }
        return
      }
      if (!bookGender) { setErr('Select a gender.'); return }
      if (bookPartySize > 1) {
        const extras = bookExtraGuests.filter((g) => g.name.trim() && g.gender)
        if (extras.length !== bookPartySize - 1) { setErr('Enter name and gender for every additional guest.'); return }
        const when = isoAt(bookDraft.startMin)
        const healthIntake = bookRemark.trim() ? { notes: bookRemark.trim() } : {}
        const guests: GroupGuest[] = [
          { name: bookName.trim(), gender: bookGender as Gender, preferredAt: when, assignedTherapistCode: bookDraft.code, healthIntake },
          ...extras.map((g) => ({
            name: g.name.trim(),
            gender: g.gender as Gender,
            preferredAt: when,
            assignedTherapistCode: g.therapistCode.trim() || null,
            durationMins: g.duration ? Number(g.duration) : null,
            treatmentName: g.duration ? GENERIC_DURATIONS.find((d) => d.value === Number(g.duration))?.label ?? null : null,
            healthIntake: g.remark.trim() ? { notes: g.remark.trim() } : {},
          })),
        ]
        const res = await createGroupBooking({
          durationMins: bookDuration ? Number(bookDuration) : 60,
          treatmentName: bookDuration ? GENERIC_DURATIONS.find((d) => d.value === Number(bookDuration))?.label ?? null : null,
          patientPhone: bookPhone.trim() || null,
          patientEmail: bookEmail.trim() || null,
          isGuest: true,
          acceptedPolicies: true,
          guests,
        })
        if ('error' in res) setErr(res.error)
        else { resetBookDraft(); router.refresh() }
        return
      }
      const selectedDuration = bookDuration ? Number(bookDuration) : 60
      const res = await createBookingFromGrid({
        therapistCode: bookDraft.code,
        startAt: isoAt(bookDraft.startMin),
        patientName: bookName.trim(),
        patientGender: bookGender,
        patientPhone: bookPhone.trim() || null,
        patientEmail: bookEmail.trim() || null,
        durationMins: selectedDuration,
        treatmentName: bookDuration ? GENERIC_DURATIONS.find((d) => d.value === Number(bookDuration))?.label ?? null : null,
        remark: bookRemark.trim() || null,
      })
      if ('error' in res) setErr(res.error)
      else { resetBookDraft(); router.refresh() }
    })
  }

  const therapistName = (code: string) => {
    const therapist = therapists.find((t) => t.code === code)
    if (therapist) return therapist.name
    const vaidya = vaidyas.find((v) => v.code === code)
    return vaidya?.name ?? code
  }

  const vaidyaCodes = useMemo(() => new Set(vaidyas.map((v) => v.code)), [vaidyas])

  const hourLabels: number[] = []
  for (let m = Math.ceil(OPEN / 60) * 60; m <= CLOSE; m += 60) hourLabels.push(m)

  const columns: { code: string | null; name: string }[] = [
    ...(unassigned.length ? [{ code: null as string | null, name: 'Unassigned' }] : []),
    ...therapists.map((t) => ({ code: t.code as string | null, name: t.name })),
    ...vaidyas.map((v) => ({ code: v.code as string | null, name: v.name })),
  ]
  const apptsFor = (code: string | null) =>
    code === null ? unassigned : appts.filter((a) => a.therapistCode === code)
  const blocksFor = (code: string | null) =>
    blocks.filter((b) => b.therapistCode === null || b.therapistCode === code)

  return (
    <div>
      {/* Date nav */}
      <div className="mb-4 flex items-center gap-3">
        <Link href={`${basePath}?date=${shiftDay(date, -1)}`} className="rounded-lg border border-accent/30 p-1.5 text-dark/60 hover:text-primary">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && go(e.target.value)}
          className="rounded-lg border border-accent/30 bg-white px-3 py-1.5 font-body text-[13px] text-dark focus:border-accent focus:outline-none"
        />
        <Link href={`${basePath}?date=${shiftDay(date, 1)}`} className="rounded-lg border border-accent/30 p-1.5 text-dark/60 hover:text-primary">
          <ChevronRight className="h-4 w-4" />
        </Link>
        <span className="font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-dark/55">
          {fmtMY(`${date}T12:00:00+08:00`, { weekday: 'long', day: 'numeric', month: 'long' })}
          <span className="ml-2 text-accent">{appts.length + unassigned.length} appts</span>
        </span>
      </div>

      {editable && (
        <div ref={stickyBarRef} className="sticky z-30 mb-3 space-y-2 border-b border-accent/15 bg-cream pb-3 pt-1" style={{ top: SHELL_HEADER_PX }}>
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
                {m === 'book' ? 'Book appointment' : 'Block slots'}
              </button>
            ))}
            <span className="ml-auto font-body text-[11.5px] italic text-dark/50">
              {mode === 'book'
                ? 'Tap a free slot to book it · tap an appointment to reschedule it.'
                : 'Tap a free slot to start a block. Tap more slots to extend it · tap a block to edit or remove it.'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-body text-[11px] text-dark/70">
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
        </div>
      )}

      {editable && (
        <div className="mb-3 space-y-3">
          {mode === 'book' && bookDraft ? (
            <div className="rounded-xl border border-accent/40 bg-cream/60 p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                  Book {therapistName(bookDraft.code)} · {minLabel(bookDraft.startMin)}
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
                {!vaidyaCodes.has(bookDraft.code) && (
                  <>
                    <Field label="Gender" required>
                      <select value={bookGender} onChange={(e) => setBookGender(e.target.value as Gender)} className={bookInput} required>
                        <option value="">Select…</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                      </select>
                    </Field>
                    <Field label="Party size">
                      <select
                        value={bookPartySize}
                        onChange={(e) => {
                          const n = Number(e.target.value)
                          setBookPartySize(n)
                          setBookExtraGuests(Array.from({ length: Math.max(0, n - 1) }, () => ({ name: '', gender: '' as Gender | '', therapistCode: '', duration: '' as number | '', remark: '' })))
                        }}
                        className={bookInput}
                      >
                        {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>)}
                      </select>
                    </Field>
                    <Field label={bookPartySize === 1 ? 'Duration (optional)' : 'Treatment'}>
                      <select value={bookDuration} onChange={(e) => setBookDuration(e.target.value ? Number(e.target.value) : '')} className={bookInput}>
                        <option value="">Select…</option>
                        {GENERIC_DURATIONS.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </Field>
                  </>
                )}
                <Field label="Remark (optional)">
                  <input value={bookRemark} onChange={(e) => setBookRemark(e.target.value)} className={bookInput} placeholder="e.g. Room 2" />
                </Field>
              </div>

              {!vaidyaCodes.has(bookDraft.code) && bookPartySize > 1 && (
                <div className="mt-3 space-y-3 rounded-lg border border-accent/20 bg-cream/40 p-3">
                  <p className="font-heading text-[10px] font-bold uppercase tracking-[0.12em] text-dark/60">Additional guests</p>
                  {bookExtraGuests.map((g, i) => (
                    <div key={i} className="grid gap-3 sm:grid-cols-3">
                      <Field label={`Guest ${i + 2} name`}><input value={g.name} onChange={(e) => setBookExtraGuests((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className={bookInput} /></Field>
                      <Field label={`Guest ${i + 2} gender`}>
                        <select value={g.gender} onChange={(e) => setBookExtraGuests((prev) => prev.map((x, j) => j === i ? { ...x, gender: e.target.value as Gender } : x))} className={bookInput}>
                          <option value="">Select…</option>
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                        </select>
                      </Field>
                      <Field label={`Guest ${i + 2} therapist`}>
                        <select value={g.therapistCode} onChange={(e) => setBookExtraGuests((prev) => prev.map((x, j) => j === i ? { ...x, therapistCode: e.target.value } : x))} className={bookInput}>
                          <option value="">Auto / later</option>
                          {therapists.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
                        </select>
                      </Field>
                      <Field label={`Guest ${i + 2} treatment (optional)`}>
                        <select value={g.duration} onChange={(e) => setBookExtraGuests((prev) => prev.map((x, j) => j === i ? { ...x, duration: e.target.value ? Number(e.target.value) : '' } : x))} className={bookInput}>
                          <option value="">Same as guest 1</option>
                          {GENERIC_DURATIONS.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label={`Guest ${i + 2} remark (optional)`}>
                        <input value={g.remark} onChange={(e) => setBookExtraGuests((prev) => prev.map((x, j) => j === i ? { ...x, remark: e.target.value } : x))} className={bookInput} placeholder="e.g. Room 3" />
                      </Field>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={addBooking} disabled={pending} className="mt-3 rounded-xl bg-accent px-5 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-accent/90 disabled:opacity-60">
                {pending ? 'Booking…' : 'Confirm booking'}
              </button>
            </div>
          ) : mode === 'block' && draft ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-accent/40 bg-cream/60 p-3">
              <span className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                Block {therapistName(draft.code)} · {minLabel(draft.startMin)} –
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

      {/* Frozen header row (therapist names). `position: sticky` cannot be used
          on descendants of the overflow-x-auto body below — a horizontally
          scrollable ancestor's overflow-y also computes to 'auto', so a sticky
          child binds to THAT box's own (permanently zero) scrollTop instead of
          the page's, and never actually sticks. This row lives outside that
          ancestor and is kept horizontally in sync with the body via scrollLeft. */}
      <div
        ref={headerScrollRef}
        className="sticky z-20 overflow-hidden rounded-t-xl border border-b-0 border-accent/20 bg-white"
        style={{ top: SHELL_HEADER_PX + stickyBarH }}
      >
        <div className="flex min-w-full">
          <div className="sticky left-0 z-10 flex-none border-b border-accent/20 bg-white" style={{ width: 64, height: HEADER_PX }} />
          {columns.map((col) => (
            // The Unassigned column is the backstop for paid bookings nobody
            // has picked a therapist for yet — it must read as an alert.
            <div
              key={col.code ?? 'wait'}
              style={{ width: COL_W, height: HEADER_PX }}
              className={`flex flex-none items-center justify-center border-b border-l border-accent/20 px-2 text-center font-heading text-[11px] font-bold uppercase tracking-[0.1em] ${
                col.code === null ? 'bg-red-100 text-red-800' : 'bg-cream text-primary'
              }`}
            >
              {col.code === null && <span aria-hidden className="mr-1.5 inline-block h-2 w-2 flex-none animate-pulse rounded-full bg-red-500" />}
              {col.name}
            </div>
          ))}
        </div>
      </div>

      <div ref={bodyScrollRef} onScroll={syncHeaderScroll} className="overflow-x-auto rounded-b-xl border border-accent/20 bg-white">
        <div className="flex min-w-full">
          {/* Time gutter */}
          <div className="sticky left-0 z-10 flex-none bg-white" style={{ width: 64 }}>
            <div className="relative" style={{ height: totalPx }}>
              {hourLabels.map((m) => (
                <div key={m} className="absolute right-2 -translate-y-1/2 whitespace-nowrap font-heading text-[10.5px] font-semibold tabular-nums text-dark/55" style={{ top: topFor(m) }}>
                  {fmtMY(`${date}T${String(Math.floor(m / 60)).padStart(2, '0')}:00:00+08:00`, { hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>
              ))}
            </div>
          </div>

          {/* Columns */}
          {columns.map((col) => (
            <div key={col.code ?? 'wait'} className="flex-none border-l border-accent/15" style={{ width: COL_W }}>
              <div
                className="relative"
                style={{
                  height: totalPx,
                  backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent ${ROW_PX - 1}px, rgba(0,107,60,0.06) ${ROW_PX - 1}px, rgba(0,107,60,0.06) ${ROW_PX}px)`,
                }}
              >
                {/* Click-to-book / click-to-block overlay (front desk / admin, therapist columns only) */}
                {editable && col.code && SLOTS.map((m) => (
                  <button
                    key={`s${m}`}
                    type="button"
                    onClick={() => tapSlot(col.code as string, m)}
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

                {/* Draft range preview — shows exactly what will be blocked */}
                {editable && draft && draft.code === col.code && (
                  <div
                    className="pointer-events-none absolute inset-x-0.5 z-[1] rounded-md border-2 border-dashed border-accent/70 bg-accent/10"
                    style={{ top: topFor(draft.startMin), height: ((draft.endMin - draft.startMin) / ROW) * ROW_PX }}
                  />
                )}

                {/* Booking draft preview — sized by selected duration */}
                {editable && mode === 'book' && bookDraft && bookDraft.code === col.code && (
                  <div
                    className="pointer-events-none absolute inset-x-0.5 z-[1] rounded-md border-2 border-dashed border-emerald-500/70 bg-emerald-500/10"
                    style={{
                      top: topFor(bookDraft.startMin),
                      height: ((() => {
                        const dmins = bookDuration ? Number(bookDuration) : 60
                        return (dmins / ROW) * ROW_PX
                      })()),
                    }}
                  />
                )}

                {/* Blocked / leave shading — removable when editable */}
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
                        setBlockSel({ id: b.id, name: col.code ? therapistName(col.code) : 'Centre', startMin: clamp(b.startMin), endMin: clamp(b.endMin) })
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
                {/* Appointments */}
                {apptsFor(col.code).map((a) => {
                  const groupSize = a.groupId ? groupCounts.get(a.groupId) ?? 1 : 1
                  const groupBadge = groupSize > 1 ? `+${groupSize - 1}` : null
                  return (
                    <div
                      key={a.id}
                      className={`absolute inset-x-1 z-[2] rounded-md border px-1.5 py-1 text-[10.5px] leading-tight ${apptClasses(a)}`}
                      style={{ top: topFor(clamp(a.startMin)) + 1, height: Math.max(ROW_PX - 2, (a.durationMins / ROW) * ROW_PX) - 2 }}
                    >
                      <Link href={`${detailBase}/${a.id}`} className="block">
                        <div className="flex items-start justify-between gap-1">
                          <div className="truncate font-bold">{a.patientName ?? '—'}</div>
                          <div className="flex flex-none gap-1">
                            {a.createdByAdminId == null && (
                              <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" title="Web booking" />
                            )}
                            {groupBadge && (
                              <span className="rounded-full bg-primary px-1 py-0 text-[8px] font-bold text-white">{groupBadge}</span>
                            )}
                          </div>
                        </div>
                        <div className="truncate opacity-80">{a.treatmentName ?? ''}</div>
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
                            onClick={(e) => { e.stopPropagation(); setRescheduleAppt(a) }}
                            className="flex-1 rounded border border-current/20 bg-white/60 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide hover:bg-white"
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setColorPickerFor(colorPickerFor === a.id ? null : a.id) }}
                            title="Set colour tag"
                            className="flex-none rounded border border-current/20 bg-white/60 px-1.5 py-0.5 hover:bg-white"
                          >
                            🎨
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
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {rescheduleAppt && (
        <ConsoleRescheduleDialog
          appt={rescheduleAppt}
          date={date}
          therapists={therapists}
          onClose={() => setRescheduleAppt(null)}
          onSuccess={() => { setRescheduleAppt(null); router.refresh() }}
        />
      )}
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
