'use server'

import { createClient } from '@/lib/supabase/server'
import { homeForRole, type UserRole } from '@/lib/auth/getCurrentUser'
import type { AuthResult } from './types'

/**
 * Step 2 of the sign-up flow: verify the 6-digit confirmation code
 * that Supabase emails after `signUpCustomer` creates the auth user.
 * On success the account is marked confirmed and a session is created.
 */
export async function verifySignUpOtp(
  email: string,
  code: string
): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase()
  const cleanCode = code.trim()

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, error: 'Session lost. Please start over.' }
  }
  if (!/^\d{6}$/.test(cleanCode)) {
    return { ok: false, error: 'Please enter the 6-digit code from your email.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email: cleanEmail,
    token: cleanCode,
    type: 'signup',
  })

  if (error || !data.user) {
    console.error('[auth/verify-signup-otp] failed:', error?.message)
    return {
      ok: false,
      error: /expired/i.test(error?.message ?? '')
        ? 'That code has expired. Tap "Resend" to get a new one.'
        : "That code didn't match. Try again or resend.",
    }
  }

  // First-ever sign-in via signup OTP — new customers always land on /account
  const { data: profileRaw } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const profile = profileRaw as { role: UserRole } | null
  const role = profile?.role ?? 'customer'
  return { ok: true, redirectTo: homeForRole(role) }
}
