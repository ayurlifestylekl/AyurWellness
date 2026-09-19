import type { BookingKind, BookingStatus } from '@/types/booking'

export const CLEARABLE_CONSULTATION_STATUSES: BookingStatus[] = ['checked_in', 'in_progress', 'completed']
export const ACTIVE_LINKED_TREATMENT_STATUSES: BookingStatus[] = [
  'pending',
  'scheduled',
  'awaiting_payment',
  'confirmed',
  'checked_in',
  'in_progress',
]

export function canClearConsultation(input: {
  bookingKind: BookingKind
  status: BookingStatus
  appointmentISO: string | null
  nowMs: number
}): boolean {
  if (input.bookingKind !== 'consultation' || !input.appointmentISO) return false
  if (!CLEARABLE_CONSULTATION_STATUSES.includes(input.status)) return false
  const at = new Date(input.appointmentISO).getTime()
  return Number.isFinite(at) && at <= input.nowMs
}

export function canLinkTreatmentToConsultation(input: {
  bookingKind: BookingKind
  treatmentUnlocked: boolean
  accessGranted: boolean
  consultationTreatmentId?: string | null
  requestedTreatmentId?: string | null
}): boolean {
  if (input.bookingKind !== 'consultation' || !input.treatmentUnlocked || !input.accessGranted) return false
  return !input.consultationTreatmentId || input.consultationTreatmentId === input.requestedTreatmentId
}

export function hasActiveLinkedTreatment(
  rows: ReadonlyArray<{ status: string; paymentExpiresAt: string | null }>,
  nowMs: number,
): boolean {
  return rows.some((row) => {
    if (!ACTIVE_LINKED_TREATMENT_STATUSES.includes(row.status as BookingStatus)) return false
    if (row.status !== 'awaiting_payment' || !row.paymentExpiresAt) return true
    const expiresAt = new Date(row.paymentExpiresAt).getTime()
    return !Number.isFinite(expiresAt) || expiresAt > nowMs
  })
}

export function validateLegacyParentConsultationLink(
  parentConsultationId: string | null | undefined,
): { ok: true } | { error: string } {
  return parentConsultationId == null
    ? { ok: true }
    : { error: 'Linked treatments must be booked through the secured consultation treatment flow.' }
}
