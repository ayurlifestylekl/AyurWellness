'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export interface ProfileUpdateInput {
  full_name?: string | null
  gender?: 'male' | 'female' | null
  date_of_birth?: string | null
  language?: 'en' | 'ms'
  height_cm?: number | null
  weight_kg?: number | null
  allergies?: string | null
  current_medications?: string | null
  medical_conditions?: string | null
  marketing_opt_in?: boolean
  whatsapp_reminders_opt_in?: boolean
  email_reminders_opt_in?: boolean
  treatment_followups_opt_in?: boolean
}

export interface UpdateProfileResponse {
  ok: boolean
  error?: string
}

const NAME_MAX = 120
const TEXTAREA_MAX = 1500

function trimOrNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const t = value.trim()
  return t.length === 0 ? null : t
}

function validate(input: ProfileUpdateInput): string | null {
  if (input.full_name !== undefined) {
    const v = input.full_name?.trim() ?? ''
    if (!v) return 'Name cannot be empty.'
    if (v.length > NAME_MAX) return `Name must be ${NAME_MAX} characters or fewer.`
  }
  if (input.gender !== undefined && input.gender !== null) {
    if (input.gender !== 'male' && input.gender !== 'female') {
      return 'Pick a valid option for gender.'
    }
  }
  if (input.date_of_birth !== undefined && input.date_of_birth !== null) {
    const t = Date.parse(input.date_of_birth)
    if (Number.isNaN(t)) return 'Invalid date of birth.'
    const min = Date.parse('1900-01-01')
    const max = Date.now()
    if (t < min || t > max) return 'Date of birth is out of range.'
  }
  if (input.language !== undefined && input.language !== 'en' && input.language !== 'ms') {
    return 'Invalid language.'
  }
  if (input.height_cm !== undefined && input.height_cm !== null) {
    if (!Number.isFinite(input.height_cm) || input.height_cm < 50 || input.height_cm > 250) {
      return 'Height must be between 50 and 250 cm.'
    }
  }
  if (input.weight_kg !== undefined && input.weight_kg !== null) {
    if (!Number.isFinite(input.weight_kg) || input.weight_kg < 20 || input.weight_kg > 300) {
      return 'Weight must be between 20 and 300 kg.'
    }
  }
  for (const field of ['allergies', 'current_medications', 'medical_conditions'] as const) {
    const v = input[field]
    if (v !== undefined && v !== null && v.length > TEXTAREA_MAX) {
      return `${field.replace('_', ' ')} is too long (max ${TEXTAREA_MAX} characters).`
    }
  }
  return null
}

export async function updateProfile(
  input: ProfileUpdateInput
): Promise<UpdateProfileResponse> {
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Please sign in first.' }
  if (me.role !== 'customer') {
    return { ok: false, error: 'Only customer accounts can update this profile.' }
  }

  const err = validate(input)
  if (err) return { ok: false, error: err }

  // Build a sanitised patch — only the whitelisted fields. NEVER allow
  // id / email / phone_number / role / created_at through this action.
  const patch: Record<string, unknown> = {}

  if (input.full_name !== undefined) patch.full_name = trimOrNull(input.full_name)
  if (input.gender !== undefined) patch.gender = input.gender
  if (input.date_of_birth !== undefined) patch.date_of_birth = input.date_of_birth
  if (input.language !== undefined) patch.language = input.language
  if (input.height_cm !== undefined) patch.height_cm = input.height_cm
  if (input.weight_kg !== undefined) patch.weight_kg = input.weight_kg
  if (input.allergies !== undefined) patch.allergies = trimOrNull(input.allergies)
  if (input.current_medications !== undefined) {
    patch.current_medications = trimOrNull(input.current_medications)
  }
  if (input.medical_conditions !== undefined) {
    patch.medical_conditions = trimOrNull(input.medical_conditions)
  }
  if (input.marketing_opt_in !== undefined) patch.marketing_opt_in = input.marketing_opt_in
  if (input.whatsapp_reminders_opt_in !== undefined) {
    patch.whatsapp_reminders_opt_in = input.whatsapp_reminders_opt_in
  }
  if (input.email_reminders_opt_in !== undefined) {
    patch.email_reminders_opt_in = input.email_reminders_opt_in
  }
  if (input.treatment_followups_opt_in !== undefined) {
    patch.treatment_followups_opt_in = input.treatment_followups_opt_in
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'No changes to save.' }
  }

  const supabase = await createClient()
  // Cast — Supabase v2's `.update()` type inference resolves to `never`
  // for this hand-maintained Database type. RLS enforces id = auth.uid().
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbErr } = await (supabase.from('users') as any)
    .update(patch)
    .eq('id', me.authId)

  if (dbErr) {
    console.error('[updateProfile] failed:', dbErr.message)
    return { ok: false, error: "Couldn't save your profile. Please try again." }
  }

  revalidatePath('/account/profile')
  revalidatePath('/account/dashboard')
  return { ok: true }
}
