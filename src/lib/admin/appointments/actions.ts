'use server'

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
      `${a.treatment_name} moved to ${new Date(input.newDateTime).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}. Reason: ${input.reason}`,
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
