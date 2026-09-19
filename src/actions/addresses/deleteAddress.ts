'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

type Result = { ok: true } | { ok: false; error: string }

export async function deleteAddress(id: string): Promise<Result> {
  if (!id) return { ok: false, error: 'Missing address ID.' }
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Not authorised.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', id)
    .eq('customer_id', me.authId)

  if (error) {
    console.error('[deleteAddress] failed:', error.message)
    return { ok: false, error: 'Could not delete address.' }
  }
  revalidatePath('/account/addresses')
  return { ok: true }
}
