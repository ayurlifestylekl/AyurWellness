'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSb } from '@supabase/supabase-js'
import type { BookingRequestInput, Gender, HealthIntake } from '@/types/booking'
import { genderRequirementValue } from './policy'
import { createBookingToken } from './token'
import { canAccessBooking } from './access'
import { notifyRequestReceived, notifyCancelled } from './notify'
import { voidBill } from './payment'
import { parseDurationMins } from './duration'
import { CONSULTATION_MINS, consultationSlots, slotsForDuration, slotIso, validateSubmittedSlot } from './slots'
import { countOverlapping, hasCapacity, type Slot } from './scheduling'
import { fetchBlocksOnOrAfter, blockedIntervalsForDate, isBlocked } from './blocks'
import { therapistsForGender, getAllVaidyas, VAIDYA_BLOCK_CODE, type Vaidya } from '@/lib/staff/therapists'
import { requireStaff } from '@/lib/staff/guard'
import { mytDayKey } from '@/lib/datetime'
import { validateLegacyParentConsultationLink } from './consultation-rules'
import { freeVaidyaIn, type ConsultationAvailabilityContext } from './consultation-availability'

/** Service-role client — bypasses RLS for guest bookings + server writes. */
function admin() {
  return createSb(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

export type CreateBookingResult = { id: string; token: string } | { error: string }

/**
 * Create a booking or consultation request. Writes an appointment in
 * `pending` status (awaiting staff approval). Works for guests and
 * signed-in customers. Treatment requests carry the full payable price;
 * consultations are free.
 */
export async function createBookingRequest(
  input: BookingRequestInput,
): Promise<CreateBookingResult> {
  const { db: sb } = await requireStaff()
  const parentLink = validateLegacyParentConsultationLink(input.parentConsultationId)
  if ('error' in parentLink) return parentLink

  if (!input.acceptedPolicies) return { error: 'Please accept the booking policies to continue.' }
  if (!input.patientName?.trim()) return { error: 'Please enter the patient name.' }
  if (!input.patientPhone?.trim()) return { error: 'Please enter a contact number.' }
  if (!input.patientEmail?.trim()) return { error: 'Please enter an email so we can send booking updates.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.patientEmail.trim())) return { error: 'Please enter a valid email address.' }
  if (!input.preferredAt) return { error: 'Please choose a preferred date and time.' }
  if (input.patientGender !== 'male' && input.patientGender !== 'female') {
    return { error: 'Please select a gender for therapist matching.' }
  }

  const isTreatment = input.bookingKind === 'treatment'
  if (isTreatment && !input.treatmentId) {
    return { error: 'Please choose a treatment.' }
  }

  // Look up the treatment for price/name/category when one is provided.
  // A standalone consultation has no treatment attached.
  let t: {
    id: string; title: string; price_rm: number | null
    booking_type: string | null; category_id: string | null; duration: string | null
  } | null = null
  if (input.treatmentId) {
    const { data, error: tErr } = await sb
      .from('treatments')
      .select('id, title, price_rm, booking_type, category_id, duration')
      .eq('id', input.treatmentId)
      .maybeSingle()
    if (tErr) return { error: tErr.message }
    if (!data) return { error: 'Treatment not found.' }
    if (data.booking_type === 'enquiry' || [30, 45].includes(parseDurationMins(data.duration))) {
      return { error: 'This therapy is enquiry-only — please WhatsApp us to arrange it.' }
    }
    t = data
  }

  // Attach the signed-in user when not booking as guest.
  let userId: string | null = null
  if (!input.isGuest) {
    const ssr = await createServerClient()
    const { data: auth } = await ssr.auth.getUser()
    userId = auth.user?.id ?? null
  }

  const payable = isTreatment ? (t?.price_rm ?? null) : null
  const treatmentName = t?.title ?? (isTreatment ? 'Treatment' : 'Free Consultation')
  // Length the therapist is occupied (used for double-booking checks). Consultations ≈ 30 min.
  const durationMins = t ? parseDurationMins(t.duration) : 30

  const { data, error } = await sb
    .from('appointments')
    .insert({
      customer_id: userId,
      is_guest: input.isGuest || !userId,
      booking_kind: input.bookingKind,
      treatment_id: t?.id ?? null,
      treatment_category_id: t?.category_id ?? null,
      treatment_name: treatmentName,
      duration_mins: durationMins,
      status: 'pending',
      requested_datetime: input.preferredAt,
      requested_datetime_alt: input.preferredAtAlt ?? null,
      // appointment_date_time is NOT NULL; seed it with the requested time.
      // Staff overwrite it with the confirmed slot at approval.
      appointment_date_time: input.preferredAt,
      patient_name: input.patientName.trim(),
      patient_phone: input.patientPhone.trim(),
      patient_email: input.patientEmail?.trim() || null,
      patient_gender: input.patientGender,
      // Consultations are conducted by the Vaidya — no same-gender therapist
      // matching applies, so they never carry a gender requirement.
      gender_requirement: isTreatment ? genderRequirementValue(input.patientGender) : 'any',
      pre_visit_form: input.healthIntake ?? {},
      payable_amount_rm: payable,
      payment_status: 'unpaid',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  const id = data.id as string
  // This action is staff-only (requireStaff above) — front desk just made
  // this booking themselves, so skip the "new request" staff-inbox email.
  await notifyRequestReceived({
    to: input.patientEmail,
    name: input.patientName,
    treatmentName,
    kind: input.bookingKind,
    whenISO: input.preferredAt,
    bookingId: id,
    notifyStaff: false,
  })
  return { id, token: createBookingToken(id) }
}

export type CancelResult = { ok: true; refundable: boolean } | { error: string }

/**
 * Customer-initiated cancellation. Enforces the 12-hour rule: cancellations
 * within 12h of the appointment are non-refundable. Refunds (when eligible)
 * are processed manually for now.
 */
export async function cancelBooking(id: string, token?: string | null): Promise<CancelResult> {
  const sb = admin()
  const { data: a } = await sb
    .from('appointments')
    .select('id, status, appointment_date_time, payment_status, customer_id, patient_email, patient_name, treatment_name, group_id, payment_bill_id, payment_provider')
    .eq('id', id)
    .maybeSingle()
  if (!a) return { error: 'Booking not found.' }
  if (!(await canAccessBooking(id, a.customer_id ?? null, token))) {
    return { error: 'Not authorised to cancel this booking.' }
  }
  if (['cancelled', 'completed', 'no_show'].includes(a.status)) {
    return { error: 'This booking can no longer be cancelled.' }
  }

  if (a.payment_status === 'paid') {
    return { error: 'Paid bookings must be cancelled through the management page.' }
  }

  const cancelPatch = {
    status: 'cancelled' as const,
    cancelled_at: new Date().toISOString(),
    cancellation_reason: 'Cancelled by customer',
    internal_notes: null,
  }
  // Collect any open bills BEFORE cancelling so they can be voided after —
  // an open bill on a cancelled booking could still be paid.
  const bills = new Map<string, string | null>()
  if (a.payment_bill_id) bills.set(a.payment_bill_id, a.payment_provider)
  if (a.group_id) {
    const { data: members } = await sb
      .from('appointments')
      .select('payment_bill_id, payment_status, payment_provider')
      .eq('group_id', a.group_id)
    for (const m of members ?? []) {
      if (m.payment_bill_id && m.payment_status !== 'paid') bills.set(m.payment_bill_id, m.payment_provider)
    }
  }

  // A group booking cancels as one unit — never leave a single guest behind.
  const q = sb.from('appointments').update(cancelPatch)
  const { error } = a.group_id
    ? await q
        .eq('group_id', a.group_id)
        .in('status', ['pending', 'scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress'])
    : await q.eq('id', id)
  if (error) return { error: error.message }
  for (const [billId, providerName] of Array.from(bills)) await voidBill(billId, providerName)
  await notifyCancelled({ to: a.patient_email, name: a.patient_name, treatmentName: a.treatment_name, refundable: false })
  return { ok: true, refundable: false }
}

export type SlotInfo = { time: string; iso: string; available: boolean }

/**
 * Core slot availability for a party needing `need.male` male + `need.female`
 * female therapists at the same time (single bookings need one of these = 1).
 * A slot is available when enough free same-gender therapists exist for the
 * therapy length + 30-min buffer, respecting bookings and leave/blocks.
 * Therapist identity is never returned.
 */
async function computeSlots(
  dateYMD: string,
  treatmentId: string | null,
  need: { male: number; female: number },
): Promise<SlotInfo[]> {
  if (need.male + need.female === 0) return []

  let durationMins = 30
  if (treatmentId) {
    const { data: t } = await admin().from('treatments').select('duration').eq('id', treatmentId).maybeSingle()
    durationMins = t ? parseDurationMins(t.duration) : 60
  }

  // A same-treatment party is just a mixed party where every member of a gender
  // shares one duration — delegate so there's a single availability engine.
  const members: PartyMemberResolved[] = [
    ...Array.from({ length: need.male }, () => ({ gender: 'male' as Gender, durationMins })),
    ...Array.from({ length: need.female }, () => ({ gender: 'female' as Gender, durationMins })),
  ]
  return computeMixedSlots(dateYMD, members)
}

/** One guest of a group and the treatment they've chosen. */
export interface PartyMember {
  gender: Gender
  treatmentId: string | null
}
interface PartyMemberResolved {
  gender: Gender
  durationMins: number
}

/**
 * Slots for a mixed party — each guest may pick a DIFFERENT treatment. The whole
 * group starts at the same slot (shorter therapies simply finish earlier); a slot
 * is bookable only if every guest can be matched to a distinct same-gender
 * therapist who is free for that guest's own treatment length.
 */
export async function getAvailableSlotsForMixedParty(
  dateYMD: string,
  members: PartyMember[],
): Promise<SlotInfo[]> {
  const clean = members.filter((m) => m.gender === 'male' || m.gender === 'female')
  if (clean.length === 0) return []

  const ids = Array.from(new Set(clean.map((m) => m.treatmentId).filter((id): id is string => !!id)))
  const durById = new Map<string, number>()
  if (ids.length) {
    const { data } = await admin().from('treatments').select('id, duration').in('id', ids)
    for (const t of data ?? []) durById.set(t.id, parseDurationMins(t.duration))
  }
  const resolved: PartyMemberResolved[] = clean.map((m) => ({
    gender: m.gender,
    durationMins: m.treatmentId ? durById.get(m.treatmentId) ?? 60 : 60,
  }))
  return computeMixedSlots(dateYMD, resolved)
}

async function computeMixedSlots(dateYMD: string, members: PartyMemberResolved[]): Promise<SlotInfo[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYMD)) return []
  const male = members.filter((m) => m.gender === 'male')
  const female = members.filter((m) => m.gender === 'female')
  if (male.length + female.length === 0) return []
  const sb = admin()

  const maleTh = male.length > 0 ? await therapistsForGender('male') : []
  const femaleTh = female.length > 0 ? await therapistsForGender('female') : []

  // The last bookable slot must respect the LONGEST treatment in the party, so
  // the longest therapy still fits before closing.
  const maxDuration = Math.max(30, ...members.map((m) => m.durationMins))
  const allSlots = slotsForDuration(maxDuration)

  // Can the roster ever satisfy this party? If not, nothing is bookable.
  if (male.length > maleTh.length || female.length > femaleTh.length) {
    return allSlots.map((time) => ({ time, iso: slotIso(dateYMD, time), available: false }))
  }

  const dayStartMs = new Date(`${dateYMD}T00:00:00+08:00`).getTime()
  const now = Date.now()
  const dayStart = new Date(dayStartMs).toISOString()
  const dayEnd = new Date(dayStartMs + 86_400_000).toISOString()
  const occupiedStatuses = ['scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress']
  // gender_requirement stores the DB enum ('men_only' / 'ladies_only'), not
  // the plain 'male' / 'female' gender — translate before querying/matching.
  const genderReqs = [
    ...(male.length > 0 ? [genderRequirementValue('male')] : []),
    ...(female.length > 0 ? [genderRequirementValue('female')] : []),
  ]

  // Headcount-based capacity: count EVERY occupying appointment requiring this
  // gender, whether or not it has a named therapist yet. Under instant booking,
  // a paid/confirmed booking has no name until front desk assigns one later —
  // matching by assigned_therapist_code (the old approach) made such a booking
  // invisible to availability checks. Matching by gender_requirement instead
  // means it's counted the instant it's confirmed, regardless of naming.
  type BusyRow = {
    appointment_date_time: string | null
    duration_mins: number | null
    gender_requirement: string | null
    status?: string | null
    payment_expires_at?: string | null
  }
  const { data: appts } = await sb
    .from('appointments')
    .select('appointment_date_time, duration_mins, gender_requirement, status, payment_expires_at')
    .in('gender_requirement', genderReqs)
    .in('status', occupiedStatuses)
    .gte('appointment_date_time', dayStart)
    .lt('appointment_date_time', dayEnd)

  const busyByGender = new Map<string, Slot[]>()
  for (const a of (appts ?? []) as BusyRow[]) {
    if (!a.appointment_date_time || !a.gender_requirement) continue
    // Expired-but-unpaid hold no longer occupies a seat.
    if (a.status === 'awaiting_payment' && a.payment_expires_at && new Date(a.payment_expires_at).getTime() <= now) continue
    const arr = busyByGender.get(a.gender_requirement) ?? []
    arr.push({ startISO: a.appointment_date_time, durationMins: a.duration_mins ?? 60 })
    busyByGender.set(a.gender_requirement, arr)
  }

  const blocks = await fetchBlocksOnOrAfter(sb, dateYMD)
  const intervals = blockedIntervalsForDate(blocks, dateYMD)

  // Roster seats actually available at this instant (excludes anyone on leave
  // or centre-wide-blocked for this window) — the true capacity ceiling.
  const freeSeats = (roster: typeof maleTh, iso: string, durationMins: number) =>
    roster.filter((t) => !isBlocked(intervals, t.code, iso, durationMins)).length

  // How many existing appointments of this gender would still overlap a seat
  // occupied for `durationMins` starting at `iso`. Overlap only grows with
  // duration, so using the party's longest member is the safe (conservative)
  // bound for the whole party sharing this start time.
  const occupiedSeats = (gender: 'male' | 'female', iso: string, durationMins: number) => {
    const busy = busyByGender.get(genderRequirementValue(gender)) ?? []
    return countOverlapping({ startISO: iso, durationMins }, busy)
  }

  const genderOk = (list: PartyMemberResolved[], roster: typeof maleTh, iso: string) => {
    if (list.length === 0) return true
    const gender = list[0].gender
    const maxDur = Math.max(...list.map((m) => m.durationMins))
    const ceiling = freeSeats(roster, iso, maxDur)
    const already = occupiedSeats(gender, iso, maxDur)
    return hasCapacity(ceiling, already, list.length)
  }

  const LEAD_TIME_MS = 24 * 3600_000
  return allSlots.map((time) => {
    const iso = slotIso(dateYMD, time)
    const available =
      new Date(iso).getTime() > now + LEAD_TIME_MS &&
      genderOk(male, maleTh, iso) &&
      genderOk(female, femaleTh, iso)
    return { time, iso, available }
  })
}

/**
 * How many of a gender's therapists are actually free (not on leave / blocked)
 * for a session of `durationMins` starting at `iso` — the true capacity
 * ceiling. Shared by the browse-time estimate above and the write-time claim
 * in `instant.ts`, which passes this as the atomic count's ceiling.
 */
export async function effectiveGenderCapacity(gender: Gender, iso: string, durationMins: number): Promise<number> {
  const sb = admin()
  const dateYMD = mytDayKey(iso)
  const roster = await therapistsForGender(gender)
  const blocks = await fetchBlocksOnOrAfter(sb, dateYMD)
  const intervals = blockedIntervalsForDate(blocks, dateYMD)
  return roster.filter((t) => !isBlocked(intervals, t.code, iso, durationMins)).length
}

/** Slots for a single guest of the given gender. */
export async function getAvailableSlots(dateYMD: string, treatmentId: string | null, gender: Gender): Promise<SlotInfo[]> {
  if (gender !== 'male' && gender !== 'female') return []
  return computeSlots(dateYMD, treatmentId, { male: gender === 'male' ? 1 : 0, female: gender === 'female' ? 1 : 0 })
}

/** Public-facing, active Vaidyas eligible for auto-assignment. VAIDYA (the
 * primary doctor) is preferred first when both are free — getAllVaidyas()
 * orders by code, which would otherwise favour LYMAT alphabetically. */
async function bookableVaidyas(): Promise<Vaidya[]> {
  const candidates = (await getAllVaidyas()).filter((v) => v.active && v.publicFacing)
  return candidates.sort((a, b) =>
    a.code === VAIDYA_BLOCK_CODE ? -1 : b.code === VAIDYA_BLOCK_CODE ? 1 : a.code.localeCompare(b.code))
}

/** Per-Vaidya busy Slot[] for a day's consultations. A legacy/unassigned row
 * (assigned_therapist_code IS NULL) buckets under VAIDYA_BLOCK_CODE — same
 * fallback convention as getDaySchedule/getVaidyaSchedule in
 * src/lib/staff/appointments.ts and rescheduleFromGrid in staff/actions.ts. */
async function consultationBusyByVaidya(sb: ReturnType<typeof admin>, dateYMD: string): Promise<Map<string, Slot[]>> {
  const dayStartMs = new Date(`${dateYMD}T00:00:00+08:00`).getTime()
  const { data: rows } = await sb
    .from('appointments')
    .select('appointment_date_time, duration_mins, assigned_therapist_code')
    .eq('booking_kind', 'consultation')
    .in('status', ['scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress'])
    .gte('appointment_date_time', new Date(dayStartMs).toISOString())
    .lt('appointment_date_time', new Date(dayStartMs + 86_400_000).toISOString())
  const byVaidya = new Map<string, Slot[]>()
  for (const r of rows ?? []) {
    if (!r.appointment_date_time) continue
    const code = r.assigned_therapist_code ?? VAIDYA_BLOCK_CODE
    const arr = byVaidya.get(code) ?? []
    arr.push({ startISO: r.appointment_date_time, durationMins: r.duration_mins ?? CONSULTATION_MINS })
    byVaidya.set(code, arr)
  }
  return byVaidya
}

async function loadConsultationAvailability(dateYMD: string): Promise<ConsultationAvailabilityContext> {
  const sb = admin()
  const [vaidyas, busyByVaidya, blocks] = await Promise.all([
    bookableVaidyas(),
    consultationBusyByVaidya(sb, dateYMD),
    fetchBlocksOnOrAfter(sb, dateYMD),
  ])
  return { vaidyas, busyByVaidya, intervals: blockedIntervalsForDate(blocks, dateYMD) }
}

/** First free public-facing Vaidya at a given time — the write-time helper
 * used right before a consultation is actually claimed (see instant.ts). */
export async function findFreeVaidya(iso: string, durationMins: number): Promise<string | null> {
  return freeVaidyaIn(await loadConsultationAvailability(mytDayKey(iso)), iso, durationMins)
}

/**
 * Slots for a free consultation. Consultations are conducted by a Vaidya, not
 * a therapist, so availability does NOT depend on the therapist roster or
 * gender — a slot is available if ANY public-facing Vaidya is free at that time.
 */
export async function getConsultationSlots(dateYMD: string): Promise<SlotInfo[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYMD)) return []
  const allSlots = consultationSlots()
  const now = Date.now()
  const ctx = await loadConsultationAvailability(dateYMD)

  return allSlots.map((time) => {
    const iso = slotIso(dateYMD, time)
    const available =
      new Date(iso).getTime() > now + 24 * 3600_000 &&
      freeVaidyaIn(ctx, iso, CONSULTATION_MINS) !== null
    return { time, iso, available }
  })
}

/** Slots for a group needing `male` male + `female` female therapists together. */
export async function getAvailableSlotsForParty(
  dateYMD: string,
  treatmentId: string | null,
  male: number,
  female: number,
): Promise<SlotInfo[]> {
  return computeSlots(dateYMD, treatmentId, { male: Math.max(0, male | 0), female: Math.max(0, female | 0) })
}

export interface GroupGuest {
  name: string
  gender: Gender
  age?: number | null
  /** Treatment this guest chose. Falls back to the booking's default treatment. */
  treatmentId?: string | null
  /** Generic duration (mins) for this guest — falls back to the booking's default duration. */
  durationMins?: number | null
  /** Label for this guest's generic-duration treatment — falls back to the booking's default label. */
  treatmentName?: string | null
  /** This guest's own preferred slot (ISO datetime) — guests may pick different times. */
  preferredAt: string
  /** This guest's own health intake. */
  healthIntake?: HealthIntake | null
  /** Optional therapist the front desk wants to assign at creation time. */
  assignedTherapistCode?: string | null
}

/**
 * Create a group / multi-guest booking — one appointment per guest, linked by a
 * shared group_id. Each guest may choose a DIFFERENT treatment, is later assigned
 * its own same-gender therapist, and shares one combined payment across the group.
 * Treatments only (groups are payable).
 */
export async function createGroupBooking(input: {
  /** Default treatment for guests who didn't pick their own. Omit to use a generic duration instead (front-desk quick book). */
  treatmentId?: string | null
  /** Generic duration in minutes — used when treatmentId is omitted, mirroring the single-guest quick-book flow. */
  durationMins?: number | null
  /** Label stored on each appointment when using a generic duration (e.g. "Treatment 3 — 1 hr"). */
  treatmentName?: string | null
  patientPhone?: string | null
  patientEmail?: string | null
  isGuest: boolean
  acceptedPolicies: boolean
  guests: GroupGuest[]
}): Promise<CreateBookingResult> {
  const { userId, db: sb } = await requireStaff(['admin', 'front_desk'])
  if (!input.acceptedPolicies) return { error: 'Please accept the booking policies to continue.' }
  if (input.patientEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.patientEmail.trim())) {
    return { error: 'Please enter a valid email address.' }
  }
  if (!input.treatmentId && !(input.durationMins && input.durationMins > 0)) return { error: 'Please choose a treatment.' }

  const guests = (input.guests ?? []).filter(
    (g) => g.name?.trim() && (g.gender === 'male' || g.gender === 'female'),
  )
  if (guests.length < 2) return { error: 'Add at least two guests (with name and gender) for a group booking.' }
  if (guests.length > 6) return { error: 'Up to 6 guests per group booking.' }
  if (guests.some((g) => !g.preferredAt || Number.isNaN(new Date(g.preferredAt).getTime()))) {
    return { error: 'Please choose a date and time for every guest.' }
  }

  // Resolve every treatment the group picked (each guest falls back to the
  // booking's default treatment) in a single lookup — skipped when the front
  // desk used a generic duration instead of a catalog treatment.
  const byId = new Map<string, { id: string; title: string; price_rm: number | null; booking_type: string | null; category_id: string | null; duration: string | null }>()
  if (input.treatmentId) {
    const guestTreatmentIds = guests.map((g) => g.treatmentId?.trim() || input.treatmentId!)
    const uniqueIds = Array.from(new Set(guestTreatmentIds))
    const { data: treatmentRows, error: tErr } = await sb
      .from('treatments')
      .select('id, title, price_rm, booking_type, category_id, duration')
      .in('id', uniqueIds)
    if (tErr) return { error: tErr.message }
    for (const [id, t] of (treatmentRows ?? []).map((t) => [t.id, t] as const)) byId.set(id, t)
    for (const id of uniqueIds) {
      const t = byId.get(id)
      if (!t) return { error: 'One of the chosen treatments could not be found.' }
      if (t.booking_type === 'enquiry' || [30, 45].includes(parseDurationMins(t.duration))) {
        return { error: `"${t.title}" is enquiry-only — please WhatsApp us to arrange it.` }
      }
    }
  }

  const genericDurationMins = input.durationMins && input.durationMins > 0 ? input.durationMins : 60
  const genericTreatmentName = input.treatmentName?.trim() || null

  const groupId = crypto.randomUUID()

  const rows = guests.map((g) => {
    const assigned = g.assignedTherapistCode?.trim() || null
    const t = input.treatmentId ? byId.get(g.treatmentId?.trim() || input.treatmentId) : undefined
    const guestDurationMins = g.durationMins && g.durationMins > 0 ? g.durationMins : genericDurationMins
    const guestTreatmentName = g.treatmentName?.trim() || genericTreatmentName
    return {
      customer_id: null,
      is_guest: true,
      booking_kind: 'treatment',
      treatment_id: t?.id ?? null,
      treatment_category_id: t?.category_id ?? null,
      treatment_name: t?.title ?? guestTreatmentName,
      duration_mins: t ? parseDurationMins(t.duration) : guestDurationMins,
      status: assigned ? 'scheduled' : 'pending',
      requested_datetime: g.preferredAt,
      requested_datetime_alt: null,
      appointment_date_time: g.preferredAt,
      patient_name: g.name.trim(),
      patient_phone: input.patientPhone?.trim() || null,
      patient_email: input.patientEmail?.trim() || null,
      patient_gender: g.gender,
      gender_requirement: genderRequirementValue(g.gender),
      guest_age: g.age ?? null,
      group_id: groupId,
      pre_visit_form: g.healthIntake ?? {},
      payable_amount_rm: t?.price_rm ?? null,
      payment_status: 'unpaid',
      created_by_admin_id: userId,
      assigned_therapist_code: assigned,
    }
  })

  const { data, error } = await sb.from('appointments').insert(rows).select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'Could not create the booking.' }

  // Summarise the therapies for the confirmation email: a single title when the
  // whole group shares one, otherwise "mixed therapies".
  const rowTreatmentNames = rows.map((r) => r.treatment_name ?? 'Treatment')
  const allSame = new Set(rowTreatmentNames).size === 1
  const summary = allSame
    ? `${rowTreatmentNames[0]} (group of ${guests.length})`
    : `Group of ${guests.length} · mixed therapies`

  const leadId = data[0].id as string
  revalidatePath('/console')
  revalidatePath('/console/schedule')
  // This action is staff-only (requireStaff above) — front desk just made
  // this group booking themselves, so skip the "new request" staff-inbox email.
  await notifyRequestReceived({
    to: input.patientEmail,
    name: guests[0].name,
    treatmentName: summary,
    kind: 'treatment',
    whenISO: guests[0].preferredAt,
    bookingId: leadId,
    notifyStaff: false,
    guests: guests.map((g, i) => ({
      name: g.name,
      age: g.age ?? null,
      treatmentName: rowTreatmentNames[i],
      whenISO: g.preferredAt,
    })),
  })
  return { id: leadId, token: createBookingToken(leadId) }
}

export interface EditableBooking {
  treatmentId: string | null
  patientName: string
  patientPhone: string
  patientEmail: string
  patientGender: Gender | null
  preferredAt: string | null
}

/**
 * Fetch a booking's editable fields for the checkout "Edit booking details"
 * flow. Only returns data for a booking still in a mutable state (pending or
 * awaiting_payment) and only when the token/customer check passes — same
 * access rule as updateBookingDetails below, so a stale/wrong link never
 * leaks another customer's contact details.
 */
export async function getBookingForEdit(
  appointmentId: string,
  token: string | null | undefined,
): Promise<EditableBooking | null> {
  const sb = admin()
  const { data, error } = await sb
    .from('appointments')
    .select('id, customer_id, status, treatment_id, patient_name, patient_phone, patient_email, patient_gender, requested_datetime')
    .eq('id', appointmentId)
    .maybeSingle()
  if (error || !data) return null
  if (!['pending', 'awaiting_payment'].includes(data.status as string)) return null
  if (!(await canAccessBooking(data.id, data.customer_id ?? null, token))) return null
  return {
    treatmentId: data.treatment_id,
    patientName: data.patient_name ?? '',
    patientPhone: data.patient_phone ?? '',
    patientEmail: data.patient_email ?? '',
    patientGender: (data.patient_gender as Gender | null) ?? null,
    preferredAt: data.requested_datetime,
  }
}

/**
 * Update treatment, time, and/or contact details (including gender) on a
 * booking that is still in a mutable state (pending or awaiting_payment).
 * Used from the checkout "Edit booking details" flow. Changing gender
 * re-derives gender_requirement so same-gender therapist matching stays
 * correct for the new value.
 */
export async function updateBookingDetails(input: {
  appointmentId: string
  token: string | null | undefined
  treatmentId: string
  patientName: string
  patientPhone: string
  patientEmail: string
  patientGender: Gender
  preferredAt: string
}): Promise<{ error: string } | { ok: true }> {
  const sb = admin()

  if (!input.patientName.trim()) return { error: 'Please enter the patient name.' }
  if (!input.patientPhone.trim()) return { error: 'Please enter a contact number.' }
  if (!input.patientEmail.trim()) return { error: 'Please enter an email so we can send booking updates.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.patientEmail.trim())) return { error: 'Please enter a valid email address.' }
  if (input.patientGender !== 'male' && input.patientGender !== 'female') {
    return { error: 'Please select a gender for therapist matching.' }
  }
  if (!input.preferredAt) return { error: 'Please choose a preferred date and time.' }

  const { data: appt, error: fetchErr } = await sb
    .from('appointments')
    .select('id, customer_id, status, treatment_id')
    .eq('id', input.appointmentId)
    .maybeSingle()
  if (fetchErr) return { error: fetchErr.message }
  if (!appt) return { error: 'Booking not found.' }

  if (!['pending', 'awaiting_payment'].includes(appt.status as string)) {
    return { error: 'This booking can no longer be changed.' }
  }

  if (!(await canAccessBooking(appt.id, appt.customer_id ?? null, input.token))) {
    return { error: 'You do not have access to change this booking.' }
  }

  const { data: t, error: tErr } = await sb
    .from('treatments')
    .select('id, title, price_rm, duration, booking_type, category_id, booking_lead_time_hours')
    .eq('id', input.treatmentId)
    .maybeSingle()
  if (tErr) return { error: tErr.message }
  if (!t) return { error: 'Treatment not found.' }
  if (t.booking_type === 'enquiry' || [30, 45].includes(parseDurationMins(t.duration))) {
    return { error: 'This therapy is enquiry-only — please WhatsApp us to arrange it.' }
  }

  const durationMins = parseDurationMins(t.duration)
  const slotCheck = validateSubmittedSlot({
    iso: input.preferredAt,
    durationMins,
    nowMs: Date.now(),
    leadTimeHours: Number(t.booking_lead_time_hours ?? 0),
    kind: 'treatment',
  })
  if ('error' in slotCheck) return { error: slotCheck.error }

  const { error } = await sb
    .from('appointments')
    .update({
      treatment_id: t.id,
      treatment_category_id: t.category_id ?? null,
      treatment_name: t.title,
      duration_mins: durationMins,
      payable_amount_rm: t.price_rm ?? null,
      patient_name: input.patientName.trim(),
      patient_phone: input.patientPhone.trim(),
      patient_email: input.patientEmail.trim(),
      patient_gender: input.patientGender,
      gender_requirement: genderRequirementValue(input.patientGender),
      requested_datetime: input.preferredAt,
      appointment_date_time: input.preferredAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.appointmentId)
  if (error) return { error: error.message }

  revalidatePath(`/book/request/${input.appointmentId}`)
  revalidatePath(`/book/request/${input.appointmentId}/checkout`)

  const { redirect } = await import('next/navigation')
  const tokenQuery = input.token ? `?t=${encodeURIComponent(input.token)}` : ''
  redirect(`/book/request/${input.appointmentId}/checkout${tokenQuery}`)
  return { ok: true }
}
