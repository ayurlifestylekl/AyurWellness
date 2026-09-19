import 'server-only'
import type { BookingKind, BookingStatus, DoctorPatientView, HealthIntake, StaffAppointment, StaffColorTag } from '@/types/booking'
import { APPOINTMENT_COLUMNS, mapAppointmentRow } from '@/lib/booking/map'
import { canClearConsultation, CLEARABLE_CONSULTATION_STATUSES } from '@/lib/booking/consultation-rules'
import type { Therapist } from './therapists'
import { THERAPIST_BUFFER_MINS } from '@/lib/booking/scheduling'
import { CONSULTATION_MINS } from '@/lib/booking/slots'
import { mytTodayRange, mytTimeOfDay } from '@/lib/datetime'
import { fetchBlocksOnOrAfter, blockedIntervalsForDate } from '@/lib/booking/blocks'
import type { ServiceDb } from './guard'

/** Statuses that count as a real, booked patient for the doctor view. */
export const BOOKED_STATUSES: BookingStatus[] = ['confirmed', 'checked_in', 'in_progress', 'completed']

/**
 * Doctors may not see customer contact details (PDPA) — only name, gender and
 * health history. Strip the phone so it never reaches a doctor-facing view.
 */
export function redactContact<T extends { patientPhone: string | null }>(a: T): T {
  return { ...a, patientPhone: null }
}
export const redactContactList = <T extends { patientPhone: string | null }>(list: T[]): T[] =>
  list.map(redactContact)

export interface AppointmentFilters {
  status?: BookingStatus | BookingStatus[]
  kind?: BookingKind
  search?: string
  /** Only treatments still waiting for front desk to name a therapist. */
  unassignedOnly?: boolean
  /** 'activity' = most recently touched first (the "All" view); default = by requested time. */
  orderBy?: 'requested' | 'activity'
}

export async function listAppointments(
  db: ServiceDb,
  filters: AppointmentFilters = {},
): Promise<StaffAppointment[]> {
  let q = db.from('appointments').select(APPOINTMENT_COLUMNS)

  if (filters.status) {
    q = Array.isArray(filters.status) ? q.in('status', filters.status) : q.eq('status', filters.status)
  }
  if (filters.kind) q = q.eq('booking_kind', filters.kind)
  if (filters.unassignedOnly) {
    // Consultations are conducted by the Vaidya and never get a therapist.
    q = q.is('assigned_therapist_code', null).eq('booking_kind', 'treatment')
  }
  if (filters.search) {
    const raw = filters.search.trim().replace(/^#/, '')
    const like = `%${raw}%`
    const prefix = `${raw}%`
    q = q.or(`id::text.ilike.${prefix},patient_name.ilike.${like},patient_phone.ilike.${like},treatment_name.ilike.${like}`)
  }

  const { data, error } =
    filters.orderBy === 'activity'
      ? await q.order('updated_at', { ascending: false })
      : await q.order('requested_datetime', { ascending: true })
  if (error) {
    console.error('[staff/appointments] list:', error.message)
    return []
  }
  return (data ?? []).map(mapAppointmentRow)
}

const DETAIL_COLUMNS = `${APPOINTMENT_COLUMNS}, patient_email, pre_visit_form, clinical_notes, customer_id, consultation_outcome, payment_status, payment_url`

/** Rich appointment detail incl. health context. Used by console + doctor detail. */
export async function getAppointmentDetail(db: ServiceDb, id: string): Promise<DoctorPatientView | null> {
  const { data: r, error } = await db.from('appointments').select(DETAIL_COLUMNS).eq('id', id).maybeSingle()
  if (error) {
    console.error('[staff/appointments] detail:', error.message)
    return null
  }
  if (!r) return null

  let accountHealth: DoctorPatientView['accountHealth'] = null
  if (r.customer_id) {
    // Requires the users profile-fields migration (20260518). Degrades to null
    // until applied — booking intake still provides health context.
    const { data: u } = await db
      .from('users')
      .select('allergies, current_medications, medical_conditions, height_cm, weight_kg')
      .eq('id', r.customer_id)
      .maybeSingle()
    if (u) {
      accountHealth = {
        allergies: u.allergies ?? null,
        medications: u.current_medications ?? null,
        conditions: u.medical_conditions ?? null,
        heightCm: u.height_cm ?? null,
        weightKg: u.weight_kg ?? null,
      }
    }
  }

  return {
    ...mapAppointmentRow(r),
    patientEmail: r.patient_email ?? null,
    healthIntake: (r.pre_visit_form ?? null) as HealthIntake | null,
    accountHealth,
    clinicalNotes: r.clinical_notes ?? null,
    consultationOutcome: r.consultation_outcome ?? null,
  }
}

/** All guests in a group booking, in stable creation order. [] if not a group. */
export async function getGroupAppointments(db: ServiceDb, groupId: string): Promise<StaffAppointment[]> {
  const { data, error } = await db
    .from('appointments')
    .select(APPOINTMENT_COLUMNS)
    .eq('group_id', groupId)
    .order('updated_at', { ascending: true })
  if (error) {
    console.error('[staff/appointments] group:', error.message)
    return []
  }
  return (data ?? []).map(mapAppointmentRow)
}

/** Doctor's list — only patients who have actually booked (confirmed+). */
export async function getDoctorPatients(db: ServiceDb): Promise<StaffAppointment[]> {
  const { data, error } = await db
    .from('appointments')
    .select(APPOINTMENT_COLUMNS)
    .in('status', BOOKED_STATUSES)
    .order('appointment_date_time', { ascending: true })
  if (error) {
    console.error('[staff/appointments] doctorPatients:', error.message)
    return []
  }
  return (data ?? []).map(mapAppointmentRow)
}

/** Incoming requests the doctor can act on (approve / awaiting customer payment). */
export const INCOMING_STATUSES: BookingStatus[] = ['pending', 'scheduled', 'awaiting_payment']

/** Requests awaiting approval/payment — shown to the doctor so they can approve. */
export async function getIncomingRequests(db: ServiceDb): Promise<StaffAppointment[]> {
  const { data, error } = await db
    .from('appointments')
    .select(APPOINTMENT_COLUMNS)
    .in('status', INCOMING_STATUSES)
    .order('requested_datetime', { ascending: true })
  if (error) {
    console.error('[staff/appointments] incoming:', error.message)
    return []
  }
  return (data ?? []).map(mapAppointmentRow)
}

/** Active (front-desk relevant) statuses for a day's running schedule. */
const ACTIVE_TODAY_STATUSES: BookingStatus[] = ['confirmed', 'checked_in', 'in_progress', 'completed']

/** Today's booked appointments, ordered by time — the front-desk day board. */
export async function getTodayAppointments(db: ServiceDb): Promise<StaffAppointment[]> {
  const { startISO, endISO } = mytTodayRange() // "today" in Malaysia, not server (UTC)

  const { data, error } = await db
    .from('appointments')
    .select(APPOINTMENT_COLUMNS)
    .in('status', ACTIVE_TODAY_STATUSES)
    .gte('appointment_date_time', startISO)
    .lt('appointment_date_time', endISO)
    .order('appointment_date_time', { ascending: true })
  if (error) {
    console.error('[staff/appointments] today:', error.message)
    return []
  }
  return (data ?? []).map(mapAppointmentRow)
}

export interface TherapistStatus {
  therapist: Therapist
  busy: boolean
  /** When they next become free (treatment end + buffer), if busy now. */
  freeAtISO: string | null
  /** Patient they're currently with, if busy. */
  withPatient: string | null
  /** Count of remaining appointments today (now or later). */
  remainingToday: number
}

/**
 * Live therapist availability for the front desk: who is occupied right now
 * (session + buffer) and when each frees up, based on today's assignments.
 */
export async function getTherapistBoard(db: ServiceDb): Promise<TherapistStatus[]> {
  const { getAllTherapists } = await import('./therapists')
  const [today, therapists] = await Promise.all([getTodayAppointments(db), getAllTherapists()])
  const now = Date.now()
  const bufferMs = THERAPIST_BUFFER_MINS * 60 * 1000

  return therapists.filter((t) => t.active !== false).map((therapist) => {
    const mine = today.filter((a) => a.assignedTherapistCode === therapist.code && a.appointmentDatetime)
    let busy = false
    let freeAt = 0
    let withPatient: string | null = null
    let remaining = 0
    for (const a of mine) {
      const start = new Date(a.appointmentDatetime as string).getTime()
      const end = start + (a.durationMins ?? 60) * 60 * 1000 + bufferMs
      if (now >= start && now < end) {
        busy = true
        withPatient = a.patientName ?? null
        if (end > freeAt) freeAt = end
      }
      if (end > now) remaining += 1
    }
    return {
      therapist,
      busy,
      freeAtISO: busy ? new Date(freeAt).toISOString() : null,
      withPatient,
      remainingToday: remaining,
    }
  })
}

/* ── Visual day schedule (calendar grid) ───────────────────────────── */

export interface GridAppt {
  id: string
  therapistCode: string | null
  startMin: number // minutes from midnight, Malaysia time
  durationMins: number
  patientName: string | null
  treatmentName: string | null
  status: BookingStatus
  room: string | null
  /** Staff remarks/notes for internal use (e.g., "VIP guest", "Bring extra towels"). */
  internalNotes: string | null
  /** null / undefined = created by a customer on the web; non-null = staff-created. */
  createdByAdminId: string | null
  groupId: string | null
  staffColorTag: StaffColorTag | null
}
export interface GridBlock {
  id: string | null
  therapistCode: string | null
  startMin: number
  endMin: number
  reason: string | null
}
export interface DaySchedule {
  appts: GridAppt[] // assigned to a therapist
  unassigned: GridAppt[] // confirmed but no therapist yet (waiting list)
  blocks: GridBlock[]
}

const hhmmToMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))

/** All appointments + blocks for a Malaysia day, shaped for the calendar grid. */
export async function getDaySchedule(db: ServiceDb, dateYMD: string): Promise<DaySchedule> {
  const dayStartMs = new Date(`${dateYMD}T00:00:00+08:00`).getTime()
  const start = new Date(dayStartMs).toISOString()
  const end = new Date(dayStartMs + 86_400_000).toISOString()

  const defaultVaidyaCode = 'VAIDYA'

  const { data, error } = await db
    .from('appointments')
    .select('id, assigned_therapist_code, appointment_date_time, duration_mins, patient_name, treatment_name, status, created_by_admin_id, group_id, staff_color_tag, booking_kind, room, internal_notes')
    .in('status', ['scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress', 'completed'])
    .gte('appointment_date_time', start)
    .lt('appointment_date_time', end)
    .order('appointment_date_time', { ascending: true })
  if (error) console.error('[staff/appointments] daySchedule:', error.message)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grid: GridAppt[] = (data ?? []).map((r: any) => ({
    id: r.id,
    // Consultations are shown under their Vaidya column (or the default Vaidya
    // if no specific Vaidya has been assigned yet). This lets the front-desk
    // schedule grid display doctor bookings alongside therapist bookings.
    therapistCode: r.booking_kind === 'consultation' ? (r.assigned_therapist_code ?? defaultVaidyaCode) : r.assigned_therapist_code,
    startMin: r.appointment_date_time ? hhmmToMin(mytTimeOfDay(r.appointment_date_time)) : 0,
    durationMins: r.duration_mins ?? 60,
    patientName: r.patient_name,
    treatmentName: r.booking_kind === 'consultation' ? 'Consultation' : r.treatment_name,
    status: r.status,
    room: r.room,
    internalNotes: r.internal_notes ?? null,
    createdByAdminId: r.created_by_admin_id ?? null,
    groupId: r.group_id ?? null,
    staffColorTag: r.staff_color_tag ?? null,
  }))

  const blocksRaw = await fetchBlocksOnOrAfter(db, dateYMD)
  const blocks: GridBlock[] = blockedIntervalsForDate(blocksRaw, dateYMD).map((iv) => ({
    id: iv.id,
    therapistCode: iv.therapistCode,
    startMin: Math.max(0, Math.round((iv.startMs - dayStartMs) / 60_000)),
    endMin: Math.min(1440, Math.round((iv.endMs - dayStartMs) / 60_000)),
    reason: iv.reason,
  }))

  return {
    appts: grid.filter((g) => g.therapistCode),
    unassigned: grid.filter((g) => !g.therapistCode),
    blocks,
  }
}

/** All consultation appointments for the day — public bookings have no
 *  assigned_therapist_code, so every consultation is mapped to a Vaidya column. */
export async function getVaidyaSchedule(db: ServiceDb, dateYMD: string): Promise<DaySchedule> {
  const dayStartMs = new Date(`${dateYMD}T00:00:00+08:00`).getTime()
  const start = new Date(dayStartMs).toISOString()
  const end = new Date(dayStartMs + 86_400_000).toISOString()
  const vaidyaCodes = new Set(['VAIDYA', 'LYMAT'])
  const defaultVaidyaCode = 'VAIDYA'

  const { data, error } = await db
    .from('appointments')
    .select('id, assigned_therapist_code, appointment_date_time, duration_mins, patient_name, treatment_name, status, created_by_admin_id, group_id, staff_color_tag, booking_kind, room, internal_notes')
    .eq('booking_kind', 'consultation')
    .in('status', ['scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress', 'completed'])
    .gte('appointment_date_time', start)
    .lt('appointment_date_time', end)
    .order('appointment_date_time', { ascending: true })
  if (error) console.error('[staff/appointments] vaidyaSchedule:', error.message)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grid: GridAppt[] = (data ?? []).map((r: any) => ({
    id: r.id,
    therapistCode: r.assigned_therapist_code ?? defaultVaidyaCode,
    startMin: r.appointment_date_time ? hhmmToMin(mytTimeOfDay(r.appointment_date_time)) : 0,
    durationMins: r.duration_mins ?? CONSULTATION_MINS,
    patientName: r.patient_name,
    treatmentName: r.treatment_name,
    status: r.status,
    room: r.room,
    internalNotes: r.internal_notes ?? null,
    createdByAdminId: r.created_by_admin_id ?? null,
    groupId: r.group_id ?? null,
    staffColorTag: r.staff_color_tag ?? null,
  }))

  const blocksRaw = await fetchBlocksOnOrAfter(db, dateYMD)
  const blocks: GridBlock[] = blockedIntervalsForDate(blocksRaw, dateYMD)
    .filter((iv) => iv.therapistCode === null || vaidyaCodes.has(iv.therapistCode))
    .map((iv) => ({
      id: iv.id,
      therapistCode: iv.therapistCode,
      startMin: Math.max(0, Math.round((iv.startMs - dayStartMs) / 60_000)),
      endMin: Math.min(1440, Math.round((iv.endMs - dayStartMs) / 60_000)),
      reason: iv.reason,
    }))

  return { appts: grid, unassigned: [], blocks }
}

/** Consultations still awaiting the doctor's clearance before treatment. */
export async function getConsultationsToClear(db: ServiceDb): Promise<StaffAppointment[]> {
  const nowMs = Date.now()
  const { data, error } = await db
    .from('appointments')
    .select(APPOINTMENT_COLUMNS)
    .eq('booking_kind', 'consultation')
    .in('status', CLEARABLE_CONSULTATION_STATUSES)
    .lte('appointment_date_time', new Date(nowMs).toISOString())
    .or('treatment_unlocked.is.null,treatment_unlocked.eq.false')
    .order('appointment_date_time', { ascending: true })
  if (error) {
    console.error('[staff/appointments] consultationsToClear:', error.message)
    return []
  }
  return (data ?? [])
    .map(mapAppointmentRow)
    .filter((a) => canClearConsultation({
      bookingKind: a.bookingKind,
      status: a.status,
      appointmentISO: a.appointmentDatetime,
      nowMs,
    }))
}

export interface PatientDirectoryEntry {
  key: string
  name: string | null
  phone: string | null
  isGuest: boolean
  customerId: string | null
  visits: number
  lastVisitISO: string | null
  latestAppointmentId: string
}

/**
 * Unique patients who have booked, most-recent first. Deduped by account →
 * phone → name so a returning patient appears once with a visit count.
 */
export async function getPatientDirectory(db: ServiceDb): Promise<PatientDirectoryEntry[]> {
  const { data, error } = await db
    .from('appointments')
    .select(APPOINTMENT_COLUMNS)
    .in('status', BOOKED_STATUSES)
    .order('appointment_date_time', { ascending: false })
  if (error) {
    console.error('[staff/appointments] directory:', error.message)
    return []
  }
  const byPatient = new Map<string, PatientDirectoryEntry>()
  for (const a of (data ?? []).map(mapAppointmentRow)) {
    const key = a.customerId ?? a.patientPhone ?? a.patientName ?? a.id
    const existing = byPatient.get(key)
    if (existing) {
      existing.visits += 1 // rows are newest-first, so the first seen is the latest
    } else {
      byPatient.set(key, {
        key,
        name: a.patientName,
        phone: a.patientPhone,
        isGuest: a.isGuest,
        customerId: a.customerId,
        visits: 1,
        lastVisitISO: a.appointmentDatetime,
        latestAppointmentId: a.id,
      })
    }
  }
  return Array.from(byPatient.values())
}

export interface RefundExceptionRow {
  id: string
  appointmentId: string
  patientName: string | null
  treatmentName: string | null
  status: 'pending' | 'exception'
  amountRm: number
  provider: string
  createdAt: string
  /** Masked FPX recipient, e.g. "MBB •••• 1234" — never the full account number. */
  bankCode: string | null
  bankAccountLast4: string | null
}

/** Active or stuck refunds that require staff attention. */
export async function getRefundExceptions(db: ServiceDb): Promise<RefundExceptionRow[]> {
  const { data, error } = await db
    .from('booking_refunds')
    .select('id, appointment_id, status, amount_rm, provider, created_at, bank_code, bank_account_last4, appointments(patient_name, treatment_name)')
    .in('status', ['pending', 'exception'])
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[staff/appointments] refundExceptions:', error.message)
    return []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id,
    appointmentId: r.appointment_id,
    patientName: Array.isArray(r.appointments) ? r.appointments[0]?.patient_name : r.appointments?.patient_name ?? null,
    treatmentName: Array.isArray(r.appointments) ? r.appointments[0]?.treatment_name : r.appointments?.treatment_name ?? null,
    status: r.status,
    amountRm: r.amount_rm,
    provider: r.provider,
    createdAt: r.created_at,
    bankCode: r.bank_code ?? null,
    bankAccountLast4: r.bank_account_last4 ?? null,
  }))
}

export interface AppointmentRefundRow {
  id: string
  status: 'claimed' | 'pending' | 'confirmed' | 'failed' | 'exception'
  amountRm: number
  provider: string
  failureReason: string | null
  bankCode: string | null
  bankAccountLast4: string | null
  createdAt: string
  confirmedAt: string | null
}

/** Every refund ever claimed for one appointment, newest first. */
export async function getRefundsForAppointment(db: ServiceDb, appointmentId: string): Promise<AppointmentRefundRow[]> {
  const { data, error } = await db
    .from('booking_refunds')
    .select('id, status, amount_rm, provider, failure_reason, bank_code, bank_account_last4, created_at, confirmed_at')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[staff/appointments] refundsForAppointment:', error.message)
    return []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id,
    status: r.status,
    amountRm: r.amount_rm,
    provider: r.provider,
    failureReason: r.failure_reason ?? null,
    bankCode: r.bank_code ?? null,
    bankAccountLast4: r.bank_account_last4 ?? null,
    createdAt: r.created_at,
    confirmedAt: r.confirmed_at ?? null,
  }))
}

export interface BookingEventRow {
  id: string
  appointmentId: string
  eventType: string
  actorType: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oldData: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newData: any
  createdAt: string
}

export async function getBookingEvents(db: ServiceDb, appointmentId: string): Promise<BookingEventRow[]> {
  const { data, error } = await db
    .from('booking_events')
    .select('*')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[staff/appointments] bookingEvents:', error.message)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id,
    appointmentId: r.appointment_id,
    eventType: r.event_type,
    actorType: r.actor_type,
    oldData: r.old_data,
    newData: r.new_data,
    createdAt: r.created_at,
  }))
}
