'use server'

import { createClient } from '@/lib/supabase/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\-\s()]{8,30}$/

export interface SignUpCustomerInput {
  email: string
  password: string
  fullName: string
  phone: string
}

export type SignUpCustomerResult =
  | { ok: true; needsVerification: true; email: string }
  | { ok: true; needsVerification: false; redirectTo: string }
  | { ok: false; error: string }

/**
 * Customer sign-up. Creates an auth.users row; the on_auth_user_created
 * trigger inserts the matching public.users row with role='customer' and
 * pulls full_name + phone_number from the signup metadata.
 *
 * Supabase emails a 6-digit confirmation code (configure the email
 * template to use `{{ .Token }}` — see docs/admin-bootstrap.md).
 * The UI then pivots to a code-entry step on the same screen and calls
 * `verifySignUpOtp(email, code)` to complete activation.
 *
 * If email confirmation is disabled in Supabase, the user is signed in
 * immediately and we return a redirectTo instead.
 */
export async function signUpCustomer(
  input: SignUpCustomerInput
): Promise<SignUpCustomerResult> {
  const email = input.email.trim().toLowerCase()
  const fullName = input.fullName.trim()
  const phone = input.phone.trim()
  const password = input.password

  if (!EMAIL_RE.test(email) || email.length > 200) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }
  if (!password || password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' }
  }
  if (fullName.length < 2 || fullName.length > 120) {
    return { ok: false, error: 'Please tell us your full name.' }
  }
  if (!PHONE_RE.test(phone)) {
    return { ok: false, error: 'Please enter a valid phone number.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone_number: phone },
    },
  })

  if (error) {
    console.error('[auth/signUp] failed:', error.message)
    const isExisting = /already|registered|exists/i.test(error.message)
    return {
      ok: false,
      error: isExisting
        ? 'An account already exists for this email. Try signing in.'
        : 'Could not create your account. Please try again.',
    }
  }

  // If email confirmation is required, no session yet — UI pivots to OTP step.
  if (data.user && !data.session) {
    return { ok: true, needsVerification: true, email }
  }

  // Email confirmation disabled in Supabase — signed in immediately.
  return { ok: true, needsVerification: false, redirectTo: '/account/dashboard' }
}
