import 'server-only'
import { redirect } from 'next/navigation'
import { createClient as ssr } from '@/lib/supabase/server'
import { createClient as createSb, type SupabaseClient } from '@supabase/supabase-js'

export type StaffRole = 'admin' | 'doctor' | 'front_desk'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServiceDb = SupabaseClient<any, 'public', any>

/**
 * Server-only staff gate. Verifies the signed-in user holds one of the
 * allowed roles, then returns a SERVICE-ROLE client (bypasses RLS) for
 * data work. Redirects to the staff login if unauthorized. The service
 * client is only ever created after the role check passes.
 */
export async function requireStaff(
  allowed: StaffRole[] = ['admin', 'doctor', 'front_desk'],
): Promise<{ userId: string; role: StaffRole; db: ServiceDb }> {
  const s = await ssr()
  const {
    data: { user },
  } = await s.auth.getUser()
  if (!user) redirect('/staff/login')

  const { data: profileRaw } = await s.from('users').select('role').eq('id', user.id).maybeSingle()
  const profile = profileRaw as { role: string } | null
  const role = (profile?.role ?? null) as StaffRole | null
  if (!role || !allowed.includes(role)) {
    redirect(allowed.includes('doctor') && !allowed.includes('front_desk') ? '/doctor/login' : '/staff/login')
  }

  const db = createSb(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  return { userId: user.id, role: role as StaffRole, db }
}
