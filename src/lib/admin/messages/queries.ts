import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, 'public', any>

type TicketRow = Database['public']['Tables']['support_tickets']['Row']
export type TicketStatus = TicketRow['status']
export type TicketTopic = TicketRow['topic']

export interface TicketListItem {
  id: string
  subject: string
  topic: TicketTopic
  status: TicketStatus
  unreadByClinic: boolean
  lastMessageAt: string
  createdAt: string
  customerId: string
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  lastMessagePreview: string | null
  assignedToAdminId: string | null
}

export interface TicketFilters {
  segment?: 'unread' | 'open' | 'awaiting_customer' | 'resolved' | 'closed' | 'all'
  topic?: TicketTopic
  search?: string
  limit?: number
  offset?: number
}

export async function listTickets(
  supabase: SB,
  filters: TicketFilters = {},
): Promise<{ items: TicketListItem[]; total: number }> {
  let q = supabase
    .from('support_tickets')
    .select(
      `id, subject, topic, status, unread_by_clinic, last_message_at, created_at,
       customer_id, assigned_to_admin_id,
       customer:users!support_tickets_customer_id_fkey(full_name, email, phone_number)`,
      { count: 'exact' },
    )
    .order('last_message_at', { ascending: false })

  if (filters.segment === 'unread') q = q.eq('unread_by_clinic', true)
  if (filters.segment === 'open') q = q.eq('status', 'open')
  if (filters.segment === 'awaiting_customer') q = q.eq('status', 'awaiting-customer')
  if (filters.segment === 'resolved') q = q.eq('status', 'resolved')
  if (filters.segment === 'closed') q = q.eq('status', 'closed')
  if (filters.topic) q = q.eq('topic', filters.topic)
  if (filters.search) {
    const s = filters.search.replace(/[%_]/g, '')
    q = q.ilike('subject', `%${s}%`)
  }

  const offset = filters.offset ?? 0
  const limit = filters.limit ?? 100
  q = q.range(offset, offset + limit - 1)

  const { data, error, count } = await q
  if (error) {
    console.error('[admin/messages] listTickets failed:', error.message)
    return { items: [], total: 0 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tickets = (data ?? []) as any[]

  // Fetch latest message body for each ticket (preview), small N + already-filtered set
  const ids = tickets.map((t) => t.id)
  const previews = new Map<string, string>()
  if (ids.length > 0) {
    const { data: msgs } = await supabase
      .from('support_messages')
      .select('ticket_id, body, created_at')
      .in('ticket_id', ids)
      .order('created_at', { ascending: false })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const m of (msgs ?? []) as any[]) {
      if (!previews.has(m.ticket_id)) previews.set(m.ticket_id, m.body)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = tickets.map((t: any): TicketListItem => {
    const cust = Array.isArray(t.customer) ? t.customer[0] : t.customer
    return {
      id: t.id,
      subject: t.subject,
      topic: t.topic,
      status: t.status,
      unreadByClinic: t.unread_by_clinic,
      lastMessageAt: t.last_message_at,
      createdAt: t.created_at,
      customerId: t.customer_id,
      customerName: cust?.full_name ?? null,
      customerEmail: cust?.email ?? null,
      customerPhone: cust?.phone_number ?? null,
      lastMessagePreview: previews.get(t.id) ?? null,
      assignedToAdminId: t.assigned_to_admin_id,
    }
  })

  // Client-side customer name search (Supabase nested-ilike is finicky)
  let final = items
  if (filters.search) {
    const s = filters.search.toLowerCase()
    final = items.filter(
      (i) =>
        i.subject.toLowerCase().includes(s) ||
        (i.customerName ?? '').toLowerCase().includes(s) ||
        (i.customerEmail ?? '').toLowerCase().includes(s),
    )
  }

  return { items: final, total: filters.search ? final.length : count ?? 0 }
}

export async function getTicketById(supabase: SB, id: string) {
  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .select(
      `*,
       customer:users!support_tickets_customer_id_fkey(id, full_name, email, phone_number, allergies, medical_conditions),
       assignee:users!support_tickets_assigned_to_admin_id_fkey(id, full_name)`,
    )
    .eq('id', id)
    .single()
  if (error) {
    console.error('[admin/messages] getTicketById failed:', error.message)
    return null
  }

  const { data: messages } = await supabase
    .from('support_messages')
    .select('*')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  return { ticket, messages: messages ?? [] }
}

export async function countUnreadByClinic(supabase: SB): Promise<number> {
  const { count } = await supabase
    .from('support_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('unread_by_clinic', true)
  return count ?? 0
}
