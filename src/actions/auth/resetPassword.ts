'use server'

import { createClient } from '@/lib/supabase/server'
import type { AuthResult } from './types'

/**
 * Set a new password. Called from /auth/reset-password after Supabase
 * has placed the user in a "recovery" session via the magic link they
 * received in the password-reset email.
 */
export async function resetPassword(newPassword: string): Promise<AuthResult> {
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    console.error('[auth/reset] failed:', error.message)
    return {
      ok: false,
      error: 'Could not reset password. The reset link may have expired — please request a new one.',
    }
  }

  return { ok: true, redirectTo: '/auth/login?reset=success' }
}
