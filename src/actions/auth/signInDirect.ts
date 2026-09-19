'use server'

import { createClient } from '@/lib/supabase/server'
import { detectIdentifier } from '@/lib/auth/detectIdentifier'
import { homeForRole, type UserRole } from '@/lib/auth/getCurrentUser'
import type { AuthResult } from './types'

/**
 * Direct password sign-in WITHOUT the email-OTP second step.
 *
 * Used only when NEXT_PUBLIC_REQUIRE_OTP=false (local dev) — see
 * LoginForm for the flag-driven branching. In production builds this
 * action is never invoked because LoginForm hard-codes OTP_REQUIRED=true
 * regardless of the env var.
 *
 * Mirrors the password+identifier-detect logic of `requestSignInOtp`
 * but skips the signOut+sendOTP dance: it keeps the session immediately
 * on successful password validation and returns the role's home URL.
 */
export async function signInDirect(
  identifierRaw: string,
  password: string
): Promise<AuthResult> {
  const id = detectIdentifier(identifierRaw)
  if (!id) {
    return { ok: false, error: 'Enter a valid email or Malaysian phone number.' }
  }
  if (!password || password.length < 1) {
    return { ok: false, error: 'Please enter your password.' }
  }

  const supabase = await createClient()

  // ── 1. Resolve identifier to an email ────────────────────────────
  let email: string
  if (id.type === 'email') {
    email = id.value
  } else {
    const { data: row, error: lookupError } = await supabase
      .from('users')
      .select('email')
      .eq('phone_number', id.value)
      .maybeSingle()
    if (lookupError) {
      console.error('[auth/signInDirect] phone lookup failed:', lookupError.message)
      return { ok: false, error: 'Could not verify your account. Please try again.' }
    }
    const user = row as { email: string | null } | null
    if (!user?.email) {
      return { ok: false, error: 'Invalid email/phone or password.' }
    }
    email = user.email
  }

  // ── 2. Validate password — KEEP the session (no signOut) ─────────
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError) {
    return { ok: false, error: 'Invalid email/phone or password.' }
  }

  // ── 3. Look up role to know where to redirect ────────────────────
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) {
    return { ok: false, error: 'Sign-in succeeded but session is missing. Please try again.' }
  }
  const { data: profileRaw } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()
  const profile = profileRaw as { role: UserRole } | null
  const role = profile?.role ?? 'customer'

  return { ok: true, redirectTo: homeForRole(role) }
}
