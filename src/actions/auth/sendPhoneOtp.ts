'use server'

import { createClient } from '@/lib/supabase/server'
import { normalizeMalaysianPhone } from '@/lib/auth/phone'
import type { AuthResult } from './types'

/**
 * Send an SMS one-time-passcode to the given phone. Step 1 of the phone-OTP
 * sign-in flow. Step 2 is verifyPhoneOtp.
 *
 * Requires Phone provider to be enabled in Supabase Dashboard → Auth →
 * Providers → Phone (with Twilio/MessageBird credentials configured).
 */
export async function sendPhoneOtp(phone: string): Promise<AuthResult> {
  const normalized = normalizeMalaysianPhone(phone)
  if (!normalized) {
    return {
      ok: false,
      error: 'Please enter a valid Malaysian mobile number.',
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({ phone: normalized })

  if (error) {
    console.error('[auth/phone] OTP send failed:', error.message)
    // Common Supabase errors: provider not configured, rate-limited, invalid phone.
    return {
      ok: false,
      error: /rate/i.test(error.message)
        ? 'Too many requests. Please wait a minute and try again.'
        : 'Could not send the code. Please try again.',
    }
  }

  return { ok: true }
}
