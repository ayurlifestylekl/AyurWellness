'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import type { BookingKind, BookingStatus, StaffColorTag } from '@/types/booking'
import { canTransition } from '@/lib/booking/status'
import { mapOperationalTransitionWriteFailure, validateOperationalTransition } from '@/lib/booking/operations'
import { canClearConsultation, CLEARABLE_CONSULTATION_STATUSES } from '@/lib/booking/consultation-rules'
import { genderRequirementValue, therapistMatchesRequirement } from '@/lib/booking/policy'
import { parseDurationMins } from '@/lib/booking/duration'
import { createBookingToken } from '@/lib/booking/token'
import { notifyApproved, notifyCancelled, BOOKING_SITE_URL } from '@/lib/booking/notify'
import { voidBill } from '@/lib/booking/payment'
import { findClash, freeAtLabel, type Slot } from '@/lib/booking/scheduling'
import { CONSULTATION_MINS } from '@/lib/booking/slots'
import { fetchBlocksOnOrAfter, blockedIntervalsForDate, isBlocked } from '@/lib/booking/blocks'
import { mytDayKey } from '@/lib/datetime'
import type { Gender } from '@/types/booking'
import { therapistByCode, vaidyaByCode, VAIDYA_BLOCK_CODE } from './therapists'
import { requireStaff } from './guard'

type Ok = { ok: true }
type Err = { error: string }

/**
 * Approve a request. Treatments get a same-gender therapist assigned (with
 * clash/leave checks) and move to awaiting_payment. Consultations are conducted
 * by the Vaidya — no therapist is assigned; they move straight to confirmed
 * (free), guarded only against the Vaidya being double-booked.
 */
export async function approveAndAssign(
  id: string,
  p: { therapistCode: string; confirmedAt: string; room?: string },
): Promise<Ok | Err> {
  const { userId, db } = await requireStaff()
  if (!p.confirmedAt) return { error: 'Set the confirmed date & time.' }

  const { data: appt } = await db
    .from('appointments')
    .select('status, booking_kind, gender_requirement, duration_mins, patient_email, patient_name, treatment_name, payable_amount_rm')
    .eq('id', id)
    .maybeSingle()
  if (!appt) return { error: 'Appointment not found.' }

  const isConsultation = appt.booking_kind === 'consultation'
  const durationMins = appt.duration_mins ?? (isConsultation ? 30 : 60)

  // Therapist assignment applies to TREATMENTS only. A consultation is conducted
  // by the Vaidya — no therapist, no same-gender matching, no therapist roster.
  let therapist: Awaited<ReturnType<typeof therapistByCode>> | undefined
  if (isConsultation) {
    // Vaidya double-booking guard: no two consultations may overlap (one Vaidya).
    const { data: others } = await db
      .from('appointments')
      .select('appointment_date_time, duration_mins')
      .eq('booking_kind', 'consultation')
      .in('status', ['scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress'])
      .neq('id', id)
    const busy: Slot[] = (others ?? [])
      .filter((o) => o.appointment_date_time)
      .map((o) => ({ startISO: o.appointment_date_time as string, durationMins: o.duration_mins ?? 30 }))
    const clash = findClash({ startISO: p.confirmedAt, durationMins }, busy)
    if (clash) {
      return { error: `The Vaidya already has a consultation until ${freeAtLabel(clash)} — pick another time.` }
    }

    // Centre-wide closures AND the Vaidya's own leave both apply.
    const blocks = await fetchBlocksOnOrAfter(db, mytDayKey(p.confirmedAt))
    const intervals = blockedIntervalsForDate(blocks, mytDayKey(p.confirmedAt))
    if (isBlocked(intervals, VAIDYA_BLOCK_CODE, p.confirmedAt, durationMins)) {
      return { error: 'The Vaidya is on leave or the centre is closed at that time — pick another slot.' }
    }
  } else {
    therapist = await therapistByCode(p.therapistCode)
    if (!therapist) return { error: 'Select a therapist.' }

    if (!therapistMatchesRequirement(therapist.gender, appt.gender_requirement)) {
      const need = appt.gender_requirement === 'men_only' ? 'male' : 'female'
      return { error: `Same-gender policy: this patient must be assigned a ${need} therapist.` }
    }

    // Double-booking check: is this therapist free for the session + 30-min buffer?
    const { data: others } = await db
      .from('appointments')
      .select('appointment_date_time, duration_mins, status, payment_expires_at')
      .eq('assigned_therapist_code', therapist.code)
      .in('status', ['scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress'])
      .neq('id', id)
    const nowMs = Date.now()
    const busy: Slot[] = (others ?? [])
      .filter((o) => o.appointment_date_time)
      // An expired-but-unpaid hold no longer occupies the therapist (matches slot display).
      .filter((o) => !(o.status === 'awaiting_payment' && o.payment_expires_at && new Date(o.payment_expires_at).getTime() <= nowMs))
      .map((o) => ({ startISO: o.appointment_date_time as string, durationMins: o.duration_mins ?? 60 }))
    const clash = findClash({ startISO: p.confirmedAt, durationMins }, busy)
    if (clash) {
      return { error: `${therapist.name} (${therapist.code}) is busy until ${freeAtLabel(clash)} — pick another therapist or time.` }
    }

    // Leave / blocked windows: don't allow assigning a therapist who's off.
    const blocks = await fetchBlocksOnOrAfter(db, mytDayKey(p.confirmedAt))
    const intervals = blockedIntervalsForDate(blocks, mytDayKey(p.confirmedAt))
    if (isBlocked(intervals, therapist.code, p.confirmedAt, durationMins)) {
      return { error: `${therapist.name} (${therapist.code}) is on leave / blocked at that time — pick another therapist or time.` }
    }
  }

  const to: BookingStatus = isConsultation ? 'confirmed' : 'awaiting_payment'
  if (!canTransition(appt.status as BookingStatus, to)) {
    return { error: `Cannot move ${appt.status} → ${to}.` }
  }

  const { error } = await db
    .from('appointments')
    .update({
      // Consultations carry no therapist; treatments get the assigned one.
      assigned_therapist_code: therapist?.code ?? null,
      assigned_therapist_name: therapist?.name ?? null,
      assigned_therapist_gender: therapist?.gender ?? null,
      appointment_date_time: p.confirmedAt,
      duration_mins: durationMins,
      room: p.room?.trim() || null,
      approved_by: userId,
      approved_at: new Date().toISOString(),
      status: to,
    })
    .eq('id', id)
  if (error) {
    // DB exclusion constraint caught a concurrent double-book (23P01).
    if (error.code === '23P01') {
      return { error: 'That therapist was just booked for this time — pick another therapist or time.' }
    }
    return { error: error.message }
  }

  // Treatments get a 15-hour window to pay before the slot is auto-released.
  // Best-effort: harmless no-op until the payment_expiry migration is applied.
  if (to === 'awaiting_payment') {
    const expiresAt = new Date(Date.now() + 15 * 3600_000).toISOString()
    await db.from('appointments').update({ payment_expires_at: expiresAt, payment_reminded: false }).eq('id', id)
  }

  // Link straight to the payment route (one click → Billplz), not the status page.
  const payUrl =
    to === 'awaiting_payment'
      ? `${BOOKING_SITE_URL}/book/request/${id}/pay?t=${createBookingToken(id)}`
      : null
  await notifyApproved({
    to: appt.patient_email,
    name: appt.patient_name,
    treatmentName: appt.treatment_name,
    kind: appt.booking_kind,
    whenISO: p.confirmedAt,
    amountRm: appt.payable_amount_rm != null ? Number(appt.payable_amount_rm) : null,
    payUrl,
    bookingId: id,
  })

  revalidatePath('/console')
  revalidatePath(`/console/${id}`)
  revalidatePath('/doctor')
  revalidatePath(`/doctor/${id}`)
  return { ok: true }
}

/**
 * Assign (or reassign) a named therapist to a booking that's already
 * confirmed — the post-payment workflow under instant booking, where naming
 * happens after the customer has paid, at front desk's own pace. Works one
 * row at a time, single or group guest alike (a group guest is its own
 * appointment row), with NO status change — the booking is already confirmed;
 * this only records who's serving it. Reuses the exact gender / clash / leave
 * checks approveAndAssign uses, minus the status transition.
 */
export async function assignTherapist(id: string, p: { therapistCode: string; room?: string }): Promise<Ok | Err> {
  const { db } = await requireStaff()
  const { data: appt } = await db
    .from('appointments')
    .select('status, booking_kind, gender_requirement, duration_mins, appointment_date_time')
    .eq('id', id)
    .maybeSingle()
  if (!appt) return { error: 'Appointment not found.' }
  if (appt.booking_kind === 'consultation') {
    return { error: 'Consultations are conducted by the Vaidya — there is no therapist to assign.' }
  }
  if (!['confirmed', 'checked_in', 'in_progress'].includes(appt.status)) {
    return { error: `Cannot assign a therapist while this booking is ${appt.status}.` }
  }
  if (!appt.appointment_date_time) return { error: 'This booking has no confirmed time yet.' }

  const therapist = await therapistByCode(p.therapistCode)
  if (!therapist) return { error: 'Select a therapist.' }
  if (!therapistMatchesRequirement(therapist.gender, appt.gender_requirement)) {
    const need = appt.gender_requirement === 'men_only' ? 'male' : 'female'
    return { error: `Same-gender policy: this patient must be assigned a ${need} therapist.` }
  }

  const durationMins = appt.duration_mins ?? 60
  const { data: others } = await db
    .from('appointments')
    .select('appointment_date_time, duration_mins, status, payment_expires_at')
    .eq('assigned_therapist_code', therapist.code)
    .in('status', ['scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress'])
    .neq('id', id)
  const nowMs = Date.now()
  const busy: Slot[] = (others ?? [])
    .filter((o) => o.appointment_date_time)
    .filter((o) => !(o.status === 'awaiting_payment' && o.payment_expires_at && new Date(o.payment_expires_at).getTime() <= nowMs))
    .map((o) => ({ startISO: o.appointment_date_time as string, durationMins: o.duration_mins ?? 60 }))
  const clash = findClash({ startISO: appt.appointment_date_time, durationMins }, busy)
  if (clash) {
    return { error: `${therapist.name} (${therapist.code}) is busy until ${freeAtLabel(clash)} — pick another therapist or time.` }
  }

  const blocks = await fetchBlocksOnOrAfter(db, mytDayKey(appt.appointment_date_time))
  const intervals = blockedIntervalsForDate(blocks, mytDayKey(appt.appointment_date_time))
  if (isBlocked(intervals, therapist.code, appt.appointment_date_time, durationMins)) {
    return { error: `${therapist.name} (${therapist.code}) is on leave / blocked at that time — pick another therapist or time.` }
  }

  const { error } = await db
    .from('appointments')
    .update({
      assigned_therapist_code: therapist.code,
      assigned_therapist_name: therapist.name,
      assigned_therapist_gender: therapist.gender,
      room: p.room?.trim() || null,
    })
    .eq('id', id)
  if (error) {
    // DB exclusion constraint caught a concurrent double-book (23P01).
    if (error.code === '23P01') {
      return { error: 'That therapist was just booked for this time — pick another therapist or time.' }
    }
    return { error: error.message }
  }

  revalidatePath('/console')
  revalidatePath(`/console/${id}`)
  revalidatePath('/doctor')
  revalidatePath(`/doctor/${id}`)
  return { ok: true }
}

/**
 * Approve a whole group booking in ONE action. Each guest gets their OWN
 * confirmed time and a same-gender therapist, and the entire group moves to
 * awaiting_payment together. Payment is combined across the group, so a single
 * payment then confirms everyone. The same therapist may serve two guests as
 * long as their sessions (plus buffer) don't overlap.
 */
export async function approveGroup(
  groupId: string,
  p: { room?: string; assignments: { id: string; therapistCode: string; confirmedAt: string }[] },
): Promise<Ok | Err> {
  const { userId, db } = await requireStaff()
  if (!groupId) return { error: 'Missing group.' }

  const { data: members } = await db
    .from('appointments')
    .select('id, status, gender_requirement, duration_mins, patient_name, patient_email, treatment_name, payable_amount_rm, guest_age')
    .eq('group_id', groupId)
  if (!members || members.length === 0) return { error: 'Group not found.' }

  const pending = members.filter((m) => m.status === 'pending' || m.status === 'scheduled')
  if (pending.length === 0) return { error: 'This group has already been processed.' }

  // Every pending guest must have a therapist AND a confirmed time.
  const byId = new Map(p.assignments.map((a) => [a.id, a]))
  for (const m of pending) {
    const a = byId.get(m.id)
    if (!a?.therapistCode) return { error: 'Assign a therapist for every guest.' }
    if (!a.confirmedAt || Number.isNaN(new Date(a.confirmedAt).getTime())) {
      return { error: `Set the confirmed date & time for ${m.patient_name ?? 'every guest'}.` }
    }
  }

  // A therapist may serve several guests in this group, but their sessions
  // (plus the standard buffer) must not overlap.
  const byTherapist = new Map<string, { name: string | null; slot: Slot }[]>()
  for (const m of pending) {
    const a = byId.get(m.id)!
    const list = byTherapist.get(a.therapistCode) ?? []
    list.push({ name: m.patient_name, slot: { startISO: a.confirmedAt, durationMins: m.duration_mins ?? 60 } })
    byTherapist.set(a.therapistCode, list)
  }
  for (const [code, sessions] of Array.from(byTherapist.entries())) {
    for (let i = 0; i < sessions.length; i++) {
      const clash = findClash(sessions[i].slot, sessions.filter((_, j) => j !== i).map((s) => s.slot))
      if (clash) {
        const t = await therapistByCode(code)
        return { error: `${t ? t.name : code} is assigned to two guests whose sessions overlap — stagger the times (30-min gap between sessions) or pick another therapist.` }
      }
    }
  }

  // Schedule blocks from the earliest confirmed day onward cover every guest's own day.
  const earliestAt = p.assignments.map((a) => a.confirmedAt).sort()[0]
  const blocks = await fetchBlocksOnOrAfter(db, mytDayKey(earliestAt))

  // Validate every assignment before writing anything.
  for (const m of pending) {
    const a = byId.get(m.id)!
    const therapist = await therapistByCode(a.therapistCode)
    if (!therapist) return { error: 'Unknown therapist selected.' }
    if (!therapistMatchesRequirement(therapist.gender, m.gender_requirement)) {
      const need = m.gender_requirement === 'men_only' ? 'male' : 'female'
      return { error: `${m.patient_name ?? 'A guest'} needs a ${need} therapist.` }
    }
    const durationMins = m.duration_mins ?? 60
    // Busy windows from OTHER bookings (this group's own rows are excluded —
    // within-group overlaps were already checked from the proposed assignments).
    const { data: others } = await db
      .from('appointments')
      .select('appointment_date_time, duration_mins, group_id, status, payment_expires_at')
      .eq('assigned_therapist_code', therapist.code)
      .in('status', ['scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress'])
    const nowMs = Date.now()
    const busy: Slot[] = (others ?? [])
      .filter((o) => o.appointment_date_time && o.group_id !== groupId)
      // An expired-but-unpaid hold no longer occupies the therapist.
      .filter((o) => !(o.status === 'awaiting_payment' && o.payment_expires_at && new Date(o.payment_expires_at).getTime() <= nowMs))
      .map((o) => ({ startISO: o.appointment_date_time as string, durationMins: o.duration_mins ?? 60 }))
    const clash = findClash({ startISO: a.confirmedAt, durationMins }, busy)
    if (clash) return { error: `${therapist.name} (${therapist.code}) is busy until ${freeAtLabel(clash)} — pick another therapist or time.` }
    const intervals = blockedIntervalsForDate(blocks, mytDayKey(a.confirmedAt))
    if (isBlocked(intervals, therapist.code, a.confirmedAt, durationMins)) {
      return { error: `${therapist.name} (${therapist.code}) is on leave / blocked at that time — pick another therapist or time.` }
    }
    if (!canTransition(m.status as BookingStatus, 'awaiting_payment')) {
      return { error: `Cannot move ${m.status} → awaiting_payment.` }
    }
  }

  // All checks passed — assign + confirm every guest. Track the writes so a
  // mid-loop failure can be rolled back (no half-approved, unpayable group).
  const approvedAt = new Date().toISOString()
  const doneIds: string[] = []
  for (const m of pending) {
    const a = byId.get(m.id)!
    const therapist = (await therapistByCode(a.therapistCode))!
    const { error } = await db
      .from('appointments')
      .update({
        assigned_therapist_code: therapist.code,
        assigned_therapist_name: therapist.name,
        assigned_therapist_gender: therapist.gender,
        appointment_date_time: a.confirmedAt,
        duration_mins: m.duration_mins ?? 60,
        room: p.room?.trim() || null,
        approved_by: userId,
        approved_at: approvedAt,
        status: 'awaiting_payment',
      })
      .eq('id', m.id)
    if (error) {
      // Revert the guests already flipped so the whole group stays pending
      // and can be re-approved cleanly, rather than getting stuck unpayable.
      if (doneIds.length) {
        await db
          .from('appointments')
          .update({
            status: 'pending',
            assigned_therapist_code: null,
            assigned_therapist_name: null,
            assigned_therapist_gender: null,
            approved_by: null,
            approved_at: null,
          })
          .in('id', doneIds)
      }
      if (error.code === '23P01') {
        return { error: 'A therapist was just booked for this time by someone else — please re-assign and try again.' }
      }
      return { error: error.message }
    }
    doneIds.push(m.id)
  }

  // 15-hour payment hold for the whole group. Best-effort: harmless no-op until
  // the payment_expiry migration is applied.
  const expiresAt = new Date(Date.now() + 15 * 3600_000).toISOString()
  await db
    .from('appointments')
    .update({ payment_expires_at: expiresAt, payment_reminded: false })
    .eq('group_id', groupId)
    .eq('status', 'awaiting_payment')

  // One combined approval email — the lead guest pays for the whole group.
  const lead = pending[0]
  const totalRm = pending.reduce((s, m) => s + (m.payable_amount_rm != null ? Number(m.payable_amount_rm) : 0), 0)
  const payUrl = `${BOOKING_SITE_URL}/book/request/${lead.id}/pay?t=${createBookingToken(lead.id)}`
  await notifyApproved({
    to: lead.patient_email,
    name: lead.patient_name,
    treatmentName: `${lead.treatment_name ?? 'Treatment'} (group of ${pending.length})`,
    kind: 'treatment',
    whenISO: byId.get(lead.id)!.confirmedAt,
    amountRm: totalRm || null,
    payUrl,
    bookingId: lead.id,
    guests: pending.map((m) => ({
      name: m.patient_name,
      age: m.guest_age != null ? Number(m.guest_age) : null,
      treatmentName: m.treatment_name,
      whenISO: byId.get(m.id)!.confirmedAt,
    })),
  })

  revalidatePath('/console')
  revalidatePath('/doctor')
  for (const m of pending) {
    revalidatePath(`/console/${m.id}`)
    revalidatePath(`/doctor/${m.id}`)
  }
  return { ok: true }
}

/** Reject every still-open guest in a group, with one reason + one notification. */
export async function rejectGroup(groupId: string, reason?: string): Promise<Ok | Err> {
  const { db } = await requireStaff()
  if (!groupId) return { error: 'Missing group.' }
  const { data: members } = await db
    .from('appointments')
    .select('id, status, patient_email, patient_name, treatment_name, payment_bill_id, payment_status, payment_provider')
    .eq('group_id', groupId)
  if (!members || members.length === 0) return { error: 'Group not found.' }

  const actionable = members.filter((m) => !['cancelled', 'completed', 'no_show'].includes(m.status as string))
  if (actionable.length === 0) return { error: 'Nothing to reject in this group.' }

  const finalReason = reason?.trim() || 'Declined by clinic'
  const { error } = await db
    .from('appointments')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: finalReason })
    .eq('group_id', groupId)
    .in('status', ['pending', 'scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress'])
  if (error) return { error: error.message }

  // Void any open bill so the rejected group can never be paid for.
  const openBills = new Map<string, string | null>()
  for (const m of actionable) {
    if (m.payment_bill_id && m.payment_status !== 'paid') openBills.set(m.payment_bill_id, m.payment_provider)
  }
  for (const [billId, providerName] of Array.from(openBills)) await voidBill(billId, providerName)

  const lead = actionable[0]
  await notifyCancelled({
    to: lead.patient_email,
    name: lead.patient_name,
    treatmentName: `${lead.treatment_name ?? 'Treatment'} (group)`,
    refundable: false,
    reason: finalReason,
    notifyStaff: false,
  })

  revalidatePath('/console')
  revalidatePath('/doctor')
  return { ok: true }
}

/**
 * Flag a pending request as contacted (e.g. clarified via WhatsApp) so admin can
 * see the centre has already acted on it. Groups are flagged as one unit.
 * Requires the 20260712_contacted_flag migration.
 */
export async function markContacted(id: string): Promise<Ok | Err> {
  const { userId, db } = await requireStaff()
  const { data: appt } = await db.from('appointments').select('status, group_id').eq('id', id).maybeSingle()
  if (!appt) return { error: 'Appointment not found.' }
  if (appt.status !== 'pending' && appt.status !== 'scheduled') {
    return { error: 'Only open requests can be marked as contacted.' }
  }
  const patch = { contacted_at: new Date().toISOString(), contacted_by: userId }
  const q = db.from('appointments').update(patch)
  const { error } = appt.group_id ? await q.eq('group_id', appt.group_id) : await q.eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/console')
  revalidatePath(`/console/${id}`)
  revalidatePath('/doctor')
  revalidatePath(`/doctor/${id}`)
  return { ok: true }
}

/** Generic guarded status change (check-in, complete, no-show, cancel, …). */
export async function setStatus(id: string, to: BookingStatus): Promise<Ok | Err> {
  const { db } = await requireStaff()
  const { data: appt } = await db.from('appointments').select('status, booking_kind, assigned_therapist_code, group_id, payment_bill_id, payment_status, payment_provider').eq('id', id).maybeSingle()
  if (!appt) return { error: 'Appointment not found.' }
  // A group awaiting payment is billed as one unit — removing one guest mid-payment
  // would desync the shared bill. Cancel the whole group instead.
  if (appt.group_id && appt.status === 'awaiting_payment' && (to === 'cancelled' || to === 'no_show')) {
    return { error: 'This guest is part of a group awaiting payment — use “Reject group” to cancel them together.' }
  }
  if (!canTransition(appt.status as BookingStatus, to)) {
    return { error: `Cannot move ${appt.status} → ${to}.` }
  }
  const operationalTransition = validateOperationalTransition({
    bookingKind: appt.booking_kind as BookingKind,
    assignedTherapistCode: appt.assigned_therapist_code,
    to,
  })
  if ('error' in operationalTransition) return { error: operationalTransition.error }
  const stamp: Record<string, string> = {}
  if (to === 'checked_in') stamp.checked_in_at = new Date().toISOString()
  if (to === 'completed') stamp.completed_at = new Date().toISOString()
  if (to === 'cancelled') stamp.cancelled_at = new Date().toISOString()
  // Only checked_in/in_progress can be rejected by the therapist-assignment
  // invariant, so only those re-check status and verify a row changed. Other
  // transitions keep the plain update, matching this task's actual scope.
  if (to === 'checked_in' || to === 'in_progress') {
    const { data: updated, error } = await db
      .from('appointments')
      .update({ status: to, ...stamp })
      .eq('id', id)
      .eq('status', appt.status)
      .select('id')
      .maybeSingle()
    const writeFailure = mapOperationalTransitionWriteFailure({ error, updated: !!updated })
    if (writeFailure) return { error: writeFailure }
  } else {
    const { error } = await db.from('appointments').update({ status: to, ...stamp }).eq('id', id)
    if (error) return { error: error.message }
  }
  if ((to === 'cancelled' || to === 'no_show') && appt.payment_bill_id && appt.payment_status !== 'paid') {
    await voidBill(appt.payment_bill_id, appt.payment_provider)
  }
  revalidatePath('/console')
  revalidatePath('/doctor')
  revalidatePath(`/console/${id}`)
  return { ok: true }
}

/**
 * Reject a request: declines it but keeps the record (status → cancelled with a
 * reason). The customer is notified. Use this for requests you won't fulfil.
 */
export async function rejectBooking(id: string, reason?: string): Promise<Ok | Err> {
  const { db } = await requireStaff()
  const { data: appt } = await db
    .from('appointments')
    .select('status, group_id, patient_email, patient_name, treatment_name, payment_bill_id, payment_status, payment_provider')
    .eq('id', id)
    .maybeSingle()
  if (!appt) return { error: 'Appointment not found.' }
  if (['cancelled', 'completed', 'no_show'].includes(appt.status as string)) {
    return { error: `Cannot reject a ${appt.status} booking.` }
  }
  // Keep group bills consistent — once approved, reject the whole group, not one guest.
  if (appt.group_id && appt.status === 'awaiting_payment') {
    return { error: 'This guest is part of a group awaiting payment — use “Reject group” instead.' }
  }

  const finalReason = reason?.trim() || 'Declined by clinic'
  const { error } = await db
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: finalReason,
    })
    .eq('id', id)
  if (error) return { error: error.message }

  if (appt.payment_bill_id && appt.payment_status !== 'paid') {
    await voidBill(appt.payment_bill_id, appt.payment_provider)
  }
  await notifyCancelled({
    to: appt.patient_email,
    name: appt.patient_name,
    treatmentName: appt.treatment_name,
    refundable: false,
    reason: finalReason,
    notifyStaff: false,
  })

  revalidatePath('/console')
  revalidatePath('/doctor')
  revalidatePath(`/console/${id}`)
  return { ok: true }
}

/**
 * Permanently delete an appointment record. Destructive — for spam / test /
 * duplicate entries. Admin or front desk only.
 *
 * Paid or confirmed bookings cannot be deleted (they must be cancelled/refunded
 * through the proper flow). Unpaid open bills are voided first so the row
 * deletion never leaves an orphaned Billplz bill.
 */
export async function deleteBooking(id: string): Promise<Ok | Err> {
  const { db } = await requireStaff(['admin', 'front_desk'])

  const { data: appt, error: fetchErr } = await db
    .from('appointments')
    .select('id, status, payment_bill_id, payment_status, payment_provider, created_by_admin_id')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr) return { error: fetchErr.message }
  if (!appt) return { error: 'Appointment not found.' }

  // A paid booking is never deletable, regardless of who created it — deleting
  // it would orphan a real payment/bill with nothing left to reconcile against.
  if (appt.payment_status === 'paid') {
    return { error: 'Paid bookings cannot be deleted. Please cancel instead.' }
  }
  // A confirmed/checked-in/etc. status only blocks deletion for bookings a
  // customer made directly on the website (created_by_admin_id is null).
  // Front-desk-made bookings can carry 'confirmed' status without ever being
  // paid (e.g. phone/walk-in bookings marked confirmed on the spot), and
  // front desk should be able to remove their own mistakes freely.
  if (appt.created_by_admin_id == null && ['confirmed', 'checked_in', 'in_progress', 'completed'].includes(appt.status as string)) {
    return { error: 'Confirmed customer bookings cannot be deleted. Please cancel instead.' }
  }

  if (appt.payment_bill_id && appt.payment_status !== 'paid') {
    await voidBill(appt.payment_bill_id, appt.payment_provider)
  }

  const { error } = await db.from('appointments').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/console')
  revalidatePath('/doctor')
  return { ok: true }
}

/** Quick internal booking made directly from the staff schedule grid.
 *  Supports both real treatment bookings (treatmentId provided) and
 *  generic duration-only bookings (durationMins/treatmentName provided)
 *  for front-desk time blocking. Phone and a real treatment are optional. */
export async function createBookingFromGrid(input: {
  therapistCode: string
  startAt: string
  patientName: string
  patientGender: Gender
  treatmentId?: string | null
  durationMins?: number
  treatmentName?: string | null
  patientPhone?: string | null
  patientEmail?: string | null
  remark?: string | null
}): Promise<Ok | Err> {
  const { userId, db } = await requireStaff(['admin', 'front_desk'])
  if (!input.patientName?.trim()) return { error: 'Enter the patient name.' }
  if (!input.therapistCode) return { error: 'Choose a therapist.' }

  const therapist = await therapistByCode(input.therapistCode)
  if (!therapist) return { error: 'Therapist not found.' }
  if (therapist.gender !== input.patientGender) {
    return { error: 'Patient and therapist genders do not match for this booking.' }
  }

  let durationMins = 60
  let treatmentId: string | null = null
  let treatmentCategoryId: string | null = null
  let treatmentName: string | null = null
  let priceRm: number | null = null

  if (input.treatmentId) {
    const { data: t, error: tErr } = await db
      .from('treatments')
      .select('id, title, price_rm, category_id, duration, booking_type')
      .eq('id', input.treatmentId)
      .maybeSingle()
    if (tErr) return { error: tErr.message }
    if (!t) return { error: 'Treatment not found.' }
    if (t.booking_type === 'enquiry') return { error: 'This therapy is enquiry-only.' }
    durationMins = parseDurationMins(t.duration)
    treatmentId = t.id
    treatmentCategoryId = t.category_id ?? null
    treatmentName = t.title
    priceRm = t.price_rm ?? null
  } else if (input.durationMins && input.durationMins > 0) {
    durationMins = input.durationMins
    treatmentName = input.treatmentName?.trim() || null
  }

  const dateYMD = mytDayKey(input.startAt)
  const { data: others } = await db
    .from('appointments')
    .select('appointment_date_time, duration_mins, status, payment_expires_at')
    .eq('assigned_therapist_code', therapist.code)
    .in('status', ['scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress'])
  const nowMs = Date.now()
  const busy: Slot[] = (others ?? [])
    .filter((o) => o.appointment_date_time)
    .filter((o) => !(o.status === 'awaiting_payment' && o.payment_expires_at && new Date(o.payment_expires_at).getTime() <= nowMs))
    .map((o) => ({ startISO: o.appointment_date_time as string, durationMins: o.duration_mins ?? 60 }))
  const clash = findClash({ startISO: input.startAt, durationMins }, busy)
  if (clash) {
    return { error: `${therapist.name} (${therapist.code}) is busy until ${freeAtLabel(clash)} — pick another time.` }
  }

  const blocks = await fetchBlocksOnOrAfter(db, dateYMD)
  const intervals = blockedIntervalsForDate(blocks, dateYMD)
  if (isBlocked(intervals, therapist.code, input.startAt, durationMins)) {
    return { error: `${therapist.name} (${therapist.code}) is blocked at that time.` }
  }

  const { error } = await db.from('appointments').insert({
    customer_id: null,
    is_guest: true,
    booking_kind: 'treatment',
    treatment_id: treatmentId,
    treatment_category_id: treatmentCategoryId,
    treatment_name: treatmentName,
    duration_mins: durationMins,
    // Front-desk-made bookings start as 'scheduled' (booked), not 'confirmed'
    // — front desk applies their own colour tag to distinguish confirmed vs
    // reserved, rather than the system asserting a confirmation front desk
    // hasn't actually made yet.
    status: 'scheduled',
    requested_datetime: input.startAt,
    requested_datetime_alt: null,
    appointment_date_time: input.startAt,
    patient_name: input.patientName.trim(),
    patient_phone: input.patientPhone?.trim() || null,
    patient_email: input.patientEmail?.trim() || null,
    patient_gender: input.patientGender,
    gender_requirement: genderRequirementValue(input.patientGender),
    assigned_therapist_code: therapist.code,
    assigned_therapist_name: therapist.name,
    assigned_therapist_gender: therapist.gender,
    room: input.remark?.trim() || null,
    payable_amount_rm: priceRm,
    payment_status: 'unpaid',
    created_by_admin_id: userId,
  })
  if (error) return { error: error.message }

  revalidatePath('/console/schedule')
  revalidatePath('/console')
  return { ok: true }
}

/** Quick internal consultation booking made from the Vaidya schedule grid. */
export async function createConsultationFromGrid(input: {
  vaidyaCode: string
  startAt: string
  patientName: string
  patientPhone?: string | null
  patientEmail?: string | null
  reason?: string | null
}): Promise<Ok | Err> {
  const { userId, db } = await requireStaff(['admin', 'front_desk'])
  if (!input.patientName?.trim()) return { error: 'Enter the patient name.' }
  if (!input.vaidyaCode) return { error: 'Choose a Vaidya.' }

  const vaidya = await vaidyaByCode(input.vaidyaCode)
  if (!vaidya) return { error: 'Vaidya not found.' }

  const dateYMD = mytDayKey(input.startAt)

  // Other consultations on the Vaidya's day — block overlapping starts.
  const { data: busyRows } = await db
    .from('appointments')
    .select('appointment_date_time, duration_mins, status, payment_expires_at')
    .eq('booking_kind', 'consultation')
    .in('status', ['scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress'])
  const nowMs = Date.now()
  const busy: Slot[] = (busyRows ?? [])
    .filter((o) => o.appointment_date_time)
    .filter((o) => !(o.status === 'awaiting_payment' && o.payment_expires_at && new Date(o.payment_expires_at).getTime() <= nowMs))
    .map((o) => ({ startISO: o.appointment_date_time as string, durationMins: o.duration_mins ?? CONSULTATION_MINS }))
  const clash = findClash({ startISO: input.startAt, durationMins: CONSULTATION_MINS }, busy)
  if (clash) return { error: `The Vaidya is busy until ${freeAtLabel(clash)} — pick another time.` }

  // Centre-wide closures and Vaidya-specific leave both apply.
  const blocks = await fetchBlocksOnOrAfter(db, dateYMD)
  const intervals = blockedIntervalsForDate(blocks, dateYMD)
  if (isBlocked(intervals, vaidya.code, input.startAt, CONSULTATION_MINS)) {
    return { error: `${vaidya.name} is blocked at that time.` }
  }

  const { error } = await db.from('appointments').insert({
    customer_id: null,
    is_guest: true,
    booking_kind: 'consultation',
    treatment_id: null,
    treatment_category_id: null,
    treatment_name: null,
    duration_mins: CONSULTATION_MINS,
    status: 'scheduled',
    requested_datetime: input.startAt,
    requested_datetime_alt: null,
    appointment_date_time: input.startAt,
    patient_name: input.patientName.trim(),
    patient_phone: input.patientPhone?.trim() || null,
    patient_email: input.patientEmail?.trim() || null,
    patient_gender: null,
    gender_requirement: 'any',
    assigned_therapist_code: vaidya.code,
    assigned_therapist_name: vaidya.name,
    assigned_therapist_gender: null,
    room: input.reason?.trim() || null,
    payable_amount_rm: null,
    payment_status: 'unpaid',
    created_by_admin_id: userId,
  })
  if (error) return { error: error.message }

  revalidatePath('/console/doctors')
  revalidatePath('/console')
  return { ok: true }
}

/** Reschedule an existing appointment from the staff schedule grid. */
/**
 * The reschedule dialog opens off a client-side grid snapshot that may be
 * stale by the time staff actually click "Reschedule" (grid auto-refreshes
 * every 20s, and a customer's own self-service edit can land in between).
 * The dialog fetches this fresh right when it opens so its default date/time
 * always reflects what's actually in the database, not a cached render.
 */
export async function getAppointmentTiming(id: string): Promise<{ startISO: string; durationMins: number; patientName: string | null } | null> {
  const { db } = await requireStaff(['admin', 'front_desk', 'doctor'])
  const { data } = await db
    .from('appointments')
    .select('appointment_date_time, duration_mins, patient_name')
    .eq('id', id)
    .maybeSingle()
  if (!data || !data.appointment_date_time) return null
  return { startISO: data.appointment_date_time, durationMins: data.duration_mins ?? 60, patientName: data.patient_name ?? null }
}

export async function rescheduleFromGrid(input: {
  appointmentId: string
  newStartAt: string
  newTherapistCode?: string | null
  newPatientName?: string | null
  newDurationMins?: number | null
  room?: string | null
}): Promise<Ok | Err> {
  const { db } = await requireStaff(['admin', 'front_desk'])
  if (!input.appointmentId) return { error: 'Missing appointment.' }
  if (!input.newStartAt) return { error: 'Choose a new time.' }

  const { data: appt, error: apptErr } = await db
    .from('appointments')
    .select('id, status, booking_kind, assigned_therapist_code, patient_gender, gender_requirement, duration_mins, group_id, patient_name, patient_email, treatment_name')
    .eq('id', input.appointmentId)
    .maybeSingle()
  if (apptErr) return { error: apptErr.message }
  if (!appt) return { error: 'Appointment not found.' }
  if (['cancelled', 'completed', 'no_show'].includes(appt.status as string)) {
    return { error: 'This appointment cannot be rescheduled.' }
  }

  const isGroup = !!appt.group_id
  const isConsultation = appt.booking_kind === 'consultation'
  const durationMins = isConsultation ? CONSULTATION_MINS : (input.newDurationMins ?? appt.duration_mins ?? 60)
  const dateYMD = mytDayKey(input.newStartAt)

  const therapistCode = (input.newTherapistCode?.trim() || appt.assigned_therapist_code || '')
  if (isConsultation) {
    const { data: consults } = await db
      .from('appointments')
      .select('appointment_date_time, duration_mins')
      .eq('booking_kind', 'consultation')
      .eq('assigned_therapist_code', appt.assigned_therapist_code)
      .in('status', ['scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress'])
      .neq('id', input.appointmentId)
    const busy: Slot[] = (consults ?? [])
      .filter((o) => o.appointment_date_time)
      .map((o) => ({ startISO: o.appointment_date_time as string, durationMins: o.duration_mins ?? CONSULTATION_MINS }))
    const clash = findClash({ startISO: input.newStartAt, durationMins }, busy)
    if (clash) {
      return { error: `The Vaidya is busy until ${freeAtLabel(clash)} — pick another time.` }
    }
    const blocks = await fetchBlocksOnOrAfter(db, dateYMD)
    const intervals = blockedIntervalsForDate(blocks, dateYMD)
    if (isBlocked(intervals, appt.assigned_therapist_code ?? VAIDYA_BLOCK_CODE, input.newStartAt, durationMins)) {
      return { error: 'The Vaidya or centre is unavailable at that time.' }
    }
  } else {
    const therapist = await therapistByCode(therapistCode)
    if (!therapist) return { error: 'Therapist not found.' }
    if (!therapistMatchesRequirement(therapist.gender, appt.gender_requirement as string | null)) {
      const need = appt.gender_requirement === 'men_only' ? 'male' : 'female'
      return { error: `Same-gender policy: this patient must be assigned a ${need} therapist.` }
    }

    const { data: others } = await db
      .from('appointments')
      .select('appointment_date_time, duration_mins, status, payment_expires_at')
      .eq('assigned_therapist_code', therapist.code)
      .in('status', ['scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress'])
      .neq('id', input.appointmentId)
    const nowMs = Date.now()
    const busy: Slot[] = (others ?? [])
      .filter((o) => o.appointment_date_time)
      .filter((o) => !(o.status === 'awaiting_payment' && o.payment_expires_at && new Date(o.payment_expires_at).getTime() <= nowMs))
      .map((o) => ({ startISO: o.appointment_date_time as string, durationMins: o.duration_mins ?? 60 }))
    const clash = findClash({ startISO: input.newStartAt, durationMins }, busy)
    if (clash) {
      return { error: `${therapist.name} (${therapist.code}) is busy until ${freeAtLabel(clash)} — pick another time.` }
    }

    const blocks = await fetchBlocksOnOrAfter(db, dateYMD)
    const intervals = blockedIntervalsForDate(blocks, dateYMD)
    if (isBlocked(intervals, therapist.code, input.newStartAt, durationMins)) {
      return { error: `${therapist.name} (${therapist.code}) is blocked at that time.` }
    }
  }

  const patch: Record<string, unknown> = {
    appointment_date_time: input.newStartAt,
    requested_datetime: input.newStartAt,
    updated_at: new Date().toISOString(),
    room: input.room?.trim() || null,
  }
  if (input.newPatientName?.trim()) {
    patch.patient_name = input.newPatientName.trim()
  }
  if (!isConsultation && input.newDurationMins) {
    patch.duration_mins = durationMins
  }
  if (!isConsultation && input.newTherapistCode) {
    const therapist = await therapistByCode(input.newTherapistCode)
    if (therapist) {
      patch.assigned_therapist_code = therapist.code
      patch.assigned_therapist_name = therapist.name
      patch.assigned_therapist_gender = therapist.gender
    }
  }

  const { error } = await db.from('appointments').update(patch).eq('id', input.appointmentId)
  if (error) return { error: error.message }

  revalidatePath('/console/schedule')
  revalidatePath(`/console/${input.appointmentId}`)
  revalidatePath('/console')
  revalidatePath('/doctor')
  if (isGroup) {
    // Notify the group lead if possible, but do not block on it.
    const { data: groupRows } = await db.from('appointments').select('id, patient_email').eq('group_id', appt.group_id)
    if (groupRows && groupRows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lead = (groupRows as any[]).find((r: any) => r.patient_email) || groupRows[0]
      await import('@/lib/booking/notify')
        .then((mod) =>
          mod.notifyManagedReschedule({
            to: lead.patient_email ?? null,
            name: appt.patient_name ?? 'Guest',
            treatmentName: appt.treatment_name ?? 'Treatment',
            oldISO: '',
            newISO: input.newStartAt,
            bookingKind: 'treatment',
            statusUrl: `${BOOKING_SITE_URL}/book/request/${input.appointmentId}?t=${createBookingToken(input.appointmentId)}`,
            notifyStaff: false,
          }),
        )
        .catch((e) => console.error('[staff/actions] reschedule notify failed:', e))
    }
  }
  return { ok: true }
}

/** Doctor/admin saves clinical notes (vaidya-only field). */
export async function saveClinicalNotes(id: string, notes: string): Promise<Ok | Err> {
  const { db } = await requireStaff(['admin', 'doctor'])
  const { error } = await db.from('appointments').update({ clinical_notes: notes }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/doctor/${id}`)
  return { ok: true }
}

/**
 * After a consultation, the practitioner clears the patient for a treatment.
 * Records the outcome and flags it so the treatment booking can proceed.
 */
export async function unlockTreatment(consultationId: string, note: string): Promise<Ok | Err> {
  const { db } = await requireStaff(['admin', 'doctor'])
  const outcome = note.trim()
  if (!outcome) return { error: 'Record the consultation outcome before clearing treatment.' }

  const nowMs = Date.now()
  const { data: consultation, error: lookupError } = await db
    .from('appointments')
    .select('booking_kind, status, appointment_date_time')
    .eq('id', consultationId)
    .maybeSingle()
  if (lookupError) return { error: lookupError.message }
  if (!consultation) return { error: 'Consultation not found.' }
  if (!canClearConsultation({
    bookingKind: consultation.booking_kind as BookingKind,
    status: consultation.status as BookingStatus,
    appointmentISO: consultation.appointment_date_time,
    nowMs,
  })) {
    return { error: 'Only an attended consultation at or after its appointment time can be cleared.' }
  }

  const { data: updated, error } = await db
    .from('appointments')
    .update({ consultation_outcome: outcome, treatment_unlocked: true })
    .eq('id', consultationId)
    .eq('booking_kind', 'consultation')
    .in('status', CLEARABLE_CONSULTATION_STATUSES)
    .lte('appointment_date_time', new Date(nowMs).toISOString())
    .select('id')
    .maybeSingle()
  if (error) return { error: error.message }
  if (!updated) return { error: 'This consultation is no longer eligible for clearance.' }
  revalidatePath(`/doctor/${consultationId}`)
  return { ok: true }
}

/* ── Schedule blocks (staff leave / closures / manual blocks) ───────── */

export interface BlockInput {
  therapistCode: string | null // null = all therapists / centre closed
  startAt: string
  endAt: string
  allDay: boolean
  recurrence: 'none' | 'weekly' | 'monthly'
  untilDate: string | null
  reason: string
}

/** 'YYYY-MM-DD' + n days, in Malaysia time. */
function shiftDayMYT(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00+08:00`)
  d.setDate(d.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

export async function createBlock(input: BlockInput): Promise<Ok | Err> {
  const { userId, db } = await requireStaff(['admin', 'front_desk'])
  if (!input.startAt || !input.endAt) return { error: 'Start and end times are required.' }
  if (new Date(input.endAt).getTime() <= new Date(input.startAt).getTime()) {
    return { error: 'End must be after start.' }
  }

  // No double-blocking: reject a block whose window is already covered for the
  // same therapist (or centre-wide). Recurring inputs are checked on their first
  // occurrence; multi-day spans are checked day by day (capped at 62 days).
  const existing = await fetchBlocksOnOrAfter(db, mytDayKey(input.startAt))
  const newStartMs = new Date(input.startAt).getTime()
  const newEndMs = new Date(input.endAt).getTime()
  const lastDay = mytDayKey(input.endAt)
  let day = mytDayKey(input.startAt)
  for (let i = 0; i < 62 && day <= lastDay; i++, day = shiftDayMYT(day, 1)) {
    const dayStartMs = new Date(`${day}T00:00:00+08:00`).getTime()
    const dayEndMs = dayStartMs + 86_400_000
    const sMs = input.allDay ? dayStartMs : Math.max(newStartMs, dayStartMs)
    const eMs = input.allDay ? dayEndMs : Math.min(newEndMs, dayEndMs)
    const clash = blockedIntervalsForDate(existing, day).find(
      (iv) =>
        sMs < iv.endMs &&
        iv.startMs < eMs &&
        (input.therapistCode ? iv.therapistCode === null || iv.therapistCode === input.therapistCode : iv.therapistCode === null),
    )
    if (clash) {
      const t = clash.therapistCode ? await therapistByCode(clash.therapistCode) : null
      const who = clash.therapistCode === null ? 'the whole centre' : t?.name ?? clash.therapistCode
      return {
        error: `That time is already blocked for ${who}${clash.reason ? ` (${clash.reason})` : ''} — tap the existing block to edit or remove it.`,
      }
    }
  }

  const { error } = await db.from('schedule_blocks').insert({
    therapist_code: input.therapistCode || null,
    start_at: input.startAt,
    end_at: input.endAt,
    all_day: input.allDay,
    recurrence: input.recurrence,
    until_date: input.untilDate || null,
    reason: input.reason?.trim() || null,
    created_by: userId,
  })
  if (error) return { error: error.message }
  revalidatePath('/console/blocks')
  revalidatePath('/console/schedule')
  return { ok: true }
}

export async function deleteBlock(id: string): Promise<Ok | Err> {
  const { db } = await requireStaff(['admin', 'front_desk'])
  const { error } = await db.from('schedule_blocks').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/console/blocks')
  revalidatePath('/console/schedule')
  return { ok: true }
}

/** Edit the reason shown on an existing block (from the schedule grid). */
export async function updateBlockReason(id: string, reason: string): Promise<Ok | Err> {
  const { db } = await requireStaff(['admin', 'front_desk'])
  if (!id) return { error: 'Missing block.' }
  const { error } = await db.from('schedule_blocks').update({ reason: reason.trim() || null }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/console/blocks')
  revalidatePath('/console/schedule')
  return { ok: true }
}

/* ── Customer announcements (public banner) ─────────────────────────── */

export interface AnnouncementInput {
  kind: 'closure' | 'message'
  message: string
  /** Required for closures. 'YYYY-MM-DD'. */
  startDate: string | null
  endDate: string | null
}

/**
 * Publish an announcement. A 'closure' also creates a linked centre-closed
 * all-day block so customers can't book those dates; a 'message' is banner-only.
 */
export async function createAnnouncement(input: AnnouncementInput): Promise<Ok | Err> {
  const { userId, db } = await requireStaff(['admin', 'front_desk'])
  const message = input.message?.trim()
  if (!message) return { error: 'Enter a message.' }
  if (input.kind === 'closure' && !input.startDate) return { error: 'Pick the closure date.' }
  if (input.endDate && input.startDate && input.endDate < input.startDate) {
    return { error: 'End date must be on or after the start date.' }
  }

  let blockId: string | null = null
  if (input.kind === 'closure') {
    const start = input.startDate as string
    const end = input.endDate || start
    const { data: block, error: bErr } = await db
      .from('schedule_blocks')
      .insert({
        therapist_code: null, // whole centre
        start_at: new Date(`${start}T00:00:00+08:00`).toISOString(),
        end_at: new Date(`${end}T23:59:00+08:00`).toISOString(),
        all_day: true,
        recurrence: 'none',
        until_date: null,
        reason: message,
        created_by: userId,
      })
      .select('id')
      .single()
    if (bErr) return { error: bErr.message }
    blockId = block.id as string
  }

  const { error } = await db.from('announcements').insert({
    kind: input.kind,
    message,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    block_id: blockId,
    created_by: userId,
  })
  if (error) return { error: error.message }
  revalidatePath('/console/announcements')
  revalidateTag('announcements')
  return { ok: true }
}

/** Remove an announcement. A closure also deletes its block, reopening bookings. */
export async function deleteAnnouncement(id: string): Promise<Ok | Err> {
  const { db } = await requireStaff(['admin', 'front_desk'])
  const { data: a } = await db.from('announcements').select('block_id').eq('id', id).maybeSingle()
  const { error } = await db.from('announcements').delete().eq('id', id)
  if (error) return { error: error.message }
  if (a?.block_id) await db.from('schedule_blocks').delete().eq('id', a.block_id)
  revalidatePath('/console/announcements')
  revalidateTag('announcements')
  return { ok: true }
}

const STAFF_COLOR_TAGS: readonly StaffColorTag[] = [
  'red', 'blue_light', 'blue_dark', 'green_light', 'green_dark', 'purple', 'pink', 'black',
]

/**
 * Manual schedule colour tag front desk can set on a booking for their own
 * bookkeeping (temporary booking, needs attention, booking between 2
 * centres, etc.) — independent of the automatic status colouring. `null`
 * clears the tag back to the automatic colour.
 */
export async function setAppointmentColorTag(
  appointmentId: string,
  colorTag: StaffColorTag | null,
): Promise<Ok | Err> {
  const { db } = await requireStaff(['admin', 'front_desk'])
  if (colorTag !== null && !STAFF_COLOR_TAGS.includes(colorTag)) {
    return { error: 'Invalid colour tag.' }
  }
  const { error } = await db
    .from('appointments')
    .update({ staff_color_tag: colorTag })
    .eq('id', appointmentId)
  if (error) return { error: error.message }
  revalidatePath('/console/schedule')
  return { ok: true }
}
