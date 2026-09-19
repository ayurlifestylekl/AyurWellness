'use server'

import { createClient } from '@/lib/supabase/server'
import { homeForRole, type UserRole } from '@/lib/auth/getCurrentUser'
import type { AuthResult } from './types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase()

  if (!EMAIL_RE.test(cleanEmail)) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }
  if (!password || password.length < 1) {
    return { ok: false, error: 'Please enter your password.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  })

  if (error) {
    console.error('[auth/signIn] failed:', error.message)
    return { ok: false, error: 'Invalid email or password.' }
  }

  // Look up role to know where to redirect
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) {
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
