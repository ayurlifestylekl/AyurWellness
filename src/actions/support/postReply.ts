'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

const BODY_MAX = 2000

export interface PostReplyResponse {
  ok: boolean
  error?: string
}

export async function postReply(
  ticketId: string,
  body: string
): Promise<PostReplyResponse> {
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Please sign in to reply.' }
  if (me.role !== 'customer') {
    return { ok: false, error: 'Only customer accounts can reply on a ticket.' }
  }

  const trimmed = (body ?? '').trim()
  if (!trimmed) return { ok: false, error: 'Write a message first.' }
  if (trimmed.length > BODY_MAX) {
    return { ok: false, error: `Message must be ${BODY_MAX} characters or fewer.` }
  }
  if (!ticketId || ticketId.length < 8) {
    return { ok: false, error: 'Invalid ticket.' }
  }

  const supabase = await createClient()

  // Verify ownership defensively (RLS would block anyway).
  const { data: ticket, error: lookupErr } = await supabase
    .from('support_tickets')
    .select('id, status')
    .eq('id', ticketId)
    .eq('customer_id', me.authId)
    .maybeSingle()

  if (lookupErr || !ticket) {
    return { ok: false, error: "Couldn't find that ticket." }
  }

  // Insert the customer reply.
  const { error: msgErr } = await supabase
    .from('support_messages')
    .insert({
      ticket_id: ticketId,
      sender_kind: 'customer',
      body: trimmed,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

  if (msgErr) {
    console.error('[postReply] message insert failed:', msgErr.message)
    return { ok: false, error: "Couldn't send. Please try again." }
  }

  // Bump ticket activity + re-open if it was resolved/closed.
  const currentStatus = (ticket as { status: string }).status
  const nextStatus =
    currentStatus === 'resolved' || currentStatus === 'closed'
      ? 'open'
      : currentStatus

  // Cast the from() result — Supabase v2 inference resolves .update()'s
  // payload type to `never`, which `as any` can't widen at the param site.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('support_tickets') as any)
    .update({
      last_message_at: new Date().toISOString(),
      unread_by_clinic: true,
      status: nextStatus,
    })
    .eq('id', ticketId)

  revalidatePath(`/account/messages/${ticketId}`)
  revalidatePath('/account/messages')
  revalidatePath('/account/dashboard')
  return { ok: true }
}
