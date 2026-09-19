import type { SupabaseClient } from '@supabase/supabase-js'

export interface ActivityEvent {
  id: string
  kind: 'order' | 'appointment' | 'ticket' | 'reply' | 'promo_claim'
  title: string
  subtitle: string
  href: string
  at: string
}

export async function getRecentActivity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  limit = 10
): Promise<ActivityEvent[]> {
  const [orders, appts, tickets, replies, promos] = await Promise.all([
    supabase
      .from('orders')
      .select('id, created_at, total_amount_rm, customer:users(full_name)')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('appointments')
      .select('id, appointment_date_time, treatment_name, customer:users(full_name), calcom_booking_uid')
      .order('appointment_date_time', { ascending: false })
      .limit(limit),
    supabase
      .from('support_tickets')
      .select('id, subject, created_at, customer:users(full_name)')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('support_messages')
      .select('id, ticket_id, created_at, sender_kind, body')
      .eq('sender_kind', 'customer')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('customer_promos')
      .select('id, promo:promos(code, title), customer:users(full_name), granted_at')
      .eq('source', 'manual-claim')
      .order('granted_at', { ascending: false })
      .limit(limit),
  ])

  const events: ActivityEvent[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;((orders.data ?? []) as any[]).forEach((r) =>
    events.push({
      id: `o:${r.id}`,
      kind: 'order',
      title: `New order from ${r.customer?.full_name ?? 'guest'}`,
      subtitle: `RM ${Number(r.total_amount_rm).toFixed(2)}`,
      href: `/admin/orders/${r.id}`,
      at: r.created_at,
    })
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;((appts.data ?? []) as any[]).forEach((r) =>
    events.push({
      id: `a:${r.id}`,
      kind: 'appointment',
      title: 'Appointment booked',
      subtitle: `${r.treatment_name} · ${r.customer?.full_name ?? 'walk-in'}`,
      href: `/admin/appointments/${r.id}`,
      at: r.appointment_date_time,
    })
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;((tickets.data ?? []) as any[]).forEach((r) =>
    events.push({
      id: `t:${r.id}`,
      kind: 'ticket',
      title: 'New customer message',
      subtitle: `${r.subject} · ${r.customer?.full_name ?? 'unknown'}`,
      href: `/admin/messages/${r.id}`,
      at: r.created_at,
    })
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;((replies.data ?? []) as any[]).forEach((r) =>
    events.push({
      id: `r:${r.id}`,
      kind: 'reply',
      title: 'Customer replied',
      subtitle: (r.body as string).slice(0, 60),
      href: `/admin/messages/${r.ticket_id}`,
      at: r.created_at,
    })
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;((promos.data ?? []) as any[]).forEach((r) =>
    events.push({
      id: `p:${r.id}`,
      kind: 'promo_claim',
      title: 'Promo claimed',
      subtitle: `${r.promo?.code ?? '???'} · ${r.customer?.full_name ?? 'unknown'}`,
      href: '/admin/dashboard',
      at: r.granted_at,
    })
  )

  return events
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit)
}
