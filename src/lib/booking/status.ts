import type { BookingStatus } from '@/types/booking'

/**
 * Allowed status transitions for the approval-gated booking flow.
 *
 * Treatment path:    pending → awaiting_payment → confirmed → …
 * Consultation path: pending → confirmed (free, no payment) → …
 */
const ALLOWED: Record<BookingStatus, BookingStatus[]> = {
  pending: ['awaiting_payment', 'confirmed', 'scheduled', 'cancelled'],
  scheduled: ['awaiting_payment', 'confirmed', 'cancelled'],
  awaiting_payment: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show', 'rescheduled'],
  checked_in: ['in_progress', 'no_show', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
  no_show: [],
  rescheduled: ['pending', 'confirmed'],
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Awaiting approval',
  scheduled: 'Scheduled',
  awaiting_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
  rescheduled: 'Rescheduled',
}
