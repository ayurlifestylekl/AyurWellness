/**
 * Pure, unit-testable policy + state functions for appointments.
 * No I/O — everything derives from the row + the current clock.
 */

import type { Database } from '@/lib/database.types'
import { REFUND_ADVANCE_MS } from '@/lib/booking/management-policy'

type AppointmentRow = Database['public']['Tables']['appointments']['Row']

const HOUR_MS = 60 * 60 * 1000
const JOIN_LEAD_MIN = 15

/**
 * @deprecated Use managementEligibility with a trusted server clock.
 */
export function canCancelInApp(startISO: string, nowMs: number = Date.now()): boolean {
  const start = new Date(startISO).getTime()
  if (Number.isNaN(start)) return false
  return start - nowMs >= REFUND_ADVANCE_MS
}

/**
 * True when the customer should see a "Join consultation" button on a
 * virtual appointment — i.e. we're between (start − 15 min) and the
 * appointment's natural end.
 */
export function isJoinableNow(
  startISO: string,
  durationMins: number,
  nowMs: number = Date.now()
): boolean {
  const start = new Date(startISO).getTime()
  if (Number.isNaN(start)) return false
  const opensAt = start - JOIN_LEAD_MIN * 60 * 1000
  const endsAt = start + durationMins * 60 * 1000
  return nowMs >= opensAt && nowMs <= endsAt
}

/** Which filter bucket an appointment belongs to on the list page. */
export type AppointmentBucket = 'upcoming' | 'today' | 'past' | 'cancelled'

export function appointmentBucket(
  row: Pick<AppointmentRow, 'appointment_date_time' | 'status'>,
  nowMs: number = Date.now()
): AppointmentBucket {
  if (row.status === 'cancelled') return 'cancelled'
  const start = new Date(row.appointment_date_time).getTime()
  if (Number.isNaN(start)) return 'past'
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfTomorrow = startOfToday.getTime() + 24 * HOUR_MS
  // Treat today's visits as "today" for one-day prominence; tomorrow+ as "upcoming".
  if (start >= startOfToday.getTime() && start < startOfTomorrow) return 'today'
  if (start >= nowMs) return 'upcoming'
  return 'past'
}

/**
 * Human-friendly relative countdown for an upcoming appointment.
 * Returns null when the appointment is in the past.
 */
export function countdownLabel(startISO: string, nowMs: number = Date.now()): string | null {
  const start = new Date(startISO).getTime()
  if (Number.isNaN(start) || start <= nowMs) return null
  const diffMs = start - nowMs
  const diffHours = diffMs / HOUR_MS
  if (diffHours < 1) {
    const mins = Math.max(1, Math.round(diffMs / 60000))
    return `In ${mins} ${mins === 1 ? 'minute' : 'minutes'}`
  }
  if (diffHours < 24) {
    const hours = Math.round(diffHours)
    return `In ${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }
  const days = Math.round(diffHours / 24)
  return `In ${days} ${days === 1 ? 'day' : 'days'}`
}
