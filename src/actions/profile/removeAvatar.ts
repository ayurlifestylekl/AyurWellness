'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

type Result = { ok: true } | { ok: false; error: string }

export async function removeAvatar(): Promise<Result> {
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Not authorised.' }
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('users') as any)
    .update({ avatar_url: null })
    .eq('id', me.authId)
  if (error) return { ok: false, error: 'Could not remove avatar.' }
  revalidatePath('/account/profile')
  revalidatePath('/account/dashboard')
  return { ok: true }
}
