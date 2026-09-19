'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

type Result = { ok: true } | { ok: false; error: string }

export async function setDefaultAddress(id: string): Promise<Result> {
  if (!id) return { ok: false, error: 'Missing address ID.' }
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Not authorised.' }

  const supabase = await createClient()

  // Clear current default.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('addresses') as any)
    .update({ is_default: false })
    .eq('customer_id', me.authId)
    .eq('is_default', true)

  // Set the new default.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('addresses') as any)
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('customer_id', me.authId)

  if (error) {
    console.error('[setDefaultAddress] failed:', error.message)
    return { ok: false, error: 'Could not set as default.' }
  }
  revalidatePath('/account/addresses')
  return { ok: true }
}
