import 'server-only'
import type { ServiceDb } from './guard'
import { normalizeSheetData, type CaseSheetData, type CaseSheetKind } from './case-sheets'
import type { PhotoTag } from './patient-photo-rules'

/**
 * Reads for a patient's case sheets, photos and visit remarks
 * (20261122_patient_profile.sql). Until that migration is applied the tables
 * don't exist; pages then show these sections as empty instead of failing.
 */

export const PHOTO_BUCKET = 'patient-photos'

function missingTable(error: { message: string; code?: string }): boolean {
  return error.code === '42P01' || error.code === 'PGRST205' || /(does not exist|Could not find the table)/.test(error.message)
}

function logError(where: string, error: { message: string; code?: string }) {
  if (!missingTable(error)) console.error(`[staff/patient-files] ${where}:`, error.message)
}

/** Staff display names for "updated by" / remark authors. */
async function staffNames(db: ServiceDb, ids: (string | null)[]): Promise<Map<string, string>> {
  const unique = Array.from(new Set(ids.filter((x): x is string => !!x)))
  if (!unique.length) return new Map()
  const { data } = await db.from('users').select('id, full_name').in('id', unique)
  return new Map((data ?? []).map((u: { id: string; full_name: string | null }) => [u.id, u.full_name || 'Staff']))
}

export interface CaseSheet {
  id: string
  patientId: string
  kind: CaseSheetKind
  sheetDate: string
  data: CaseSheetData
  createdAt: string
  updatedAt: string
  updatedByName: string | null
}

const SHEET_COLUMNS = 'id, patient_id, kind, sheet_date, data, created_at, updated_at, created_by_staff_id, updated_by_staff_id'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSheet(r: any, names: Map<string, string>): CaseSheet {
  const kind = r.kind as CaseSheetKind
  const by = r.updated_by_staff_id ?? r.created_by_staff_id
  return {
    id: r.id,
    patientId: r.patient_id,
    kind,
    sheetDate: r.sheet_date,
    data: normalizeSheetData(kind, r.data),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    updatedByName: by ? names.get(by) ?? null : null,
  }
}

/** Newest first: by sheet date, then by when it was written. */
export async function listCaseSheets(db: ServiceDb, patientId: string): Promise<CaseSheet[]> {
  const { data, error } = await db
    .from('patient_case_sheets')
    .select(SHEET_COLUMNS)
    .eq('patient_id', patientId)
    .order('sheet_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) {
    logError('case sheets', error)
    return []
  }
  const rows = data ?? []
  const names = await staffNames(db, rows.flatMap((r) => [r.updated_by_staff_id, r.created_by_staff_id]))
  return rows.map((r) => mapSheet(r, names))
}

export async function getCaseSheet(db: ServiceDb, id: string): Promise<CaseSheet | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data, error } = await db.from('patient_case_sheets').select(SHEET_COLUMNS).eq('id', id).maybeSingle()
  if (error) {
    logError('case sheet', error)
    return null
  }
  if (!data) return null
  const names = await staffNames(db, [data.updated_by_staff_id, data.created_by_staff_id])
  return mapSheet(data, names)
}

export interface PatientPhoto {
  id: string
  takenOn: string
  tag: PhotoTag | null
  remark: string | null
  /** Short-lived signed link (1 hour). */
  url: string | null
  createdAt: string
}

/** Newest first, each with a signed link the browser can show. */
export async function listPatientPhotos(db: ServiceDb, patientId: string): Promise<PatientPhoto[]> {
  const { data, error } = await db
    .from('patient_photos')
    .select('id, storage_path, taken_on, tag, remark, created_at')
    .eq('patient_id', patientId)
    .order('taken_on', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) {
    logError('photos', error)
    return []
  }
  const rows = data ?? []
  if (!rows.length) return []
  const { data: signed } = await db.storage.from(PHOTO_BUCKET).createSignedUrls(rows.map((r) => r.storage_path), 60 * 60)
  const urlFor = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]))
  return rows.map((r) => ({
    id: r.id,
    takenOn: r.taken_on,
    tag: (r.tag ?? null) as PhotoTag | null,
    remark: r.remark ?? null,
    url: urlFor.get(r.storage_path) ?? null,
    createdAt: r.created_at,
  }))
}

export interface VisitRemark {
  id: string
  appointmentId: string
  body: string
  authorName: string | null
  createdAt: string
}

/** Oldest first, so a visit's remarks read as a running log. */
export async function listVisitRemarks(db: ServiceDb, appointmentIds: string[]): Promise<VisitRemark[]> {
  const ids = appointmentIds.filter((x) => /^[0-9a-f-]{36}$/i.test(x))
  if (!ids.length) return []
  const { data, error } = await db
    .from('visit_remarks')
    .select('id, appointment_id, body, author_name, created_at')
    .in('appointment_id', ids)
    .order('created_at', { ascending: true })
  if (error) {
    logError('visit remarks', error)
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    appointmentId: r.appointment_id,
    body: r.body,
    authorName: r.author_name ?? null,
    createdAt: r.created_at,
  }))
}
