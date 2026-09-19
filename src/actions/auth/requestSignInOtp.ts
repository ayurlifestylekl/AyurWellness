'use server'

import { createClient } from '@/lib/supabase/server'
import { detectIdentifier } from '@/lib/auth/detectIdentifier'

type Result =
  | { ok: true; email: string }
  | { ok: false; error: string }

/**
 * Step 1 of the two-step sign-in: validate the password, then trigger
 * an email OTP that the user has to enter in step 2.
 *
 * Identifier can be either an email OR a Malaysian phone number — we
 * auto-detect, and if it's a phone, look up the matching email from
 * public.users.
 *
 * Why the password+signOut dance: Supabase has no "verify password
 * without creating session" primitive, so we sign in with password to
 * verify it, then immediately sign out so the session doesn't grant
 * access until the OTP step completes.
 */
export async function requestSignInOtp(
  identifierRaw: string,
  password: string
): Promise<Result> {
  const id = detectIdentifier(identifierRaw)
  if (!id) {
    return { ok: false, error: 'Enter a valid email or Malaysian phone number.' }
  }
  if (!password || password.length < 1) {
    return { ok: false, error: 'Please enter your password.' }
  }

  const supabase = await createClient()

  // ── 1. Resolve to an email ───────────────────────────────────────
  let email: string
  if (id.type === 'email') {
    email = id.value
  } else {
    // Phone — look up the account that owns this number.
    // public.users has a partial unique-when-set index on phone_number.
    const { data: row, error: lookupError } = await supabase
      .from('users')
      .select('email')
      .eq('phone_number', id.value)
      .maybeSingle()
    if (lookupError) {
      console.error('[auth/request-otp] phone lookup failed:', lookupError.message)
      return { ok: false, error: 'Could not verify your account. Please try again.' }
    }
    const user = row as { email: string | null } | null
    if (!user?.email) {
      // Generic message — don't leak whether the phone is registered.
      return { ok: false, error: 'Invalid email/phone or password.' }
    }
    email = user.email
  }

  // ── 2. Validate the password by signing in ───────────────────────
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError) {
    return { ok: false, error: 'Invalid email/phone or password.' }
  }

  // ── 3. Immediately invalidate that session — OTP must complete first
  await supabase.auth.signOut()

  // ── 4. Send the email OTP code ───────────────────────────────────
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })
  if (otpError) {
    console.error('[auth/request-otp] OTP send failed:', otpError.message)
    return {
      ok: false,
      error: /rate/i.test(otpError.message)
        ? 'Too many requests. Please wait a minute and try again.'
        : 'Could not send the verification code. Please try again.',
    }
  }

  return { ok: true, email }
}
