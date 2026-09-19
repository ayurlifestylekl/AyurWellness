import type { BookingKind, BookingRequestInput } from '@/types/booking'
import { CONSULTATION_MINS } from './slots'

export const GENERIC_INSTANT_ERROR = 'We couldn’t complete your booking right now. Please try again.'
export const SLOT_TAKEN_ERROR = 'That slot was just taken — please pick another time.'
export const ACTIVE_LINKED_TREATMENT_ERROR = 'A treatment booking is already active for this consultation.'

type SubmittedGroupGuest = {
  name?: unknown
  gender?: unknown
  preferredAt?: unknown
  age?: unknown
  treatmentId?: unknown
} | null

export function validateInstantGroupGuests(
  guests: readonly SubmittedGroupGuest[] | null | undefined,
): { ok: true } | { error: string } {
  if (!Array.isArray(guests) || guests.length < 2) {
    return { error: 'Add at least two guests (with name and gender) for a group booking.' }
  }
  if (guests.length > 6) return { error: 'Up to 6 guests per group booking.' }
  if (guests.some((g) => !g || typeof g.name !== 'string' || !g.name.trim() || (g.gender !== 'male' && g.gender !== 'female'))) {
    return { error: 'Please complete the name and gender for every guest.' }
  }
  if (guests.some((g) => !g || typeof g.preferredAt !== 'string' || !Number.isFinite(new Date(g.preferredAt).getTime()))) {
    return { error: 'Please choose a date and time for every guest.' }
  }
  if (guests.some((g) => g && g.age != null && (typeof g.age !== 'number' || !Number.isFinite(g.age) || g.age < 0))) {
    return { error: 'Please enter a valid age for every guest.' }
  }
  if (guests.some((g) => g && g.treatmentId != null && typeof g.treatmentId !== 'string')) {
    return { error: 'Please choose a valid treatment for every guest.' }
  }
  return { ok: true }
}

export function patientGenderError(kind: BookingKind): string {
  return kind === 'consultation'
    ? 'Please select the patient’s gender.'
    : 'Please select a gender for therapist matching.'
}

export function canonicalInstantTiming(input: {
  kind: BookingKind
  preferredAt: string
  durationMins: number
}) {
  return {
    appointmentDatetime: input.preferredAt,
    durationMins: input.kind === 'consultation' ? CONSULTATION_MINS : input.durationMins,
    requestedDatetime: input.preferredAt,
    requestedDatetimeAlt: null,
  }
}

function failureMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) return String(error.message)
  return ''
}

export function publicInstantFailure(error: unknown): string {
  const message = failureMessage(error)
  if (message.includes('SLOT_FULL')) return SLOT_TAKEN_ERROR
  if (message.includes('ACTIVE_LINKED_TREATMENT_EXISTS')) return ACTIVE_LINKED_TREATMENT_ERROR
  return GENERIC_INSTANT_ERROR
}

type InstantSubmissionResult = { id: string; token: string; holdExpiresAt?: string } | { error: string }

export async function submitInstantSingleBooking(
  input: BookingRequestInput,
  actions: {
    createTreatment: (input: BookingRequestInput) => Promise<InstantSubmissionResult>
    createConsultation: (input: BookingRequestInput) => Promise<InstantSubmissionResult>
  },
): Promise<InstantSubmissionResult> {
  return input.bookingKind === 'consultation'
    ? actions.createConsultation(input)
    : actions.createTreatment(input)
}

export function instantBookingSuccessPath(result: { id: string; token: string }): string {
  return `/book/request/${encodeURIComponent(result.id)}?t=${encodeURIComponent(result.token)}`
}

export function resolveRequestedConsultationTreatment<T>(input: {
  requested: boolean
  data: T | null
  error: unknown
}): { value: T | null } | { error: string } {
  if (input.error) return { error: publicInstantFailure(input.error) }
  if (input.requested && !input.data) return { error: 'Treatment not found.' }
  return { value: input.data }
}
