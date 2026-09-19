import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

export type UserRole = 'admin' | 'customer' | 'sales_agent' | 'doctor' | 'front_desk'

export type CurrentUser = {
  authId: string
  /** Best-available identifier for display. Email if present, else phone, else empty. */
  identifier: string
  /** Auth email (may be empty for phone-only signups). */
  email: string | null
  /** Auth phone (may be null for email signups). */
  phone: string | null
  profile: Database['public']['Tables']['users']['Row']
  role: UserRole
}

/**
 * Server-side helper. Returns the signed-in user's auth + profile + role
 * in one shot, or null if not signed in.
 * Used by every dashboard layout and any page that needs role-aware data.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) return null

  const { data: profileRaw, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  // Cast: the hand-maintained Database type predates Supabase v2's
  // __InternalSupabase metadata, so the inferred Row type is `never`.
  const profile = profileRaw as Database['public']['Tables']['users']['Row'] | null
  if (profileError || !profile) return null

  const email = authData.user.email ?? profile.email ?? null
  const phone = authData.user.phone ?? profile.phone_number ?? null
  const identifier = email || phone || ''

  return {
    authId: authData.user.id,
    identifier,
    email,
    phone,
    profile,
    role: profile.role as UserRole,
  }
}

/** Where each role's dashboard lives — used by sign-in redirects + role mismatch handling. */
export function homeForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'sales_agent':
      return '/agent/dashboard'
    case 'doctor':
      return '/doctor'
    case 'front_desk':
      return '/console'
    case 'customer':
    default:
      return '/account/dashboard'
  }
}
