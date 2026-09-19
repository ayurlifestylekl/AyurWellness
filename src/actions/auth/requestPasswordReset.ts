'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { AuthResult } from './types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Send a password-reset email. Always returns ok (even when the email
 * doesn't exist in our system) so we don't leak account existence.
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase()

  if (!EMAIL_RE.test(cleanEmail)) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }

  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const resetUrl = `${proto}://${host}/auth/reset-password`

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: resetUrl,
  })

  if (error) {
    console.error('[auth/reset-request] failed:', error.message)
    // Intentionally still return ok — don't leak whether the email is registered.
  }

  return { ok: true }
}
