'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { switchOutcome, type Portal } from '@/lib/staff/portal-switch'

/**
 * Move between the Front desk and Doctor portals. Admin goes straight there;
 * a front desk or doctor account is signed out and taken to the other
 * portal's sign-in page. The role is read here on the server — the button only
 * says where the person wants to go.
 */
export async function switchPortal(target: Portal): Promise<void> {
  if (target !== 'console' && target !== 'doctor') redirect('/')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let role: string | null = null
  if (user) {
    const { data } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    role = (data as { role: string } | null)?.role ?? null
  }
  const outcome = switchOutcome(role, target)
  if (outcome.kind === 'sign-in' && user) await supabase.auth.signOut()
  redirect(outcome.to)
}
