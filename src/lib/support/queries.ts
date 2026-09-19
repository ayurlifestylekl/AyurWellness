import type { SupabaseClient } from '@supabase/supabase-js'
import type { SupportTicket, SupportMessage } from './format'

export interface TicketWithLatest extends SupportTicket {
  latest: SupportMessage | null
}

/**
 * All tickets for the customer, newest activity first, each with the most
 * recent message as a preview. We fetch all messages for selected tickets
 * but the list typically has <10 rows in practice.
 */
export async function listTickets(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string
): Promise<TicketWithLatest[]> {
  const { data: tickets, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('customer_id', customerId)
    .order('last_message_at', { ascending: false })

  if (error) {
    console.error('[support/listTickets] failed:', error.message)
    return []
  }

  const ticketRows = (tickets ?? []) as SupportTicket[]
  if (ticketRows.length === 0) return []

  // Pull the latest message for every ticket in one round-trip.
  const ids = ticketRows.map((t) => t.id)
  const { data: msgs, error: msgErr } = await supabase
    .from('support_messages')
    .select('*')
    .in('ticket_id', ids)
    .order('created_at', { ascending: false })

  if (msgErr) {
    console.error('[support/listTickets] message fetch failed:', msgErr.message)
    return ticketRows.map((t) => ({ ...t, latest: null }))
  }

  const latestByTicket = new Map<string, SupportMessage>()
  for (const m of (msgs ?? []) as SupportMessage[]) {
    if (!latestByTicket.has(m.ticket_id)) latestByTicket.set(m.ticket_id, m)
  }

  return ticketRows.map((t) => ({ ...t, latest: latestByTicket.get(t.id) ?? null }))
}

/**
 * Single ticket + full message history. Returns null when the ticket
 * doesn't exist or doesn't belong to this customer (RLS makes other
 * customers' rows invisible).
 */
export async function getTicketWithMessages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string,
  ticketId: string
): Promise<{ ticket: SupportTicket; messages: SupportMessage[] } | null> {
  const { data: ticket, error: ticketErr } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .eq('customer_id', customerId)
    .maybeSingle()

  if (ticketErr) {
    console.error('[support/getTicketWithMessages] ticket fetch failed:', ticketErr.message)
    return null
  }
  if (!ticket) return null

  const { data: messages, error: msgErr } = await supabase
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  if (msgErr) {
    console.error('[support/getTicketWithMessages] msg fetch failed:', msgErr.message)
    return { ticket: ticket as SupportTicket, messages: [] }
  }

  return {
    ticket: ticket as SupportTicket,
    messages: (messages ?? []) as SupportMessage[],
  }
}

/**
 * Most recent clinic-authored message across all of a customer's tickets.
 * Used for the dashboard's VaidyaMessagesPreview.
 */
export async function getLatestClinicMessage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string
): Promise<{ message: SupportMessage; ticket: SupportTicket } | null> {
  // Get all my tickets' ids first so the message query can filter by them.
  // We could use a join here but the schema separates them cleanly.
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, subject, topic, status, last_message_at, unread_by_customer, customer_id, unread_by_clinic, created_at')
    .eq('customer_id', customerId)
    .order('last_message_at', { ascending: false })

  if (!tickets || tickets.length === 0) return null
  const ticketIds = (tickets as SupportTicket[]).map((t) => t.id)

  const { data: msgs } = await supabase
    .from('support_messages')
    .select('*')
    .in('ticket_id', ticketIds)
    .eq('sender_kind', 'clinic')
    .order('created_at', { ascending: false })
    .limit(1)

  const message = (msgs ?? [])[0] as SupportMessage | undefined
  if (!message) return null

  const parent = (tickets as SupportTicket[]).find((t) => t.id === message.ticket_id)
  if (!parent) return null

  return { message, ticket: parent }
}
