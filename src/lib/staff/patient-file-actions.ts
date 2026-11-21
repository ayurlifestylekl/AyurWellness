'use server'

import { randomUUID } from 'crypto'
import { z } from 'zod'
import { requireStaff } from '@/lib/staff/guard'
import { getPatientRecord } from '@/lib/staff/patients'
import { isCaseSheetKind, normalizeSheetData } from '@/lib/staff/case-sheets'
import { PHOTO_BUCKET } from '@/lib/staff/patient-files'
import { PHOTO_MAX_BYTES, PHOTO_TAGS, PHOTO_TYPES } from '@/lib/staff/patient-photo-rules'

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

const uuid = z.string().uuid()
const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date.')
  .refine((v) => v >= '2000-01-01' && v <= '2100-12-31', 'Choose a valid date.')

function todayMY(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date())
}

// ── Case sheets: Vaidyas and admin only (clinical records) ─────────────────────

const SheetSchema = z.object({
  id: uuid.optional(),
  patientId: uuid,
  kind: z.string().refine(isCaseSheetKind, 'Unknown case sheet.'),
  sheetDate: ymd,
  data: z.unknown(),
})

export async function saveCaseSheet(raw: unknown): Promise<Result<{ id: string }>> {
  const { db, userId } = await requireStaff(['admin', 'doctor'])
  const parsed = SheetSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Please check the sheet.' }
  const v = parsed.data
  if (v.sheetDate > todayMY()) return { ok: false, error: 'The sheet date can’t be in the future.' }
  if (!(await getPatientRecord(db, v.patientId))) return { ok: false, error: 'Patient not found.' }
  const kind = v.kind as 'primary' | 'follow_up'
  const data = normalizeSheetData(kind, v.data)

  if (v.id) {
    const { data: row, error } = await db
      .from('patient_case_sheets')
      .update({ sheet_date: v.sheetDate, data, updated_by_staff_id: userId, updated_at: new Date().toISOString() })
      .eq('id', v.id)
      .eq('patient_id', v.patientId)
      .select('id')
      .maybeSingle()
    if (error || !row) {
      if (error) console.error('[case sheet] update:', error.message)
      return { ok: false, error: 'Could not save the case sheet. Please try again.' }
    }
    return { ok: true, id: row.id }
  }

  const { data: row, error } = await db
    .from('patient_case_sheets')
    .insert({ patient_id: v.patientId, kind, sheet_date: v.sheetDate, data, created_by_staff_id: userId, updated_by_staff_id: userId })
    .select('id')
    .single()
  if (error || !row) {
    if (error) console.error('[case sheet] insert:', error.message)
    return { ok: false, error: 'Could not save the case sheet. Please try again.' }
  }
  return { ok: true, id: row.id }
}

export async function deleteCaseSheet(id: string): Promise<Result> {
  const { db } = await requireStaff(['admin', 'doctor'])
  if (!uuid.safeParse(id).success) return { ok: false, error: 'Case sheet not found.' }
  const { error } = await db.from('patient_case_sheets').delete().eq('id', id)
  if (error) {
    console.error('[case sheet] delete:', error.message)
    return { ok: false, error: 'Could not delete the case sheet.' }
  }
  return { ok: true }
}

// ── Photos: any staff can add; Vaidyas and admin can delete ─────────────────────

/** Step 1 of an upload: a one-time signed link the browser uploads the file to. */
export async function startPhotoUpload(raw: unknown): Promise<Result<{ path: string; token: string }>> {
  const { db } = await requireStaff(['admin', 'doctor', 'front_desk'])
  const parsed = z.object({ patientId: uuid, contentType: z.string(), size: z.number().int().positive() }).safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Choose a photo to upload.' }
  const v = parsed.data
  const ext = PHOTO_TYPES[v.contentType]
  if (!ext) return { ok: false, error: 'Use a JPG, PNG or WebP photo.' }
  if (v.size > PHOTO_MAX_BYTES) return { ok: false, error: 'That photo is too large (5 MB max).' }
  if (!(await getPatientRecord(db, v.patientId))) return { ok: false, error: 'Patient not found.' }
  const path = `${v.patientId}/${randomUUID()}.${ext}`
  const { data, error } = await db.storage.from(PHOTO_BUCKET).createSignedUploadUrl(path)
  if (error || !data) {
    console.error('[photos] signed upload:', error?.message)
    return { ok: false, error: 'Photo uploads aren’t ready yet. Please try again later.' }
  }
  return { ok: true, path: data.path, token: data.token }
}

const PhotoMeta = {
  takenOn: ymd,
  tag: z.enum(PHOTO_TAGS).nullable(),
  remark: z
    .string()
    .trim()
    .max(500, 'Keep the remark under 500 characters.')
    .nullable()
    .transform((v) => (v ? v : null)),
}

/** Step 2: record the uploaded file against the patient. */
export async function savePhoto(raw: unknown): Promise<Result<{ id: string }>> {
  const { db, userId } = await requireStaff(['admin', 'doctor', 'front_desk'])
  const parsed = z.object({ patientId: uuid, path: z.string(), ...PhotoMeta }).safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Please check the photo details.' }
  const v = parsed.data
  // Only a path this patient's upload step handed out: "<patientId>/<uuid>.<ext>".
  if (!new RegExp(`^${v.patientId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`).test(v.path)) return { ok: false, error: 'Upload not recognised.' }
  if (v.takenOn > todayMY()) return { ok: false, error: 'The photo date can’t be in the future.' }
  const { data: row, error } = await db
    .from('patient_photos')
    .insert({ patient_id: v.patientId, storage_path: v.path, taken_on: v.takenOn, tag: v.tag, remark: v.remark, uploaded_by_staff_id: userId })
    .select('id')
    .single()
  if (error || !row) {
    console.error('[photos] insert:', error?.message)
    await db.storage.from(PHOTO_BUCKET).remove([v.path])
    return { ok: false, error: 'Could not save the photo. Please try again.' }
  }
  return { ok: true, id: row.id }
}

export async function updatePhoto(raw: unknown): Promise<Result> {
  const { db } = await requireStaff(['admin', 'doctor', 'front_desk'])
  const parsed = z.object({ id: uuid, ...PhotoMeta }).safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Please check the photo details.' }
  const v = parsed.data
  if (v.takenOn > todayMY()) return { ok: false, error: 'The photo date can’t be in the future.' }
  const { error } = await db.from('patient_photos').update({ taken_on: v.takenOn, tag: v.tag, remark: v.remark }).eq('id', v.id)
  if (error) {
    console.error('[photos] update:', error.message)
    return { ok: false, error: 'Could not save the changes.' }
  }
  return { ok: true }
}

export async function deletePhoto(id: string): Promise<Result> {
  const { db } = await requireStaff(['admin', 'doctor'])
  if (!uuid.safeParse(id).success) return { ok: false, error: 'Photo not found.' }
  const { data: row } = await db.from('patient_photos').select('storage_path').eq('id', id).maybeSingle()
  if (!row) return { ok: false, error: 'Photo not found.' }
  const { error } = await db.from('patient_photos').delete().eq('id', id)
  if (error) {
    console.error('[photos] delete:', error.message)
    return { ok: false, error: 'Could not delete the photo.' }
  }
  await db.storage.from(PHOTO_BUCKET).remove([row.storage_path])
  return { ok: true }
}

// ── Visit remarks: any staff; a visit's own record stays read-only ──────────────

export async function addVisitRemark(raw: unknown): Promise<Result> {
  const { db, userId } = await requireStaff(['admin', 'doctor', 'front_desk'])
  const parsed = z
    .object({ appointmentId: uuid, body: z.string().trim().min(1, 'Write a remark first.').max(1000, 'Keep the remark under 1,000 characters.') })
    .safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Write a remark first.' }
  const v = parsed.data
  const { data: appt } = await db.from('appointments').select('id').eq('id', v.appointmentId).maybeSingle()
  if (!appt) return { ok: false, error: 'Visit not found.' }
  const { data: me } = await db.from('users').select('full_name').eq('id', userId).maybeSingle()
  const { error } = await db
    .from('visit_remarks')
    .insert({ appointment_id: v.appointmentId, body: v.body, author_staff_id: userId, author_name: me?.full_name ?? null })
  if (error) {
    console.error('[visit remarks] insert:', error.message)
    return { ok: false, error: 'Could not save the remark. Please try again.' }
  }
  return { ok: true }
}
