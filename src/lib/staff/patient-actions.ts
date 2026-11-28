'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/staff/guard'
import { normalizePhone, recordKey, searchReturningClients, type ReturningClient } from '@/lib/staff/patients'

/** "Find existing client" on the console booking forms (front desk + admin). */
export async function findReturningClients(query: string): Promise<ReturningClient[]> {
  const { db } = await requireStaff(['admin', 'front_desk'])
  return searchReturningClients(db, query)
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters.`)
    .optional()
    .transform((v) => (v ? v : null))

const PatientSchema = z.object({
  id: z.string().uuid().optional(),
  fullName: z.string().trim().min(2, 'Enter the patient’s full name.').max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => normalizePhone(v) !== null, 'Enter a valid phone number.'),
  email: z
    .string()
    .trim()
    .max(254)
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.string().email().safeParse(v).success, 'Enter a valid email or leave it blank.'),
  gender: z.enum(['female', 'male'], { errorMap: () => ({ message: 'Choose a gender (used for therapist matching).' }) }),
  dateOfBirth: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || (/^\d{4}-\d{2}-\d{2}$/.test(v) && v <= new Date().toISOString().slice(0, 10) && v >= '1900-01-01'), 'Enter a valid date of birth.'),
  age: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined || v === '' ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 130), 'Enter the age in years, or leave it blank.'),
  address: optionalText(300),
  conditions: optionalText(1000),
  allergies: optionalText(1000),
  medications: optionalText(1000),
  notes: optionalText(2000),
})

export type SavePatientResult = { ok: true; id: string } | { ok: false; error: string; existingId?: string }

/** Add a patient by hand, or update their record (front desk, doctors, admin). */
export async function savePatient(raw: unknown): Promise<SavePatientResult> {
  const { db, userId } = await requireStaff(['admin', 'front_desk', 'doctor'])
  const parsed = PatientSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Please check the form.' }
  const v = parsed.data

  // One record per person: the same phone + first name is the same patient.
  const key = recordKey({ phone: v.phone, fullName: v.fullName })
  const phone = normalizePhone(v.phone)!
  const { data: same, error: dupErr } = await db
    .from('patients')
    .select('id, full_name, phone')
    .ilike('phone', `*${phone.slice(-7).split('').join('*')}*`)
    .limit(20)
  if (dupErr) {
    const missing = dupErr.code === '42P01' || dupErr.code === 'PGRST205' || /Could not find|does not exist/.test(dupErr.message)
    return {
      ok: false,
      error: missing
        ? 'Adding patients needs a one-time database update. Please ask your developer to run it.'
        : 'Could not save the patient. Please try again.',
    }
  }
  const duplicate = (same ?? []).find((r) => r.id !== v.id && recordKey({ phone: r.phone, fullName: r.full_name }) === key)
  if (duplicate) {
    return { ok: false, error: `${duplicate.full_name} is already saved with this phone number.`, existingId: duplicate.id }
  }

  const row = {
    full_name: v.fullName,
    phone: v.phone,
    email: v.email,
    gender: v.gender,
    date_of_birth: v.dateOfBirth,
    address: v.address,
    conditions: v.conditions,
    allergies: v.allergies,
    medications: v.medications,
    notes: v.notes,
    updated_by_staff_id: userId,
    updated_at: new Date().toISOString(),
  }

  // Age is kept only when there is no date of birth (the date of birth gives the age).
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date())
  const ageCols = v.dateOfBirth || v.age === null ? { age_years: null, age_recorded_on: null } : { age_years: v.age, age_recorded_on: today }
  const write = (r: Record<string, unknown>) =>
    v.id ? db.from('patients').update(r).eq('id', v.id).select('id').single() : db.from('patients').insert({ ...r, created_by_staff_id: userId }).select('id').single()
  let { data, error } = await write({ ...row, ...ageCols })
  // Before 20261130_centre_requests.sql there is no age column: save the rest.
  if (error && /age_years|age_recorded_on/.test(error.message)) ({ data, error } = await write(row))
  if (error || !data) {
    console.error('[staff/patient-actions] save:', error?.message)
    return { ok: false, error: 'Could not save the patient. Please try again.' }
  }

  revalidatePath('/console/patients')
  revalidatePath('/doctor/patients')
  return { ok: true, id: data.id }
}
