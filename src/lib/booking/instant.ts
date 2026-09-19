'use server'

/**
 * Instant booking — the "hotel booking" path. A customer picks a treatment +
 * slot and pays immediately; there is no staff review before payment. This is
 * an ADDITIONAL path alongside the existing pending → staff-approval flow in
 * `actions.ts` (kept untouched, for phone/walk-in bookings staff create on a
 * customer's behalf) — not a replacement of it.
 *
 * Race-safety: the browse-time slot list (`getAvailableSlots*` in actions.ts)
 * is only an estimate. The actual reservation happens here, inside
 * `claim_instant_slots` (supabase/migrations/20260716_instant_booking_claim.sql),
 * a Postgres function that takes an advisory lock per resource+day and
 * atomically re-checks capacity before inserting — closing the race where two
 * customers both read "available" for the literal last slot.
 */

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSb } from '@supabase/supabase-js'
import type { BookingRequestInput } from '@/types/booking'
import { genderRequirementValue } from './policy'
import { createBookingToken } from './token'
import { notifyConfirmed, BOOKING_SITE_URL } from './notify'
import { parseDurationMins } from './duration'
import { effectiveGenderCapacity, findFreeVaidya } from './actions'
import type { GroupGuest } from './actions'
import { CONSULTATION_MINS, validateSubmittedSlot } from './slots'
import { canAccessBooking } from './access'
import {
  ACTIVE_LINKED_TREATMENT_STATUSES,
  canLinkTreatmentToConsultation,
  hasActiveLinkedTreatment,
} from './consultation-rules'
import {
  ACTIVE_LINKED_TREATMENT_ERROR,
  canonicalInstantTiming,
  patientGenderError,
  publicInstantFailure,
  resolveRequestedConsultationTreatment,
  validateInstantGroupGuests,
} from './instant-rules'

function admin() {
  return createSb(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/** Minutes a checkout hold stays reserved before the slot is released. */
const CHECKOUT_HOLD_MINS = 20
type Claim = {
  resourceType: 'gender' | 'consultation'
  resourceKey: string
  capacity: number
  row: Record<string, unknown>
}

async function runClaims(sb: ReturnType<typeof admin>, claims: Claim[]): Promise<{ ids: string[] } | { error: string }> {
  const { data, error } = await sb.rpc('claim_instant_slots', { p_claims: claims })
  if (error) {
    console.error('[instant-booking] slot claim failed:', error)
    return { error: publicInstantFailure(error) }
  }
  return { ids: (data ?? []) as string[] }
}

export type InstantBookingResult = { id: string; token: string; holdExpiresAt: string } | { error: string }

/**
 * Create a treatment booking that goes straight to `awaiting_payment` with a
 * short checkout hold — no staff review. The customer must complete payment
 * within `CHECKOUT_HOLD_MINS` or the hold is released (sweepExpiredBookings).
 */
export async function createInstantTreatmentBooking(input: BookingRequestInput): Promise<InstantBookingResult> {
  if (!input.acceptedPolicies) return { error: 'Please accept the booking policies to continue.' }
  if (!input.patientName?.trim()) return { error: 'Please enter the patient name.' }
  if (!input.patientPhone?.trim()) return { error: 'Please enter a contact number.' }
  if (!input.patientEmail?.trim()) return { error: 'Please enter an email so we can send booking updates.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.patientEmail.trim())) return { error: 'Please enter a valid email address.' }
  if (!input.preferredAt) return { error: 'Please choose a preferred date and time.' }
  if (input.patientGender !== 'male' && input.patientGender !== 'female') {
    return { error: patientGenderError('treatment') }
  }
  if (!input.treatmentId) return { error: 'Please choose a treatment.' }

  const sb = admin()
  const { data: t, error: tErr } = await sb
    .from('treatments')
    .select('id, title, price_rm, booking_type, category_id, duration, requires_consultation, booking_lead_time_hours, requires_scalp_disclaimer, requires_health_intake, minimum_age, special_tags')
    .eq('id', input.treatmentId)
    .maybeSingle()
  if (tErr) {
    console.error('[instant-booking] treatment lookup failed:', tErr)
    return { error: publicInstantFailure(tErr) }
  }
  if (!t) return { error: 'Treatment not found.' }
  if (t.booking_type === 'enquiry') {
    return { error: 'This therapy is enquiry-only — please WhatsApp us to arrange it.' }
  }

  if (t.minimum_age != null && (input.age == null || input.age < t.minimum_age)) {
    return { error: `This therapy is only bookable for ages ${t.minimum_age} and above. Please WhatsApp us to discuss options for younger guests.` }
  }
  const health = input.healthIntake ?? {}
  if (t.requires_scalp_disclaimer && !health.noDandruffScalpIssues) {
    return { error: 'Please confirm you do not have dandruff or scalp issues, or WhatsApp us to discuss a suitable therapy.' }
  }
  if (t.requires_health_intake) {
    const tags = Array.isArray(t.special_tags) ? t.special_tags : []
    if (tags.includes('oldage') && !health.noSurgeryWoundSkinLesions) {
      return { error: 'Please confirm no recent surgery, open wounds or skin lesions, or WhatsApp us before booking.' }
    }
    if (tags.includes('kids') && !health.noFeverColdFlu) {
      return { error: 'Please confirm the child does not have fever, cold or flu, or WhatsApp us before booking.' }
    }
  }

  // A treatment gated behind a consultation must have a genuinely cleared
  // consultation — checked server-side, since the UI's own gate (which
  // treatment page you can reach) is trivially bypassable by posting directly,
  // and there is no staff reviewer left to catch it before money moves.
  if (t.requires_consultation && !input.parentConsultationId) {
    return { error: 'This therapy requires a consultation first — please book a consultation.' }
  }
  if (input.parentConsultationId) {
    const { data: consult, error: consultErr } = await sb
      .from('appointments')
      .select('id, customer_id, patient_email, booking_kind, treatment_id, treatment_unlocked')
      .eq('id', input.parentConsultationId)
      .maybeSingle()
    if (consultErr) {
      console.error('[instant-booking] parent consultation lookup failed:', consultErr)
      return { error: publicInstantFailure(consultErr) }
    }
    const accessGranted = consult
      ? await canAccessBooking(consult.id, consult.customer_id ?? null, input.parentConsultationToken)
      : false
    if (!consult || !canLinkTreatmentToConsultation({
      bookingKind: consult.booking_kind,
      treatmentUnlocked: !!consult.treatment_unlocked,
      accessGranted,
      consultationTreatmentId: consult.treatment_id,
      requestedTreatmentId: t.id,
    })) {
      return { error: 'Your consultation hasn’t been cleared for this therapy yet — please check with the clinic.' }
    }

    const { data: children, error: childrenErr } = await sb
      .from('appointments')
      .select('status, payment_expires_at')
      .eq('parent_consultation_id', consult.id)
      .eq('booking_kind', 'treatment')
      .in('status', ACTIVE_LINKED_TREATMENT_STATUSES)
    if (childrenErr) {
      console.error('[instant-booking] linked treatment lookup failed:', childrenErr)
      return { error: publicInstantFailure(childrenErr) }
    }
    if (hasActiveLinkedTreatment(
      (children ?? []).map((child) => ({
        status: child.status,
        paymentExpiresAt: child.payment_expires_at,
      })),
      Date.now(),
    )) {
      return { error: ACTIVE_LINKED_TREATMENT_ERROR }
    }
  }

  let userId: string | null = null
  if (!input.isGuest) {
    const ssr = await createServerClient()
    const { data: auth } = await ssr.auth.getUser()
    userId = auth.user?.id ?? null
  }

  const durationMins = parseDurationMins(t.duration)
  const timing = canonicalInstantTiming({ kind: 'treatment', preferredAt: input.preferredAt, durationMins })
  const slotCheck = validateSubmittedSlot({
    iso: input.preferredAt,
    durationMins,
    nowMs: Date.now(),
    leadTimeHours: Number(t.booking_lead_time_hours ?? 0),
    kind: 'treatment',
  })
  if ('error' in slotCheck) return slotCheck
  const capacity = await effectiveGenderCapacity(input.patientGender, input.preferredAt, durationMins)
  const holdExpiresAt = new Date(Date.now() + CHECKOUT_HOLD_MINS * 60_000).toISOString()

  const claim: Claim = {
    resourceType: 'gender',
    // gender_requirement stores 'men_only' / 'ladies_only', not 'male' / 'female'.
    resourceKey: genderRequirementValue(input.patientGender),
    capacity,
    row: {
      customer_id: userId,
      is_guest: input.isGuest || !userId,
      booking_kind: 'treatment',
      treatment_id: t.id,
      treatment_category_id: t.category_id ?? null,
      treatment_name: t.title,
      duration_mins: timing.durationMins,
      status: 'awaiting_payment',
      requested_datetime: timing.requestedDatetime,
      requested_datetime_alt: timing.requestedDatetimeAlt,
      appointment_date_time: timing.appointmentDatetime,
      patient_name: input.patientName.trim(),
      patient_phone: input.patientPhone.trim(),
      patient_email: input.patientEmail?.trim() || null,
      patient_gender: input.patientGender,
      gender_requirement: genderRequirementValue(input.patientGender),
      guest_age: input.age ?? null,
      pre_visit_form: input.healthIntake ?? {},
      payable_amount_rm: t.price_rm ?? null,
      payment_status: 'unpaid',
      parent_consultation_id: input.parentConsultationId ?? null,
      payment_expires_at: holdExpiresAt,
    },
  }

  const res = await runClaims(sb, [claim])
  if ('error' in res) return { error: res.error }
  const id = res.ids[0]
  return { id, token: createBookingToken(id), holdExpiresAt }
}

/**
 * Group version of createInstantTreatmentBooking — every guest is claimed in
 * ONE call to claim_instant_slots, so the whole group succeeds or fails
 * together (no guest left half-booked if a later guest's slot is full).
 */
export async function createInstantGroupBooking(input: {
  treatmentId: string
  patientPhone: string
  patientEmail?: string | null
  isGuest: boolean
  acceptedPolicies: boolean
  guests: GroupGuest[]
}): Promise<InstantBookingResult> {
  if (!input.acceptedPolicies) return { error: 'Please accept the booking policies to continue.' }
  if (!input.patientPhone?.trim()) return { error: 'Please enter a contact number.' }
  if (!input.patientEmail?.trim()) return { error: 'Please enter an email so we can send booking updates.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.patientEmail.trim())) return { error: 'Please enter a valid email address.' }
  if (!input.treatmentId) return { error: 'Please choose a treatment.' }

  const groupCheck = validateInstantGroupGuests(input.guests)
  if ('error' in groupCheck) return groupCheck
  const guests = input.guests

  const sb = admin()
  const guestTreatmentIds = guests.map((g) => g.treatmentId?.trim() || input.treatmentId)
  const uniqueIds = Array.from(new Set(guestTreatmentIds))
  const { data: treatmentRows, error: tErr } = await sb
    .from('treatments')
    .select('id, title, price_rm, booking_type, category_id, duration, requires_consultation, booking_lead_time_hours, requires_scalp_disclaimer, requires_health_intake, minimum_age, special_tags')
    .in('id', uniqueIds)
  if (tErr) {
    console.error('[instant-booking] group treatment lookup failed:', tErr)
    return { error: publicInstantFailure(tErr) }
  }
  const byId = new Map((treatmentRows ?? []).map((t) => [t.id, t]))
  for (const id of uniqueIds) {
    const t = byId.get(id)
    if (!t) return { error: 'One of the chosen treatments could not be found.' }
    if (t.booking_type === 'enquiry') return { error: `"${t.title}" is enquiry-only — please WhatsApp us to arrange it.` }
    if (t.requires_consultation) return { error: `"${t.title}" requires a consultation first and can't be booked as part of a group.` }
  }

  for (let i = 0; i < guests.length; i++) {
    const g = guests[i]
    const t = byId.get(guestTreatmentIds[i])!
    if (t.minimum_age != null && (g.age == null || g.age < t.minimum_age)) {
      return { error: `${g.name.trim() || `Guest ${i + 1}`}: This therapy is only bookable for ages ${t.minimum_age} and above.` }
    }
    const health = g.healthIntake ?? {}
    if (t.requires_scalp_disclaimer && !health.noDandruffScalpIssues) {
      return { error: `${g.name.trim() || `Guest ${i + 1}`}: Please confirm you do not have dandruff or scalp issues, or WhatsApp us to discuss.` }
    }
    if (t.requires_health_intake) {
      const tags = Array.isArray(t.special_tags) ? t.special_tags : []
      if (tags.includes('oldage') && !health.noSurgeryWoundSkinLesions) {
        return { error: `${g.name.trim() || `Guest ${i + 1}`}: Please confirm no recent surgery, open wounds or skin lesions, or WhatsApp us before booking.` }
      }
      if (tags.includes('kids') && !health.noFeverColdFlu) {
        return { error: `${g.name.trim() || `Guest ${i + 1}`}: Please confirm the child does not have fever, cold or flu, or WhatsApp us before booking.` }
      }
    }
  }

  let userId: string | null = null
  if (!input.isGuest) {
    const ssr = await createServerClient()
    const { data: auth } = await ssr.auth.getUser()
    userId = auth.user?.id ?? null
  }

  const groupId = crypto.randomUUID()
  const holdExpiresAt = new Date(Date.now() + CHECKOUT_HOLD_MINS * 60_000).toISOString()

  const claims: Claim[] = []
  for (let i = 0; i < guests.length; i++) {
    const g = guests[i]
    const t = byId.get(guestTreatmentIds[i])!
    const durationMins = parseDurationMins(t.duration)
    const timing = canonicalInstantTiming({ kind: 'treatment', preferredAt: g.preferredAt, durationMins })
    const slotCheck = validateSubmittedSlot({
      iso: g.preferredAt,
      durationMins,
      nowMs: Date.now(),
      leadTimeHours: Number(t.booking_lead_time_hours ?? 0),
      kind: 'treatment',
    })
    if ('error' in slotCheck) return slotCheck
    const capacity = await effectiveGenderCapacity(g.gender, g.preferredAt, durationMins)
    claims.push({
      resourceType: 'gender',
      resourceKey: genderRequirementValue(g.gender),
      capacity,
      row: {
        customer_id: userId,
        is_guest: input.isGuest || !userId,
        booking_kind: 'treatment',
        treatment_id: t.id,
        treatment_category_id: t.category_id ?? null,
        treatment_name: t.title,
        duration_mins: timing.durationMins,
        status: 'awaiting_payment',
        requested_datetime: timing.requestedDatetime,
        requested_datetime_alt: timing.requestedDatetimeAlt,
        appointment_date_time: timing.appointmentDatetime,
        patient_name: g.name.trim(),
        patient_phone: input.patientPhone.trim(),
        patient_email: input.patientEmail?.trim() || null,
        patient_gender: g.gender,
        gender_requirement: genderRequirementValue(g.gender),
        guest_age: g.age ?? null,
        group_id: groupId,
        pre_visit_form: g.healthIntake ?? {},
        payable_amount_rm: t.price_rm ?? null,
        payment_status: 'unpaid',
        payment_expires_at: holdExpiresAt,
      },
    })
  }

  const res = await runClaims(sb, claims)
  if ('error' in res) return { error: res.error }
  const leadId = res.ids[0]
  return { id: leadId, token: createBookingToken(leadId), holdExpiresAt }
}

export type InstantConsultationResult = { id: string; token: string } | { error: string }

/**
 * Free consultation, instant self-book — confirmed immediately, no payment
 * step. A single atomic claim (capacity 1, resource 'vaidya') is enough on
 * its own to be race-safe: there is no separate hold-then-pay window to
 * protect, so this never touches sweepExpiredBookings.
 */
export async function createInstantConsultation(input: BookingRequestInput): Promise<InstantConsultationResult> {
  if (!input.acceptedPolicies) return { error: 'Please accept the booking policies to continue.' }
  if (!input.patientName?.trim()) return { error: 'Please enter the patient name.' }
  if (!input.patientPhone?.trim()) return { error: 'Please enter a contact number.' }
  if (!input.patientEmail?.trim()) return { error: 'Please enter an email so we can send booking updates.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.patientEmail.trim())) return { error: 'Please enter a valid email address.' }
  if (!input.preferredAt) return { error: 'Please choose a preferred date and time.' }
  if (input.patientGender !== 'male' && input.patientGender !== 'female') {
    return { error: patientGenderError('consultation') }
  }

  const sb = admin()
  type ConsultationTreatment = { id: string; title: string; duration: string | null; category_id: string | null }
  let t: ConsultationTreatment | null = null
  if (input.treatmentId) {
    const { data, error } = await sb
      .from('treatments')
      .select('id, title, duration, category_id')
      .eq('id', input.treatmentId)
      .maybeSingle()
    if (error) console.error('[instant-booking] consultation treatment lookup failed:', error)
    const resolved = resolveRequestedConsultationTreatment<ConsultationTreatment>({ requested: true, data, error })
    if ('error' in resolved) return resolved
    t = resolved.value
  }

  let userId: string | null = null
  if (!input.isGuest) {
    const ssr = await createServerClient()
    const { data: auth } = await ssr.auth.getUser()
    userId = auth.user?.id ?? null
  }

  const treatmentName = t?.title ?? 'Free Consultation'
  const timing = canonicalInstantTiming({
    kind: 'consultation', preferredAt: input.preferredAt, durationMins: t ? parseDurationMins(t.duration) : CONSULTATION_MINS,
  })
  const durationMins = timing.durationMins
  const slotCheck = validateSubmittedSlot({
    iso: input.preferredAt,
    durationMins: CONSULTATION_MINS,
    nowMs: Date.now(),
    leadTimeHours: 0,
    kind: 'consultation',
  })
  if ('error' in slotCheck) return slotCheck

  // Live re-check against each Vaidya's own schedule + centre closures, same
  // check approveAndAssign used to run at approval time — just moved earlier,
  // to the instant of booking, since there's no approval step left to run it.
  // Picks whichever public-facing Vaidya is free — the customer never sees or
  // chooses a doctor by name, same as therapist auto-assignment on treatments.
  const assignedVaidyaCode = await findFreeVaidya(input.preferredAt, durationMins)
  if (!assignedVaidyaCode) {
    return { error: 'That consultation slot was just taken — please pick another time.' }
  }

  const claim: Claim = {
    resourceType: 'consultation',
    resourceKey: assignedVaidyaCode,
    capacity: 1,
    row: {
      customer_id: userId,
      is_guest: input.isGuest || !userId,
      booking_kind: 'consultation',
      treatment_id: t?.id ?? null,
      treatment_category_id: t?.category_id ?? null,
      treatment_name: treatmentName,
      duration_mins: durationMins,
      status: 'confirmed',
      requested_datetime: timing.requestedDatetime,
      requested_datetime_alt: timing.requestedDatetimeAlt,
      appointment_date_time: timing.appointmentDatetime,
      patient_name: input.patientName.trim(),
      patient_phone: input.patientPhone.trim(),
      patient_email: input.patientEmail?.trim() || null,
      patient_gender: input.patientGender,
      gender_requirement: 'any',
      pre_visit_form: input.healthIntake ?? {},
      payable_amount_rm: null,
      payment_status: 'unpaid',
      assigned_therapist_code: assignedVaidyaCode,
    },
  }

  const res = await runClaims(sb, [claim])
  if ('error' in res) return { error: res.error }
  const id = res.ids[0]
  const bookingToken = createBookingToken(id)

  await notifyConfirmed({
    to: input.patientEmail,
    name: input.patientName,
    treatmentName,
    whenISO: input.preferredAt,
    bookingKind: 'consultation',
    bookingId: id,
    statusUrl: `${BOOKING_SITE_URL}/book/request/${id}?t=${bookingToken}`,
  })

  return { id, token: bookingToken }
}
