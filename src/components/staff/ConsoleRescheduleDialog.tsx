'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { X } from 'lucide-react'
import type { GridAppt } from '@/lib/staff/appointments'
import type { Therapist } from '@/lib/staff/therapist-format'
import { rescheduleFromGrid, deleteBooking, getAppointmentTiming } from '@/lib/staff/actions'
import { fmtMY, mytDayKey, mytTimeOfDay } from '@/lib/datetime'
import { therapistLabel } from '@/lib/staff/therapist-format'

const DURATION_OPTIONS = [30, 45, 60, 90, 120]

const OPEN = 9 * 60 + 30
const CLOSE = 20 * 60 + 30
const ROW = 30

function shiftDay(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00+08:00`)
  d.setDate(d.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

// Formats against a real, modern date rather than a fixed dummy date — pre-1982
// Peninsular Malaysia used UTC+7:30, not +8, so a placeholder date like
// 1970-01-01 gets converted by the browser's historical timezone rules and
// silently renders 30 minutes behind the actual value it's labeling.
function minLabel(dateStr: string, min: number) {
  const hh = String(Math.floor(min / 60)).padStart(2, '0')
  const mm = String(min % 60).padStart(2, '0')
  return fmtMY(`${dateStr}T${hh}:${mm}:00+08:00`, { hour: 'numeric', minute: '2-digit', hour12: true })
}

const SLOTS: number[] = []
for (let m = OPEN; m < CLOSE; m += ROW) SLOTS.push(m)

interface Props {
  appt: GridAppt
  date: string
  therapists: Therapist[]
  onClose: () => void
  onSuccess: () => void
}

export default function ConsoleRescheduleDialog({ appt, date, therapists, onClose, onSuccess }: Props) {
  const [newDate, setNewDate] = useState(date)
  const [newTimeMin, setNewTimeMin] = useState<number>(appt.startMin)
  const [patientName, setPatientName] = useState(appt.patientName ?? '')
  const [durationMins, setDurationMins] = useState(appt.durationMins)
  const [therapistCode, setTherapistCode] = useState<string>(appt.therapistCode ?? '')
  const [room, setRoom] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [refreshedStartMin, setRefreshedStartMin] = useState<number | null>(null)
  // True once the user has touched date/time/name/duration themselves — after
  // that, the background fresh-fetch below must never overwrite their choice.
  const userEdited = useRef(false)

  // The grid this dialog opened from is a client-side snapshot that can go
  // stale — the grid only re-polls every 20s, and a customer's own
  // self-service edit can land in that gap. Fetch this appointment's actual
  // current time/name/duration fresh the moment the dialog opens, so the
  // subtitle and the "New date/time" defaults never disagree with the DB.
  // Guarded by userEdited so a slow fetch can never clobber a selection the
  // user already made while it was in flight.
  useEffect(() => {
    let cancelled = false
    getAppointmentTiming(appt.id).then((fresh) => {
      if (cancelled || !fresh) return
      const freshDate = mytDayKey(fresh.startISO)
      const [hh, mm] = mytTimeOfDay(fresh.startISO).split(':').map(Number)
      const freshMin = hh * 60 + mm
      setRefreshedStartMin(freshMin)
      if (userEdited.current) return
      setNewDate(freshDate)
      setNewTimeMin(freshMin)
      setDurationMins(fresh.durationMins)
      if (fresh.patientName) setPatientName(fresh.patientName)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appt.id])

  // Ensure the current appointment time is always a selectable option, even
  // if it was created off the 30-minute grid. Without this the controlled
  // <select> has no matching <option> and silently falls back to the first
  // grid slot while state still holds the original (off-grid) value.
  const timeOptions = useMemo(() => {
    const current = refreshedStartMin ?? appt.startMin
    if (SLOTS.includes(current)) return SLOTS
    return [...SLOTS, current].sort((a, b) => a - b)
  }, [appt.startMin, refreshedStartMin])

  // Lock body scroll while the dialog is open.
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [])

  const startAt = useMemo(() => {
    const hh = String(Math.floor(newTimeMin / 60)).padStart(2, '0')
    const mm = String(newTimeMin % 60).padStart(2, '0')
    return new Date(`${newDate}T${hh}:${mm}:00+08:00`).toISOString()
  }, [newDate, newTimeMin])

  const submit = () => {
    if (pending) return
    setError(null)
    start(async () => {
      const res = await rescheduleFromGrid({
        appointmentId: appt.id,
        newStartAt: startAt,
        newTherapistCode: therapistCode || null,
        newPatientName: patientName || null,
        newDurationMins: durationMins || null,
        room: room || null,
      })
      if ('error' in res) {
        setError(res.error)
      } else {
        onSuccess()
      }
    })
  }

  const handleDelete = () => {
    if (pending) return
    if (!confirm('Delete this appointment permanently? This cannot be undone.')) return
    setError(null)
    start(async () => {
      const res = await deleteBooking(appt.id)
      if ('error' in res) {
        setError(res.error)
      } else {
        onSuccess()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-[15px] font-bold text-primary">Reschedule appointment</h3>
          <button onClick={onClose} className="rounded-lg border border-accent/30 p-1.5 text-dark/60 hover:text-primary" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 font-body text-[13px] text-dark/70">
          {appt.treatmentName ?? 'Treatment'}
          <br />
          <span className="text-dark/55">
            {fmtMY(`${newDate}T${String(Math.floor(newTimeMin / 60)).padStart(2, '0')}:${String(newTimeMin % 60).padStart(2, '0')}:00+08:00`, { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        </p>

        <div className="space-y-3">
          <Field label="Patient name">
            <input value={patientName} onChange={(e) => { userEdited.current = true; setPatientName(e.target.value) }} className={inp} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="New date">
              <input
                type="date"
                value={newDate}
                min={shiftDay(new Date().toISOString().slice(0, 10), 0)}
                onChange={(e) => { if (e.target.value) { userEdited.current = true; setNewDate(e.target.value) } }}
                className={inp}
              />
            </Field>
            <Field label="New time">
              <select value={newTimeMin} onChange={(e) => { userEdited.current = true; setNewTimeMin(Number(e.target.value)) }} className={inp}>
                {timeOptions.map((m) => (
                  <option key={m} value={m}>{minLabel(newDate, m)}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Therapist">
              <select value={therapistCode} onChange={(e) => setTherapistCode(e.target.value)} className={inp}>
                <option value={appt.therapistCode ?? ''}>Keep current</option>
                {therapists.map((t) => (
                  <option key={t.code} value={t.code}>{therapistLabel(t)}</option>
                ))}
              </select>
            </Field>
            <Field label="Duration">
              <select value={durationMins} onChange={(e) => { userEdited.current = true; setDurationMins(Number(e.target.value)) }} className={inp}>
                {(DURATION_OPTIONS.includes(durationMins) ? DURATION_OPTIONS : [...DURATION_OPTIONS, durationMins].sort((a, b) => a - b)).map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Remark (optional)">
            <input value={room} onChange={(e) => setRoom(e.target.value)} className={inp} placeholder="e.g. Room 2" />
          </Field>
        </div>

        {error && <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 font-body text-[12px] text-red-700">{error}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={onClose} className="rounded-xl border border-accent/30 px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-dark/70 hover:bg-cream">Cancel</button>
          <button onClick={handleDelete} disabled={pending} className="rounded-xl border border-red-300 px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-60">
            {pending ? 'Deleting…' : 'Delete'}
          </button>
          <button onClick={submit} disabled={pending} className="rounded-xl bg-accent px-5 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-accent/90 disabled:opacity-60">
            {pending ? 'Rescheduling…' : 'Reschedule'}
          </button>
        </div>
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
