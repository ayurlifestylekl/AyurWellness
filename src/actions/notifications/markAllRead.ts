'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

type Result = { ok: true } | { ok: false; error: string }

export async function markAllRead(): Promise<Result> {
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Not authorised.' }
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('notifications') as any)
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', me.authId)
    .is('read_at', null)
  if (error) return { ok: false, error: 'Could not mark all as read.' }
  return { ok: true }
}
