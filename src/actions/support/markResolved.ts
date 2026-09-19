'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export interface MarkResolvedResponse {
  ok: boolean
  error?: string
}

export async function markResolved(ticketId: string): Promise<MarkResolvedResponse> {
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Please sign in.' }
  if (me.role !== 'customer') {
    return { ok: false, error: 'Only customer accounts can resolve their own tickets.' }
  }
  if (!ticketId || ticketId.length < 8) {
    return { ok: false, error: 'Invalid ticket.' }
  }

  const supabase = await createClient()
  // Cast the from() result — Supabase v2 inference resolves .update()'s
  // payload type to `never`, which `as any` can't widen at the param site.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('support_tickets') as any)
    .update({ status: 'resolved' })
    .eq('id', ticketId)
    .eq('customer_id', me.authId)

  if (error) {
    console.error('[markResolved] failed:', error.message)
    return { ok: false, error: "Couldn't update ticket status." }
  }

  revalidatePath(`/account/messages/${ticketId}`)
  revalidatePath('/account/messages')
  return { ok: true }
}
