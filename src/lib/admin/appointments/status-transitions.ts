export type AppointmentStatus =
  | 'pending'
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled'

const TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  pending:     ['scheduled', 'confirmed', 'cancelled'],
  scheduled:   ['confirmed', 'checked_in', 'rescheduled', 'cancelled', 'no_show'],
  confirmed:   ['checked_in', 'rescheduled', 'cancelled', 'no_show'],
  checked_in:  ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed:   [],
  cancelled:   [],
  no_show:     [],
  rescheduled: [],
} as const

export function canTransitionAppointment(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  return TRANSITIONS[from].includes(to)
}

export function nextAppointmentStatuses(
  from: AppointmentStatus,
): readonly AppointmentStatus[] {
  return TRANSITIONS[from]
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending:     'Pending',
  scheduled:   'Scheduled',
  confirmed:   'Confirmed',
  checked_in:  'Checked in',
  in_progress: 'In progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  no_show:     'No-show',
  rescheduled: 'Rescheduled',
}
