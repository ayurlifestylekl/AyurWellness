'use server'

import { memberAccountsOpen, ACCOUNTS_CLOSED_MESSAGE } from '@/lib/auth/accounts'
import { createClient } from '@/lib/supabase/server'
import type { AuthResult } from './types'

/**
 * Resend a verification code to an email. Works for both the
 * sign-up confirmation flow and the sign-in OTP step — Supabase
 * picks the appropriate type based on the account state.
 */
export async function resendEmailOtp(email: string): Promise<AuthResult> {
  // Refuse before any email is attempted: it can't be delivered until email is set up.
  if (!memberAccountsOpen()) return { ok: false, error: ACCOUNTS_CLOSED_MESSAGE }
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { ok: false, error: 'Session lost. Please start over.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: cleanEmail,
    options: { shouldCreateUser: false },
  })

  if (error) {
    console.error('[auth/resend-otp] failed:', error.message)
    return {
      ok: false,
      error: /rate/i.test(error.message)
        ? 'Please wait a moment before requesting another code.'
        : 'Could not resend the code. Please try again.',
    }
  }

  return { ok: true }
}
