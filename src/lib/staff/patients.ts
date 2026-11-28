import 'server-only'
import type { BookingKind, BookingStatus, Gender } from '@/types/booking'
import type { ServiceDb } from './guard'

/**
 * Every booking carries its own copy of the name, phone, email and gender, and
 * staff can also add a patient record by hand (public.patients). These helpers
 * recognise the same person across bookings and records so front desk can reuse
 * their details and staff can see every visit together.
 *
 * Identity, in order:
 *   1. phone + first name — the phone is normalised ("+60 12-345 6789" ==
 *      "0123456789"), and the first name keeps family members or a shared /
 *      placeholder number from merging different people (and their notes);
 *   2. customer account, when there is no phone;
 *   3. full name, when there is neither.
 */

/** Malaysian-friendly phone normaliser: digits only, "60…" → "0…". */
export function normalizePhone(raw: string | null | undefined): string | null {
  const digits = (raw ?? '').replace(/\D/g, '')
  if (digits.length < 7) return null
  return digits.startsWith('60') ? `0${digits.slice(2)}` : digits
}

function normalizeName(name: string | null | undefined): string {
  return (name ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function firstName(name: string | null | undefined): string {
  return normalizeName(name).split(' ')[0] ?? ''
}

export function patientKey(p: {
  patientPhone: string | null
  customerId: string | null
  patientName: string | null
}): string | null {
  const phone = normalizePhone(p.patientPhone)
  if (phone) return `p:${phone}:${firstName(p.patientName)}`
  if (p.customerId) return `c:${p.customerId}`
  const name = normalizeName(p.patientName)
  return name ? `n:${name}` : null
}

/** PostgREST `or()` treats , ( ) as syntax and * % _ as wildcards. */
function cleanTerm(q: string): string {
  return q.replace(/[,()"'\\%*_]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
}

export interface PatientRecord {
  id: string
  fullName: string
  phone: string
  email: string | null
  gender: Gender
  dateOfBirth: string | null
  address: string | null
  conditions: string | null
  allergies: string | null
  medications: string | null
  notes: string | null
  /** Patient ID number (shown as AWC-00012); null before 20261122_patient_profile.sql. */
  patientNo: number | null
  /** Age as told, when there is no date of birth, and the day it was recorded. */
  ageYears: number | null
  ageRecordedOn: string | null
  createdAt: string
  updatedAt: string
}

const BASE_RECORD_COLUMNS =
  'id, full_name, phone, email, gender, date_of_birth, address, conditions, allergies, medications, notes, created_at, updated_at'

/**
 * patient_no arrives with 20261122_patient_profile.sql. Until that migration is
 * applied, asking for it would make every record read fail (and records would
 * look missing), so a read retries once without it and remembers the answer.
 */
let hasPatientNo = true
// age_years / age_recorded_on arrive with 20261130_centre_requests.sql; same idea.
let hasAge = true
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryResult = { data: any; error: { message: string; code?: string } | null }
async function readRecords(run: (columns: string) => PromiseLike<QueryResult>): Promise<QueryResult> {
  for (;;) {
    const cols = [BASE_RECORD_COLUMNS, hasPatientNo ? 'patient_no' : null, hasAge ? 'age_years, age_recorded_on' : null].filter(Boolean).join(', ')
    const res = await run(cols)
    if (res.error && hasPatientNo && /patient_no/.test(res.error.message)) { hasPatientNo = false; continue }
    if (res.error && hasAge && /age_years|age_recorded_on/.test(res.error.message)) { hasAge = false; continue }
    return res
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRecord(r: any): PatientRecord {
  return {
    id: r.id,
    fullName: r.full_name,
    phone: r.phone,
    email: r.email ?? null,
    gender: r.gender as Gender,
    dateOfBirth: r.date_of_birth ?? null,
    address: r.address ?? null,
    conditions: r.conditions ?? null,
    allergies: r.allergies ?? null,
    medications: r.medications ?? null,
    notes: r.notes ?? null,
    patientNo: r.patient_no != null ? Number(r.patient_no) : null,
    ageYears: r.age_years != null ? Number(r.age_years) : null,
    ageRecordedOn: r.age_recorded_on ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function recordKey(r: Pick<PatientRecord, 'phone' | 'fullName'>): string | null {
  return patientKey({ patientPhone: r.phone, customerId: null, patientName: r.fullName })
}

/**
 * Until 20261116_patients.sql is applied the table doesn't exist; staff pages
 * must keep working, so that case reads as "no records" instead of failing.
 */
function logRecordError(where: string, error: { message: string; code?: string }) {
  const missing =
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    (/patients/.test(error.message) && /(does not exist|Could not find)/.test(error.message))
  if (!missing) console.error(`[staff/patients] ${where}:`, error.message)
}

export async function getPatientRecord(db: ServiceDb, id: string): Promise<PatientRecord | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data, error } = await readRecords((cols) => db.from('patients').select(cols).eq('id', id).maybeSingle())
  if (error) {
    logRecordError('record', error)
    return null
  }
  return data ? mapRecord(data) : null
}

/** Records matching a name or phone fragment (same rules as booking search). */
async function searchRecords(db: ServiceDb, term: string, digits: string): Promise<PatientRecord[]> {
  const filters = [`full_name.ilike.*${term}*`]
  if (digits.length >= 3) filters.push(`phone.ilike.*${digits.split('').join('*')}*`)
  const { data, error } = await readRecords((cols) => db.from('patients').select(cols).or(filters.join(',')).limit(50))
  if (error) {
    logRecordError('record search', error)
    return []
  }
  return (data ?? []).map(mapRecord)
}

/** The hand-added record for the same person as a booking, if there is one. */
export async function findPatientRecordFor(
  db: ServiceDb,
  a: { patientPhone: string | null; customerId: string | null; patientName: string | null },
): Promise<PatientRecord | null> {
  const key = patientKey(a)
  const phone = normalizePhone(a.patientPhone)
  if (!key || !phone) return null
  const { data, error } = await readRecords((cols) =>
    db.from('patients').select(cols).ilike('phone', `*${phone.slice(-7).split('').join('*')}*`).limit(20),
  )
  if (error) {
    logRecordError('record lookup', error)
    return null
  }
  return (data ?? []).map(mapRecord).find((r: PatientRecord) => recordKey(r) === key) ?? null
}

async function getAllPatientRecords(db: ServiceDb): Promise<PatientRecord[]> {
  const out: PatientRecord[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await readRecords((cols) => db.from('patients').select(cols).order('created_at', { ascending: false }).range(from, from + 999))
    if (error) {
      logRecordError('records', error)
      break
    }
    out.push(...(data ?? []).map(mapRecord))
    if (!data || data.length < 1000) break
  }
  return out
}

export interface ReturningClient {
  key: string
  name: string
  phone: string | null
  email: string | null
  gender: Gender | null
  visits: number
  lastVisitISO: string | null
}

/**
 * Past patients matching a name or phone fragment, newest details first —
 * for the "Find existing client" box on staff booking forms.
 */
export async function searchReturningClients(db: ServiceDb, query: string): Promise<ReturningClient[]> {
  const term = cleanTerm(query)
  if (term.length < 2) return []

  const digits = term.replace(/\D/g, '')
  const filters = [`patient_name.ilike.*${term}*`]
  // Phones are stored as typed ("012-345 6789", "+60 12…"), so match the digits
  // in order with anything between them, then confirm on the normalised number.
  if (digits.length >= 3) filters.push(`patient_phone.ilike.*${digits.split('').join('*')}*`)

  const { data, error } = await db
    .from('appointments')
    .select('patient_name, patient_phone, patient_email, patient_gender, customer_id, appointment_date_time, requested_datetime, created_at, status')
    .or(filters.join(','))
    .order('created_at', { ascending: false })
    .limit(300)
  if (error) {
    console.error('[staff/patients] search:', error.message)
    return []
  }

  const wantDigits = digits.length >= 3 ? normalizePhone(digits) ?? digits : null
  const byKey = new Map<string, ReturningClient>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (data ?? []) as any[]) {
    if (!r.patient_name) continue
    const nameHit = r.patient_name.toLowerCase().includes(term.toLowerCase())
    const phoneHit = !!wantDigits && (normalizePhone(r.patient_phone) ?? '').includes(wantDigits)
    if (!nameHit && !phoneHit) continue

    const key = patientKey({ patientPhone: r.patient_phone, customerId: r.customer_id, patientName: r.patient_name })
    if (!key) continue
    const when = r.appointment_date_time ?? r.requested_datetime ?? r.created_at ?? null
    const counted = ['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed'].includes(r.status)
    const existing = byKey.get(key)
    if (existing) {
      if (counted) existing.visits += 1
      // Rows are newest first, so the first row holds the latest details; fill gaps only.
      existing.email ??= r.patient_email ?? null
      existing.gender ??= (r.patient_gender ?? null) as Gender | null
      if (counted && when && (!existing.lastVisitISO || when > existing.lastVisitISO)) existing.lastVisitISO = when
    } else {
      byKey.set(key, {
        key,
        name: r.patient_name,
        phone: r.patient_phone ?? null,
        email: r.patient_email ?? null,
        gender: (r.patient_gender ?? null) as Gender | null,
        visits: counted ? 1 : 0,
        lastVisitISO: counted ? when : null,
      })
    }
  }
  for (const rec of await searchRecords(db, term, digits)) {
    const key = recordKey(rec)
    if (!key) continue
    const existing = byKey.get(key)
    if (existing) {
      // The record is what staff typed in on purpose — prefer its details.
      existing.email = rec.email ?? existing.email
      existing.gender = rec.gender
    } else {
      byKey.set(key, { key, name: rec.fullName, phone: rec.phone, email: rec.email, gender: rec.gender, visits: 0, lastVisitISO: null })
    }
  }
  return Array.from(byKey.values()).slice(0, 8)
}

export interface PatientVisit {
  id: string
  /** Name this booking was made under — shown so a mismatch is easy to spot. */
  patientName: string | null
  bookingKind: BookingKind
  status: BookingStatus
  treatmentName: string | null
  whenISO: string | null
  therapistName: string | null
  clinicalNotes: string | null
  consultationOutcome: string | null
}

/** Every booking for the same person as `a`, newest first (includes `a`). */
export async function getPatientVisits(
  db: ServiceDb,
  a: { patientPhone: string | null; customerId: string | null; patientName: string | null },
): Promise<PatientVisit[]> {
  const key = patientKey(a)
  if (!key) return []

  const phone = normalizePhone(a.patientPhone)
  const filters: string[] = []
  if (phone) filters.push(`patient_phone.ilike.*${phone.slice(-7).split('').join('*')}*`)
  if (a.customerId) filters.push(`customer_id.eq.${a.customerId}`)
  if (!phone && !a.customerId && a.patientName) filters.push(`patient_name.ilike.${cleanTerm(a.patientName)}`)
  if (filters.length === 0) return []

  const { data, error } = await db
    .from('appointments')
    .select('id, booking_kind, status, treatment_name, appointment_date_time, requested_datetime, assigned_therapist_name, clinical_notes, consultation_outcome, patient_phone, patient_name, customer_id')
    .or(filters.join(','))
    .order('appointment_date_time', { ascending: false, nullsFirst: false })
    .limit(200)
  if (error) {
    console.error('[staff/patients] visits:', error.message)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[])
    .filter((r) => {
      // The query above is a loose prefilter; only the same person passes.
      if (patientKey({ patientPhone: r.patient_phone, customerId: r.customer_id, patientName: r.patient_name }) === key) return true
      // The same account booked without a phone (or with a different one) under the same first name.
      return !!a.customerId && r.customer_id === a.customerId && firstName(r.patient_name) === firstName(a.patientName)
    })
    .map((r) => ({
      id: r.id,
      patientName: r.patient_name ?? null,
      bookingKind: (r.booking_kind ?? 'treatment') as BookingKind,
      status: r.status as BookingStatus,
      treatmentName: r.treatment_name ?? null,
      whenISO: r.appointment_date_time ?? r.requested_datetime ?? null,
      therapistName: r.assigned_therapist_name ?? null,
      clinicalNotes: r.clinical_notes ?? null,
      consultationOutcome: r.consultation_outcome ?? null,
    }))
}

/**
 * Bookings that count as a visit once their time has passed. 'scheduled' is
 * included because walk-ins booked on the schedule grid stay in that status.
 */
const ATTENDED: BookingStatus[] = ['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed']

export interface PatientListEntry {
  key: string
  /** Latest booking, or the patient record when they have no bookings yet — the patient's page opens through it. */
  anchorId: string
  /** Hand-added patient record, if any. */
  recordId: string | null
  name: string
  phone: string | null
  gender: Gender | null
  isGuest: boolean
  /** Attended or confirmed visits. */
  visits: number
  bookings: number
  lastVisitISO: string | null
  nextVisitISO: string | null
}

/**
 * Everyone who has booked (cancelled-only patients left out), most recent
 * first. Reads every booking in pages, since PostgREST caps a single read at
 * 1,000 rows.
 */
export async function getPatientList(db: ServiceDb): Promise<PatientListEntry[]> {
  const rows: Record<string, unknown>[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('appointments')
      .select('id, patient_name, patient_phone, patient_gender, customer_id, is_guest, status, appointment_date_time, requested_datetime, created_at')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .range(from, from + 999)
    if (error) {
      console.error('[staff/patients] list:', error.message)
      break
    }
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }

  const nowISO = new Date().toISOString()
  const byKey = new Map<string, PatientListEntry>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of rows as any[]) {
    if (!r.patient_name) continue
    const key = patientKey({ patientPhone: r.patient_phone, customerId: r.customer_id, patientName: r.patient_name })
    if (!key) continue
    const when: string | null = r.appointment_date_time ?? r.requested_datetime ?? null
    const attended = ATTENDED.includes(r.status) && !!when && when <= nowISO
    const upcoming = !!when && when > nowISO && ['confirmed', 'scheduled', 'awaiting_payment', 'pending'].includes(r.status)
    let p = byKey.get(key)
    if (!p) {
      p = {
        key,
        anchorId: r.id,
        recordId: null,
        name: r.patient_name,
        phone: r.patient_phone ?? null,
        gender: (r.patient_gender ?? null) as Gender | null,
        isGuest: !r.customer_id,
        visits: 0,
        bookings: 0,
        lastVisitISO: null,
        nextVisitISO: null,
      }
      byKey.set(key, p)
    }
    p.bookings += 1
    p.phone ??= r.patient_phone ?? null
    p.gender ??= (r.patient_gender ?? null) as Gender | null
    if (r.customer_id) p.isGuest = false
    if (attended) {
      p.visits += 1
      if (!p.lastVisitISO || when! > p.lastVisitISO) p.lastVisitISO = when
    }
    if (upcoming && (!p.nextVisitISO || when! < p.nextVisitISO)) p.nextVisitISO = when
  }

  // Hand-added records: attach to their bookings, or list them on their own
  // (newest first, ahead of older patients) until their first booking.
  const recordOnly: PatientListEntry[] = []
  for (const rec of await getAllPatientRecords(db)) {
    const key = recordKey(rec)
    if (!key) continue
    const existing = byKey.get(key)
    if (existing) {
      existing.recordId = rec.id
      existing.name = rec.fullName
      existing.phone = rec.phone
      existing.gender = rec.gender
    } else {
      recordOnly.push({
        key,
        anchorId: rec.id,
        recordId: rec.id,
        name: rec.fullName,
        phone: rec.phone,
        gender: rec.gender,
        isGuest: true,
        visits: 0,
        bookings: 0,
        lastVisitISO: null,
        nextVisitISO: null,
      })
    }
  }

  const sorted = Array.from(byKey.values()).sort((a, b) =>
    (b.nextVisitISO ?? b.lastVisitISO ?? '').localeCompare(a.nextVisitISO ?? a.lastVisitISO ?? ''),
  )
  return [...recordOnly, ...sorted]
}

/** Name / phone search over the patient list (phone digits match however they were typed). */
export function filterPatients(list: PatientListEntry[], q: string, allowPhone: boolean): PatientListEntry[] {
  const term = q.trim().toLowerCase()
  if (!term) return list
  const digits = term.replace(/\D/g, '')
  const wantPhone = allowPhone && digits.length >= 3 ? normalizePhone(digits) ?? digits : null
  return list.filter(
    (p) => p.name.toLowerCase().includes(term) || (!!wantPhone && (normalizePhone(p.phone) ?? '').includes(wantPhone)),
  )
}
