import 'server-only'
import type { ServiceDb } from './guard'
import type { BookingKind, BookingStatus } from '@/types/booking'

/** One guest on today's waiting-room board. */
export interface WaitingGuest {
  id: string
  patientName: string
  treatmentName: string | null
  bookingKind: BookingKind
  status: BookingStatus
  startsAt: string | null
  durationMins: number
  therapistCode: string | null
  therapistName: string | null
  room: string | null
  checkedInAt: string | null
  startedAt: string | null
}

export interface WaitingBoard {
  arriving: WaitingGuest[]
  waiting: WaitingGuest[]
  inTreatment: WaitingGuest[]
  doneToday: number
}

const BASE = 'id, patient_name, treatment_name, booking_kind, status, appointment_date_time, duration_mins, assigned_therapist_code, assigned_therapist_name, room, checked_in_at'

/** First name and initial only, for a screen guests can see. */
export function publicName(full: string): string {
  const parts = full.trim().split(/\s+/)
  if (parts.length < 2) return parts[0] ?? 'Guest'
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

/** Sorts today's bookings into arriving (within the hour), waiting and in treatment. */
export function sortBoard(rows: WaitingGuest[], nowMs: number): WaitingBoard {
  const soon = nowMs + 60 * 60 * 1000
  const t = (iso: string | null) => (iso ? new Date(iso).getTime() : Number.POSITIVE_INFINITY)
  return {
    arriving: rows
      .filter((r) => (r.status === 'confirmed' || r.status === 'scheduled') && t(r.startsAt) <= soon && t(r.startsAt) >= nowMs - 2 * 60 * 60 * 1000)
      .sort((a, b) => t(a.startsAt) - t(b.startsAt)),
    waiting: rows.filter((r) => r.status === 'checked_in').sort((a, b) => t(a.checkedInAt) - t(b.checkedInAt)),
    inTreatment: rows.filter((r) => r.status === 'in_progress').sort((a, b) => t(a.startedAt ?? a.startsAt) - t(b.startedAt ?? b.startsAt)),
    doneToday: rows.filter((r) => r.status === 'completed').length,
  }
}

export async function getWaitingBoard(db: ServiceDb, day: string, nowMs: number): Promise<WaitingBoard> {
  const from = new Date(`${day}T00:00:00+08:00`)
  const to = new Date(from.getTime() + 864e5)
  const query = (cols: string) =>
    db
      .from('appointments')
      .select(cols)
      .in('status', ['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed'])
      .gte('appointment_date_time', from.toISOString())
      .lt('appointment_date_time', to.toISOString())
  let res = await query(`${BASE}, started_at`)
  // started_at arrives with 20261124_front_desk_day.sql.
  if (res.error && /started_at/.test(res.error.message)) res = await query(BASE)
  if (res.error) {
    console.error('[waiting] board:', res.error.message)
    return { arriving: [], waiting: [], inTreatment: [], doneToday: 0 }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: WaitingGuest[] = ((res.data ?? []) as any[]).map((r) => ({
    id: r.id,
    patientName: r.patient_name ?? 'Guest',
    treatmentName: r.treatment_name ?? null,
    bookingKind: (r.booking_kind ?? 'treatment') as BookingKind,
    status: r.status as BookingStatus,
    startsAt: r.appointment_date_time ?? null,
    durationMins: r.duration_mins ?? 60,
    therapistCode: r.assigned_therapist_code ?? null,
    therapistName: r.assigned_therapist_name ?? null,
    room: r.room ?? null,
    checkedInAt: r.checked_in_at ?? null,
    startedAt: r.started_at ?? null,
  }))
  return sortBoard(rows, nowMs)
}
