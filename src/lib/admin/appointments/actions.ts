'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications/create'
import type { BookingKind } from '@/types/booking'
import { mapOperationalTransitionWriteFailure, validateOperationalTransition } from '@/lib/booking/operations'
import {
  canTransitionAppointment,
  type AppointmentStatus,
} from './status-transitions'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export async function requireAdminSession() {
  const me = await getCurrentUser()
  if (!me || me.role !== 'admin') throw new Error('Not authorised.')
  return me
}

function shortId(id: string): string {
  return id.slice(-6).toUpperCase()
}

async function notifyCustomer(
  customerId: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kind: any,
  title: string,
  body: string,
  href: string,
): Promise<void> {
  if (!customerId) return
  await createNotification({ userId: customerId, kind, title, body, href })
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

export async function moveAppointmentStatus(
  appointmentId: string,
  to: AppointmentStatus,
  note?: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()

    const { data: aRaw } = await supabase
      .from('appointments')
      .select('id, status, booking_kind, assigned_therapist_code, customer_id, treatment_name')
      .eq('id', appointmentId)
      .single()
    if (!aRaw) return { ok: false, error: 'Appointment not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a: any = aRaw
    const from = a.status as AppointmentStatus
    if (!canTransitionAppointment(from, to)) {
      return { ok: false, error: `Cannot move from ${from} to ${to}.` }
    }
    const operationalTransition = validateOperationalTransition({
      bookingKind: a.booking_kind as BookingKind,
      assignedTherapistCode: a.assigned_therapist_code as string | null,
      to,
    })
    if ('error' in operationalTransition) {
      return { ok: false, error: operationalTransition.error }
    }

    const patch: Record<string, unknown> = { status: to }
    if (to === 'checked_in') patch.checked_in_at = new Date().toISOString()
    if (to === 'completed') patch.completed_at = new Date().toISOString()

    // Only checked_in/in_progress can be rejected by the therapist-assignment
    // invariant, so only those re-check status and verify a row changed. This
    // client runs under RLS (unlike staff's service-role client), so adding the
    // compare-and-set to transitions the invariant never touches would risk a
    // false "status changed" error if the appointments RLS policy is ever
    // scoped by status — keep other transitions on the plain update.
    if (to === 'checked_in' || to === 'in_progress') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated, error } = await (supabase.from('appointments') as any)
        .update(patch)
        .eq('id', appointmentId)
        .eq('status', from)
        .select('id')
        .maybeSingle()
      const writeFailure = mapOperationalTransitionWriteFailure({ error, updated: !!updated })
      if (writeFailure) return { ok: false, error: writeFailure }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('appointments') as any)
        .update(patch)
        .eq('id', appointmentId)
      if (error) return { ok: false, error: error.message }
    }

    const customerKind =
      to === 'confirmed'
        ? 'appointment_confirmed'
        : to === 'cancelled'
          ? 'appointment_cancelled'
          : 'appointment_confirmed'
    await notifyCustomer(
      a.customer_id,
      customerKind,
      `Appointment ${to}`,
      note ?? `Your ${a.treatment_name} appointment is now ${to}.`,
      `/account/appointments/${appointmentId}`,
    )

    revalidatePath(`/admin/appointments/${appointmentId}`)
    revalidatePath('/admin/appointments')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function cancelAppointment(
  appointmentId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    if (!reason || reason.trim().length < 3) {
      return { ok: false, error: 'Reason required.' }
    }
    const supabase = await createClient()
    const { data: aRaw } = await supabase
      .from('appointments')
      .select('id, customer_id, status')
      .eq('id', appointmentId)
      .single()
    if (!aRaw) return { ok: false, error: 'Appointment not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a: any = aRaw
    if (!canTransitionAppointment(a.status as AppointmentStatus, 'cancelled')) {
      return { ok: false, error: `Cannot cancel from ${a.status}.` }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('appointments') as any)
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq('id', appointmentId)
    if (error) return { ok: false, error: error.message }

    await notifyCustomer(
      a.customer_id,
      'appointment_cancelled',
      `Appointment #${shortId(appointmentId)} cancelled`,
      reason,
      `/account/appointments/${appointmentId}`,
    )
    revalidatePath(`/admin/appointments/${appointmentId}`)
    revalidatePath('/admin/appointments')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function rescheduleAppointment(input: {
  appointmentId: string
  newDateTime: string
  reason: string
}): Promise<ActionResult> {
  try {
    const me = await requireAdminSession()
    if (!input.reason || input.reason.trim().length < 3) {
      return { ok: false, error: 'Reason required.' }
    }
    const supabase = await createClient()
    const { data: aRaw } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', input.appointmentId)
      .single()
    if (!aRaw) return { ok: false, error: 'Appointment not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a: any = aRaw

    // Mark old appointment rescheduled
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: e1 } = await (supabase.from('appointments') as any)
      .update({
        status: 'rescheduled',
        cancellation_reason: input.reason,
      })
      .eq('id', input.appointmentId)
    if (e1) return { ok: false, error: e1.message }

    // Insert a new appointment with new date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newRow, error: e2 } = await (supabase.from('appointments') as any)
      .insert({
        customer_id: a.customer_id,
        treatment_name: a.treatment_name,
        doctor_name: a.doctor_name,
        appointment_date_time: input.newDateTime,
        duration_mins: a.duration_mins,
        mode: a.mode,
        room: a.room,
        advance_payment_rm: a.advance_payment_rm,
        advance_payment_status: a.advance_payment_status,
        status: 'confirmed',
        rescheduled_from_id: a.id,
        notes: a.notes,
        created_by_admin_id: me.authId,
      })
      .select('id')
      .single()
    if (e2 || !newRow) return { ok: false, error: e2?.message ?? 'Insert failed.' }

    await notifyCustomer(
      a.customer_id,
      'appointment_confirmed',
      `Appointment rescheduled`,
      `${a.treatment_name} moved to ${new Date(input.newDateTime).toLocaleString('en-MY')}. Reason: ${input.reason}`,
      `/account/appointments/${newRow.id}`,
    )

    revalidatePath('/admin/appointments')
    revalidatePath(`/admin/appointments/${input.appointmentId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function markAppointmentNoShow(
  appointmentId: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    const { data: aRaw } = await supabase
      .from('appointments')
      .select('id, status, customer_id, treatment_name')
      .eq('id', appointmentId)
      .single()
    if (!aRaw) return { ok: false, error: 'Appointment not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a: any = aRaw
    if (!canTransitionAppointment(a.status as AppointmentStatus, 'no_show')) {
      return { ok: false, error: `Cannot mark no-show from ${a.status}.` }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('appointments') as any)
      .update({ status: 'no_show' })
      .eq('id', appointmentId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/appointments/${appointmentId}`)
    revalidatePath('/admin/appointments')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function addAppointmentInternalNote(
  appointmentId: string,
  note: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('appointments') as any)
      .update({ internal_notes: note })
      .eq('id', appointmentId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/appointments/${appointmentId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Walk-in / manual appointment entry
// ---------------------------------------------------------------------------

const WalkInSchema = z.object({
  customerId: z.string().uuid().nullable(),
  walkInName: z.string().min(1).optional(),
  walkInPhone: z.string().min(1, 'Phone is required.').optional(),
  walkInEmail: z.string().email('A valid email is required.').optional(),
  walkInGender: z.enum(['male', 'female']).optional(),
  treatmentName: z.string().min(1),
  doctorName: z.string().min(1).default('our Vaidya'),
  appointmentDateTime: z.string(),
  durationMins: z.number().int().positive().default(60),
  mode: z.enum(['in-person', 'virtual']).default('in-person'),
  room: z.string().optional(),
  advancePaymentRm: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  internalNote: z.string().optional(),
  genderRequirement: z
    .enum(['any', 'men_only', 'ladies_only'])
    .default('any'),
})

/**
 * Checks customer gender against a treatment's gender requirement.
 * Returns an error message if they don't match. Used by walk-in creation
 * and surfaced as a warning on the detail page.
 */
function checkGenderRule(
  customerGender: 'male' | 'female' | null | undefined,
  requirement: 'any' | 'men_only' | 'ladies_only',
): string | null {
  if (requirement === 'any') return null
  if (requirement === 'men_only' && customerGender !== 'male') {
    return 'This treatment is restricted to male customers (clinic policy: gender-segregated therapy).'
  }
  if (requirement === 'ladies_only' && customerGender !== 'female') {
    return 'This treatment is restricted to female customers (clinic policy: gender-segregated therapy).'
  }
  return null
}

export async function createWalkInAppointment(
  raw: unknown,
): Promise<ActionResult<{ appointmentId: string }>> {
  try {
    const me = await requireAdminSession()
    const input = WalkInSchema.parse(raw)
    const supabase = await createClient()

    let customerId = input.customerId
    let customerGender: 'male' | 'female' | null = input.walkInGender ?? null

    if (!customerId) {
      if (!input.walkInName) return { ok: false, error: 'Walk-in name required.' }
      if (!input.walkInPhone?.trim()) return { ok: false, error: 'Phone is required so we can send booking notifications.' }
      if (!input.walkInEmail?.trim()) return { ok: false, error: 'Email is required so we can send booking notifications.' }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: u, error: ue } = await (supabase.from('users') as any)
        .insert({
          full_name: input.walkInName,
          phone_number: input.walkInPhone ?? null,
          email: input.walkInEmail || null,
          gender: input.walkInGender ?? null,
          role: 'customer',
        })
        .select('id')
        .single()
      if (ue || !u) return { ok: false, error: ue?.message ?? 'Customer create failed.' }
      customerId = u.id
    } else if (input.genderRequirement !== 'any') {
      // Existing customer: look up gender so we can validate the rule
      const { data: existing } = await supabase
        .from('users')
        .select('gender')
        .eq('id', customerId)
        .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customerGender = ((existing as any)?.gender ?? null) as 'male' | 'female' | null
    }

    // Enforce gender rule at creation time
    const genderError = checkGenderRule(customerGender, input.genderRequirement)
    if (genderError) return { ok: false, error: genderError }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: appt, error } = await (supabase.from('appointments') as any)
      .insert({
        customer_id: customerId,
        treatment_name: input.treatmentName,
        doctor_name: input.doctorName,
        appointment_date_time: input.appointmentDateTime,
        duration_mins: input.durationMins,
        mode: input.mode,
        room: input.room || null,
        advance_payment_rm: input.advancePaymentRm ?? null,
        status: 'confirmed',
        notes: input.notes || null,
        internal_notes: input.internalNote || null,
        gender_requirement: input.genderRequirement,
        created_by_admin_id: me.authId,
      })
      .select('id')
      .single()
    if (error || !appt) return { ok: false, error: error?.message ?? 'Insert failed.' }

    revalidatePath('/admin/appointments')
    return { ok: true, data: { appointmentId: appt.id } }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        error: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }
    }
    return { ok: false, error: (err as Error).message }
  }
}
