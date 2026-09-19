import type { SupabaseClient } from '@supabase/supabase-js'

export type AuditEntityType =
  | 'order'
  | 'stock'
  | 'commission'
  | 'payout'
  | 'review'

export interface AuditEntry {
  id: string
  entity: AuditEntityType
  title: string
  detail: string
  actorName: string | null
  createdAt: string
  /** Optional admin link to view the related entity */
  href: string | null
}

export interface AuditFilters {
  entity?: AuditEntityType | 'all'
  limit?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any>

export async function listAuditEntries(
  supabase: SB,
  filters: AuditFilters = {},
): Promise<AuditEntry[]> {
  const limit = filters.limit ?? 100
  const buckets: Promise<AuditEntry[]>[] = []
  const wants = (k: AuditEntityType) => !filters.entity || filters.entity === 'all' || filters.entity === k

  if (wants('order')) buckets.push(fetchOrderEvents(supabase, limit))
  if (wants('stock')) buckets.push(fetchStockMovements(supabase, limit))
  if (wants('commission')) buckets.push(fetchCommissions(supabase, limit))
  if (wants('payout')) buckets.push(fetchPayouts(supabase, limit))
  if (wants('review')) buckets.push(fetchReviewEvents(supabase, limit))

  const results = await Promise.all(buckets)
  const all = results.flat()
  all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return all.slice(0, limit)
}

async function fetchOrderEvents(supabase: SB, limit: number): Promise<AuditEntry[]> {
  const { data } = await supabase
    .from('order_events')
    .select('id, order_id, event_type, from_status, to_status, created_at, actor:users!order_events_actor_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((r) => {
    const actor = Array.isArray(r.actor) ? r.actor[0] : r.actor
    const detail =
      r.from_status && r.to_status
        ? `${r.from_status} → ${r.to_status}`
        : r.event_type
    return {
      id: r.id,
      entity: 'order' as const,
      title: `Order event · ${r.event_type}`,
      detail,
      actorName: actor?.full_name ?? null,
      createdAt: r.created_at,
      href: `/admin/orders/${r.order_id}`,
    }
  })
}

async function fetchStockMovements(supabase: SB, limit: number): Promise<AuditEntry[]> {
  const { data } = await supabase
    .from('stock_movements')
    .select('id, product_id, movement_type, quantity_delta, reason, created_at, actor:users!stock_movements_actor_id_fkey(full_name), product:products!stock_movements_product_id_fkey(name)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((r) => {
    const actor = Array.isArray(r.actor) ? r.actor[0] : r.actor
    const product = Array.isArray(r.product) ? r.product[0] : r.product
    const sign = r.quantity_delta > 0 ? '+' : ''
    return {
      id: r.id,
      entity: 'stock' as const,
      title: `Stock · ${r.movement_type}`,
      detail: `${sign}${r.quantity_delta} on ${product?.name ?? 'product'}${r.reason ? ' — ' + r.reason : ''}`,
      actorName: actor?.full_name ?? null,
      createdAt: r.created_at,
      href: r.product_id ? `/admin/inventory` : null,
    }
  })
}

async function fetchCommissions(supabase: SB, limit: number): Promise<AuditEntry[]> {
  const { data } = await supabase
    .from('agent_commissions')
    .select('id, agent_id, order_id, amount_rm, status, created_at, updated_at, agent:sales_agents!agent_commissions_agent_id_fkey(referral_code)')
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((r) => {
    const agent = Array.isArray(r.agent) ? r.agent[0] : r.agent
    return {
      id: r.id,
      entity: 'commission' as const,
      title: `Commission · ${r.status}`,
      detail: `RM ${Number(r.amount_rm).toFixed(2)} to ${agent?.referral_code ?? '—'}`,
      actorName: null,
      createdAt: r.updated_at ?? r.created_at,
      href: r.agent_id ? `/admin/partners/${r.agent_id}` : null,
    }
  })
}

async function fetchPayouts(supabase: SB, limit: number): Promise<AuditEntry[]> {
  const { data } = await supabase
    .from('agent_payouts')
    .select('id, agent_id, amount_rm, paid_at, method, created_at, agent:sales_agents!agent_payouts_agent_id_fkey(referral_code)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((r) => {
    const agent = Array.isArray(r.agent) ? r.agent[0] : r.agent
    return {
      id: r.id,
      entity: 'payout' as const,
      title: `Payout · ${agent?.referral_code ?? 'agent'}`,
      detail: `RM ${Number(r.amount_rm).toFixed(2)}${r.method ? ' via ' + r.method : ''}`,
      actorName: null,
      createdAt: r.created_at,
      href: r.agent_id ? `/admin/partners/${r.agent_id}` : null,
    }
  })
}

async function fetchReviewEvents(supabase: SB, limit: number): Promise<AuditEntry[]> {
  const { data } = await supabase
    .from('reviews')
    .select('id, product_id, status, updated_at, rating, product:products!reviews_product_id_fkey(name), customer:users!reviews_customer_id_fkey(full_name)')
    .neq('status', 'pending')
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((r) => {
    const product = Array.isArray(r.product) ? r.product[0] : r.product
    const customer = Array.isArray(r.customer) ? r.customer[0] : r.customer
    return {
      id: r.id,
      entity: 'review' as const,
      title: `Review · ${r.status}`,
      detail: `${r.rating}★ on ${product?.name ?? 'product'} from ${customer?.full_name ?? '—'}`,
      actorName: null,
      createdAt: r.updated_at,
      href: '/admin/reviews',
    }
  })
}
