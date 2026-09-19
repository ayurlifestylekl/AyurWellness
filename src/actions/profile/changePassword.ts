'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export interface ChangePasswordResponse {
  ok: boolean
  error?: string
}

const MIN_LEN = 8

function validatePassword(pw: string): string | null {
  if (pw.length < MIN_LEN) return `Password must be at least ${MIN_LEN} characters.`
  if (!/[a-zA-Z]/.test(pw)) return 'Password must contain at least one letter.'
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.'
  return null
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResponse> {
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Please sign in first.' }
  if (!me.email) {
    return {
      ok: false,
      error: 'Password change requires an email-based account. Contact us for help.',
    }
  }

  if (!currentPassword) return { ok: false, error: 'Enter your current password.' }
  const validationErr = validatePassword(newPassword)
  if (validationErr) return { ok: false, error: validationErr }
  if (currentPassword === newPassword) {
    return { ok: false, error: 'New password must be different from the current one.' }
  }

  const supabase = await createClient()

  // Defence in depth — Supabase's `updateUser({ password })` does NOT verify
  // the current password, so we re-sign in to confirm it before updating.
  const { error: signinErr } = await supabase.auth.signInWithPassword({
    email: me.email,
    password: currentPassword,
  })
  if (signinErr) {
    return { ok: false, error: 'Current password is incorrect.' }
  }

  const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
  if (updateErr) {
    console.error('[changePassword] updateUser failed:', updateErr.message)
    return { ok: false, error: "Couldn't change your password. Please try again." }
  }

  return { ok: true }
}
