'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

type Result = { ok: true } | { ok: false; error: string }

export async function verifyMfaEnrollment(factorId: string, code: string): Promise<Result> {
  if (!factorId) return { ok: false, error: 'Missing factor ID.' }
  if (!/^\d{6}$/.test(code.trim())) return { ok: false, error: 'Code should be 6 digits.' }

  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Not authorised.' }

  const supabase = await createClient()
  const challenge = await supabase.auth.mfa.challenge({ factorId })
  if (challenge.error || !challenge.data) {
    return { ok: false, error: 'Could not start verification. Please try again.' }
  }

  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code: code.trim(),
  })
  if (verify.error) return { ok: false, error: 'Incorrect code. Try again.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('users') as any).update({ mfa_enrolled: true }).eq('id', me.authId)

  revalidatePath('/account/profile')
  return { ok: true }
}
