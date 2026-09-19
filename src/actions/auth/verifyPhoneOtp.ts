'use server'

import { createClient } from '@/lib/supabase/server'
import { homeForRole, type UserRole } from '@/lib/auth/getCurrentUser'
import { normalizeMalaysianPhone } from '@/lib/auth/phone'
import type { AuthResult } from './types'

/**
 * Verify the SMS code sent by sendPhoneOtp. On success the user is signed
 * in; this returns the URL their role lands them at.
 *
 * If a `fullName` is provided (first-ever phone-OTP signup), the helper
 * also writes it into the public.users row.
 */
export async function verifyPhoneOtp(
  phone: string,
  code: string,
  fullName?: string
): Promise<AuthResult> {
  const normalized = normalizeMalaysianPhone(phone)
  if (!normalized) {
    return { ok: false, error: 'Phone number is invalid. Please start over.' }
  }
  const cleanCode = code.trim()
  if (!/^\d{6}$/.test(cleanCode)) {
    return { ok: false, error: 'Please enter the 6-digit code from the SMS.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalized,
    token: cleanCode,
    type: 'sms',
  })

  if (error || !data.user) {
    console.error('[auth/phone] verify failed:', error?.message)
    return {
      ok: false,
      error: /expired/i.test(error?.message ?? '')
        ? 'That code has expired. Tap "Resend" to get a new one.'
        : "That code didn't match. Try again or resend.",
    }
  }

  // First-time signup: write the name (and ensure phone_number is set in case
  // the trigger didn't populate it for some reason).
  if (fullName?.trim()) {
    const cleanName = fullName.trim().slice(0, 120)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('users').update as any)({
      full_name: cleanName,
      phone_number: normalized,
    }).eq('id', data.user.id)
  }

  // Look up role to know where to redirect
  const { data: profileRaw } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const profile = profileRaw as { role: UserRole } | null
  const role = profile?.role ?? 'customer'
  return { ok: true, redirectTo: homeForRole(role) }
}
