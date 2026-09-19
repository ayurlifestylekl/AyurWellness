'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

type Result = { ok: true } | { ok: false; error: string }

export async function unenrollMfa(): Promise<Result> {
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Not authorised.' }

  const supabase = await createClient()
  const factors = await supabase.auth.mfa.listFactors()
  if (factors.error || !factors.data) {
    return { ok: false, error: 'Could not load MFA factors.' }
  }
  for (const f of factors.data.totp) {
    await supabase.auth.mfa.unenroll({ factorId: f.id })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('users') as any).update({ mfa_enrolled: false }).eq('id', me.authId)

  revalidatePath('/account/profile')
  return { ok: true }
}
