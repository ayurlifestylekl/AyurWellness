'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { TOPIC_OPTIONS } from '@/lib/support/format'
import type { TopicKey } from '@/lib/support/format'

export interface CreateTicketInput {
  topic: TopicKey
  subject: string
  body: string
}

export interface CreateTicketResponse {
  ok: boolean
  ticketId?: string
  error?: string
}

const VALID_TOPICS: ReadonlySet<TopicKey> = new Set([
  ...TOPIC_OPTIONS.map((t) => t.value),
])

const SUBJECT_MAX = 120
const BODY_MAX = 2000

export async function createTicket(
  input: CreateTicketInput
): Promise<CreateTicketResponse> {
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'Please sign in to send a message.' }
  if (me.role !== 'customer') {
    return { ok: false, error: 'Only customer accounts can open a ticket.' }
  }

  const topic = input?.topic
  const subject = (input?.subject ?? '').trim()
  const body = (input?.body ?? '').trim()

  if (!topic || !VALID_TOPICS.has(topic)) {
    return { ok: false, error: 'Pick a topic for your message.' }
  }
  if (!subject) return { ok: false, error: 'Add a short subject line.' }
  if (subject.length > SUBJECT_MAX) {
    return { ok: false, error: `Subject must be ${SUBJECT_MAX} characters or fewer.` }
  }
  if (!body) return { ok: false, error: 'Write a message body.' }
  if (body.length > BODY_MAX) {
    return { ok: false, error: `Message body must be ${BODY_MAX} characters or fewer.` }
  }

  const supabase = await createClient()

  // 1. Insert the ticket — RLS enforces customer_id = auth.uid().
  const { data: ticket, error: ticketErr } = await supabase
    .from('support_tickets')
    .insert({
      customer_id: me.authId,
      topic,
      subject,
      status: 'open',
      unread_by_clinic: true,
      unread_by_customer: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select('id')
    .single()

  if (ticketErr || !ticket) {
    console.error('[createTicket] insert failed:', ticketErr?.message)
    return { ok: false, error: "Couldn't open the ticket. Try again in a moment." }
  }

  const ticketId = (ticket as { id: string }).id

  // 2. Insert the initial customer message.
  const { error: msgErr } = await supabase
    .from('support_messages')
    .insert({
      ticket_id: ticketId,
      sender_kind: 'customer',
      body,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

  if (msgErr) {
    console.error('[createTicket] message insert failed:', msgErr.message)
    // Best-effort rollback so the customer doesn't see an empty ticket.
    await supabase.from('support_tickets').delete().eq('id', ticketId)
    return { ok: false, error: "Couldn't save your message. Try again." }
  }

  revalidatePath('/account/messages')
  revalidatePath('/account/dashboard')
  return { ok: true, ticketId }
}
