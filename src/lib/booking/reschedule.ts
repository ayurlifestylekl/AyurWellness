import { createClient } from '@supabase/supabase-js'

import {
  blockedIntervalsForDate,
  isBlocked,
  type ScheduleBlock,
} from './blocks'
import { managementEligibility, RESCHEDULE_CUTOFF_MS } from './management-policy'
import type { ManagementActionResult } from './management-actions'
import {
  buildGroupRescheduleChanges,
  type GroupRescheduleChange,
} from './group-management'
import { countOverlapping, type Slot } from './scheduling'
import { CONSULTATION_MINS, validateSubmittedSlot } from './slots'
import { createBookingToken } from './token'
import { notifyManagedReschedule, BOOKING_SITE_URL } from './notify'
import { mytDayKey } from '@/lib/datetime'
import { therapistsForGender, VAIDYA_BLOCK_CODE } from '@/lib/staff/therapists'
import type { Gender } from '@/types/booking'

const CLOSED_MESSAGE = 'The online rescheduling window has closed.'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const OCCUPYING_STATUSES = ['scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress']

export interface RescheduleBookingInput {
  anchorId: string
  appointmentIds: string[]
  token?: string | null
  selections: Record<string, string>
  wholeGroup: boolean
}

export function validateRescheduleScope(input: {
  anchorId: string
  appointmentIds: string[]
  wholeGroup: boolean
}): { ok: true; appointmentIds: string[] } | { error: string } {
  if (input.appointmentIds.length === 0) return { error: 'Choose at least one booking to reschedule.' }
  if (new Set(input.appointmentIds).size !== input.appointmentIds.length) {
    return { error: 'Duplicate appointments cannot be rescheduled.' }
  }
  if (input.wholeGroup && !input.appointmentIds.includes(input.anchorId)) {
    return { error: 'The managed booking must be included in the move.' }
  }
  if (!input.wholeGroup && input.appointmentIds.length !== 1) {
    return { error: 'Choose either this appointment or the whole active group.' }
  }
  return { ok: true, appointmentIds: [...input.appointmentIds] }
}

export interface RescheduleClaimInput {
  bookingKind: string | null | undefined
  requestedDurationMins: number | null | undefined
  genderRequirement?: string | null
}

export type RescheduleClaim = {
  durationMins: number
  resourceType: 'gender' | 'consultation'
  resourceKey: string
}

/** Canonical resource values are derived from persisted booking data, never UI values. */
export function buildRescheduleClaim(input: RescheduleClaimInput): RescheduleClaim | { error: string } {
  if (input.bookingKind === 'consultation') {
    return {
      durationMins: CONSULTATION_MINS,
      resourceType: 'consultation',
      resourceKey: 'vaidya',
    }
  }
  if (!Number.isInteger(input.requestedDurationMins) || Number(input.requestedDurationMins) < 1) {
    return { error: 'This booking has an invalid treatment duration.' }
  }
  if (input.genderRequirement !== 'men_only' && input.genderRequirement !== 'ladies_only') {
    return { error: 'This booking has an invalid therapist requirement.' }
  }
  return {
    durationMins: Number(input.requestedDurationMins),
    resourceType: 'gender',
    resourceKey: input.genderRequirement,
  }
}

/** Pure preflight seam. The exact cutoff is allowed and all comparisons use server time. */
export async function prepareReschedule(input: {
  appointmentAt: string
  newStart: string
  nowMs: number
}): Promise<{ ok: true; newStart: string } | { error: string }> {
  const appointmentMs = Date.parse(input.appointmentAt)
  const newStartMs = Date.parse(input.newStart)
  if (!Number.isFinite(appointmentMs) || !Number.isFinite(newStartMs) || !Number.isFinite(input.nowMs)) {
    return { error: 'Please choose a valid appointment time.' }
  }
  if (appointmentMs - input.nowMs < RESCHEDULE_CUTOFF_MS) return { error: CLOSED_MESSAGE }
  if (newStartMs <= input.nowMs) return { error: 'Please choose a future appointment time.' }
  return { ok: true, newStart: new Date(newStartMs).toISOString() }
}

export interface RescheduleFormBooking {
  id: string
  bookingKind: 'treatment' | 'consultation'
  treatmentId: string | null
  patientGender: Gender | ''
  patientName: string
  oldStart: string
}

type AppointmentRow = {
  id: string
  customer_id: string | null
  created_at: string
  appointment_date_time: string
  status: string
  payment_status: string
  payment_expires_at: string | null
  booking_kind: string | null
  treatment_id: string | null
  duration_mins: number | null
  patient_gender: string | null
  patient_name: string | null
  patient_email: string | null
  treatment_name: string | null
  gender_requirement: string | null
  group_id: string | null
  group_management_active: boolean | null
}

type RpcChange = {
  appointment_id: string
  resource_type: 'gender' | 'consultation'
  resource_key: string
  capacity: number
  old_start: string
  new_start: string
  duration_mins: number
  detach_from_group: boolean
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

type ManagementError = {
  error: string
  code: 'UNAUTHORIZED' | 'POLICY_CLOSED' | 'SLOT_FULL' | 'INVALID_INPUT' | 'PROVIDER_ERROR'
}

function publicFailure(code: ManagementError['code'], error: string): ManagementError {
  return { code, error }
}

function genderForRequirement(requirement: string): Gender | null {
  return requirement === 'men_only' ? 'male' : requirement === 'ladies_only' ? 'female' : null
}

function exactIdSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false
  return [...left].sort().every((id, index) => id === [...right].sort()[index])
}

/** Server-only form metadata. The caller is the already-authorized management page. */
export async function getRescheduleFormBookings(ids: string[]): Promise<RescheduleFormBooking[]> {
  if (!ids.length || ids.some((id) => !UUID_RE.test(id))) return []
  const { data, error } = await admin()
    .from('appointments')
    .select('id, booking_kind, treatment_id, patient_gender, patient_name, appointment_date_time')
    .in('id', ids)
  if (error) return []
  return (data ?? []).map((row) => ({
    id: row.id,
    bookingKind: row.booking_kind === 'consultation' ? 'consultation' : 'treatment',
    treatmentId: row.treatment_id ?? null,
    patientGender: row.patient_gender === 'male' || row.patient_gender === 'female' ? row.patient_gender : '',
    patientName: row.patient_name ?? 'Guest',
    oldStart: row.appointment_date_time,
  }))
}

/**
 * Authorize, preflight, and atomically move all requested appointments. The RPC
 * repeats every concurrency-sensitive check inside one database transaction.
 */
export async function rescheduleBooking(
  input: RescheduleBookingInput,
): Promise<ManagementActionResult<{ appointmentIds: string[] }>> {
  'use server'

  if (!input || !UUID_RE.test(input.anchorId) || !Array.isArray(input.appointmentIds)
    || typeof input.wholeGroup !== 'boolean') {
    return publicFailure('INVALID_INPUT', 'Choose a valid booking to reschedule.')
  }
  if (input.token != null && typeof input.token !== 'string') {
    return publicFailure('INVALID_INPUT', 'The booking access token is invalid.')
  }
  if (input.appointmentIds.some((id) => typeof id !== 'string' || !UUID_RE.test(id))) {
    return publicFailure('INVALID_INPUT', 'Choose at least one valid booking to reschedule.')
  }
  const scope = validateRescheduleScope(input)
  if ('error' in scope) return publicFailure('INVALID_INPUT', scope.error)
  const appointmentIds = scope.appointmentIds
  if (!input.selections || typeof input.selections !== 'object' || Array.isArray(input.selections)
    || !exactIdSet(Object.keys(input.selections), appointmentIds)
    || Object.values(input.selections).some((selection) => typeof selection !== 'string')) {
    return publicFailure('INVALID_INPUT', 'Choose a new time for every selected booking.')
  }

  const { canManageBookingTarget } = await import('./management-access')
  if (!(await canManageBookingTarget(input.anchorId, input.anchorId, input.token))) {
    return publicFailure('UNAUTHORIZED', 'You are not authorised to reschedule this booking.')
  }

  const sb = admin()
  const { data, error } = await sb
    .from('appointments')
    .select('id, customer_id, created_at, appointment_date_time, status, payment_status, payment_expires_at, booking_kind, treatment_id, duration_mins, patient_gender, patient_name, patient_email, treatment_name, gender_requirement, group_id, group_management_active')
    .in('id', appointmentIds)
  if (error) return publicFailure('PROVIDER_ERROR', 'We could not check this booking right now. Please try again.')
  const rows = (data ?? []) as AppointmentRow[]
  if (rows.length !== appointmentIds.length) {
    return publicFailure('INVALID_INPUT', 'One of the selected bookings no longer exists.')
  }

  for (const id of appointmentIds) {
    if (!(await canManageBookingTarget(input.anchorId, id, input.token))) {
      return publicFailure('UNAUTHORIZED', 'You are not authorised to reschedule one of these bookings.')
    }
  }

  if (input.wholeGroup) {
    const anchor = rows.find((row) => row.id === input.anchorId)!
    if (!anchor.group_id) {
      if (appointmentIds.length !== 1) {
        return publicFailure('INVALID_INPUT', 'This booking is not part of a managed group.')
      }
    } else {
      const { data: groupRows, error: groupError } = await sb
        .from('appointments')
        .select('id')
        .eq('group_id', anchor.group_id)
        .eq('group_management_active', true)
      if (groupError) return publicFailure('PROVIDER_ERROR', 'We could not check the booking group right now.')
      if (!exactIdSet((groupRows ?? []).map((row) => row.id), appointmentIds)) {
        return publicFailure('INVALID_INPUT', 'Select every active group member to move the whole group.')
      }
    }
  }

  let managementChanges: GroupRescheduleChange[]
  try {
    managementChanges = buildGroupRescheduleChanges(rows, input.selections, {
      wholeGroup: input.wholeGroup,
    })
  } catch {
    return publicFailure('INVALID_INPUT', 'Choose a new time for every selected booking.')
  }
  const managementChangeById = new Map(
    managementChanges.map((change) => [change.appointmentId, change]),
  )

  const nowMs = Date.now()
  const nowISO = new Date(nowMs).toISOString()
  const changes: RpcChange[] = []
  for (const row of rows.sort((a, b) => a.id.localeCompare(b.id))) {
    const policy = managementEligibility({
      createdAt: row.created_at,
      appointmentAt: row.appointment_date_time,
      status: row.status,
      paymentStatus: row.payment_status,
      nowMs,
    })
    if (!policy.canReschedule) return publicFailure('POLICY_CLOSED', CLOSED_MESSAGE)

    const prepared = await prepareReschedule({
      appointmentAt: row.appointment_date_time,
      newStart: input.selections[row.id],
      nowMs,
    })
    if ('error' in prepared) {
      return publicFailure(
        prepared.error === CLOSED_MESSAGE ? 'POLICY_CLOSED' : 'INVALID_INPUT',
        prepared.error,
      )
    }
    const claim = buildRescheduleClaim({
      bookingKind: row.booking_kind,
      requestedDurationMins: row.duration_mins,
      genderRequirement: row.gender_requirement,
    })
    if ('error' in claim) return publicFailure('INVALID_INPUT', claim.error)
    const slot = validateSubmittedSlot({
      iso: prepared.newStart,
      durationMins: claim.durationMins,
      nowMs,
      leadTimeHours: 0,
      kind: claim.resourceType === 'consultation' ? 'consultation' : 'treatment',
    })
    if ('error' in slot) return publicFailure('INVALID_INPUT', slot.error)

    changes.push({
      appointment_id: row.id,
      resource_type: claim.resourceType,
      resource_key: claim.resourceKey,
      capacity: claim.resourceType === 'consultation' ? 1 : 0,
      old_start: row.appointment_date_time,
      new_start: prepared.newStart,
      duration_mins: claim.durationMins,
      detach_from_group: !!row.group_id && managementChangeById.get(row.id)?.detachFromGroup === true,
    })
  }

  for (const change of changes) {
    const dateYMD = mytDayKey(change.new_start)
    const malaysiaDayStart = new Date(`${dateYMD}T00:00:00+08:00`).getTime()
    const { data: blockRows, error: blockError } = await sb
      .from('schedule_blocks')
      .select('id, therapist_code, start_at, end_at, all_day, recurrence, until_date, reason')
      .lte('start_at', new Date(malaysiaDayStart + 86_400_000).toISOString())
    if (blockError) {
      return publicFailure('PROVIDER_ERROR', 'We could not verify clinic availability right now.')
    }
    const intervals = blockedIntervalsForDate((blockRows ?? []) as ScheduleBlock[], dateYMD)
    if (change.resource_type === 'gender') {
      const gender = genderForRequirement(change.resource_key)
      if (!gender) return publicFailure('INVALID_INPUT', 'This booking has an invalid therapist requirement.')
      change.capacity = (await therapistsForGender(gender))
        .filter((therapist) => !isBlocked(
          intervals,
          therapist.code,
          change.new_start,
          change.duration_mins,
        ))
        .length
      if (change.capacity < 1) {
        return publicFailure('SLOT_FULL', 'No suitable therapist is available at that time.')
      }
    } else {
      if (isBlocked(intervals, VAIDYA_BLOCK_CODE, change.new_start, CONSULTATION_MINS)) {
        return publicFailure('SLOT_FULL', 'The Vaidya or centre is unavailable at that time.')
      }
    }
  }

  const { data: occupiedData, error: occupiedError } = await sb
    .from('appointments')
    .select('id, appointment_date_time, duration_mins, booking_kind, gender_requirement, status, payment_expires_at')
    .in('status', OCCUPYING_STATUSES)
  if (occupiedError) return publicFailure('PROVIDER_ERROR', 'We could not verify live availability right now.')
  const movedIds = new Set(appointmentIds)
  const occupied = (occupiedData ?? []).filter((row) => {
    if (movedIds.has(row.id) || !row.appointment_date_time) return false
    return !(row.status === 'awaiting_payment' && row.payment_expires_at && Date.parse(row.payment_expires_at) <= nowMs)
  })

  for (const change of changes) {
    const candidate: Slot = { startISO: change.new_start, durationMins: change.duration_mins }
    const existing = occupied.filter((row) => {
      const sameResource = change.resource_type === 'consultation'
        ? row.booking_kind === 'consultation'
        : row.gender_requirement === change.resource_key
      return sameResource && countOverlapping(candidate, [{
        startISO: row.appointment_date_time,
        durationMins: row.duration_mins ?? (change.resource_type === 'consultation' ? CONSULTATION_MINS : 60),
      }]) > 0
    }).length
    const batch = changes.filter((other) => other.appointment_id !== change.appointment_id
      && other.resource_type === change.resource_type
      && other.resource_key === change.resource_key
      && countOverlapping(candidate, [{ startISO: other.new_start, durationMins: other.duration_mins }]) > 0).length
    if (existing + batch >= change.capacity) {
      return publicFailure('SLOT_FULL', 'That slot was just taken. Please choose another time.')
    }
  }

  const actorType = input.token ? 'guest' : 'customer'
  const { error: rpcError } = await sb.rpc('reschedule_bookings', {
    p_changes: changes,
    p_actor_type: actorType,
    p_now: nowISO,
  })
  if (rpcError) {
    if (/SLOT_FULL/i.test(rpcError.message)) {
      return publicFailure('SLOT_FULL', 'That slot was just taken. Please choose another time.')
    }
    if (/POLICY_CLOSED/i.test(rpcError.message)) return publicFailure('POLICY_CLOSED', CLOSED_MESSAGE)
    if (/INVALID_INPUT/i.test(rpcError.message)) {
      return publicFailure('INVALID_INPUT', 'The booking changed while you were rescheduling. Please review it and try again.')
    }
    console.error('[booking-reschedule] atomic RPC failed:', rpcError.code ?? 'unknown')
    return publicFailure('PROVIDER_ERROR', 'We could not reschedule the booking right now. No changes were made.')
  }

  // Best-effort notification per changed row — never rolls back a committed reschedule.
  for (const change of changes) {
    const row = rows.find((r) => r.id === change.appointment_id)
    if (!row) continue
    await notifyManagedReschedule({
      to: row.patient_email,
      name: row.patient_name,
      treatmentName: row.treatment_name,
      oldISO: change.old_start,
      newISO: change.new_start,
      bookingKind: row.booking_kind === 'consultation' ? 'consultation' : 'treatment',
      statusUrl: `${BOOKING_SITE_URL}/book/request/${row.id}?t=${createBookingToken(row.id)}`,
    }).catch((e) => {
      console.error('[booking-reschedule] notifyManagedReschedule failed for', row.id, e)
    })
  }

  return { ok: true, data: { appointmentIds } }
}
