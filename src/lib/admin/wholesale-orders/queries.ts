import type { SupabaseClient } from '@supabase/supabase-js'

export type WholesaleStatus =
  | 'pending_payment'
  | 'paid'
  | 'fulfilling'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export const WHOLESALE_STATUS_LABEL: Record<WholesaleStatus, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  fulfilling: 'Packing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export interface WholesaleOrderListItem {
  id: string
  orderNumber: string
  status: WholesaleStatus
  totalRm: number
  itemCount: number
  agentReferralCode: string
  agentName: string
  createdAt: string
  paidAt: string | null
  shippedAt: string | null
}

export interface WholesaleOrderDetail {
  id: string
  orderNumber: string
  status: WholesaleStatus
  subtotalRm: number
  shippingRm: number
  totalRm: number
  shippingAddress: string
  shippingPostcode: string
  shippingState: string
  agentNotes: string | null
  adminNotes: string | null
  paymentMethod: string | null
  paymentProofUrl: string | null
  paidAt: string | null
  trackingNumber: string | null
  courier: string | null
  shippedAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
  cancelReason: string | null
  createdAt: string
  agentId: string
  agentName: string
  agentEmail: string | null
  agentPhone: string | null
  agentReferralCode: string
  items: Array<{
    id: string
    productId: string
    productName: string
    productSku: string | null
    quantity: number
    unitPriceRm: number
    lineTotalRm: number
  }>
}

export interface WholesaleFilters {
  status?: WholesaleStatus | 'all'
  search?: string
  limit?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any>

export async function listWholesaleOrders(
  supabase: SB,
  filters: WholesaleFilters = {},
): Promise<{ items: WholesaleOrderListItem[]; total: number }> {
  let q = supabase
    .from('wholesale_orders')
    .select(
      `id, order_number, status, total_rm, created_at, paid_at, shipped_at,
       agent:sales_agents!wholesale_orders_agent_id_fkey(
         referral_code,
         user:users!sales_agents_user_id_fkey(full_name)
       ),
       items:wholesale_order_items(id)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'all') {
    q = q.eq('status', filters.status)
  }
  q = q.limit(filters.limit ?? 200)

  const { data, count, error } = await q
  if (error || !data) return { items: [], total: 0 }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data as any[]).map((r): WholesaleOrderListItem => {
    const agent = Array.isArray(r.agent) ? r.agent[0] : r.agent
    const user = agent
      ? Array.isArray(agent.user)
        ? agent.user[0]
        : agent.user
      : null
    return {
      id: r.id,
      orderNumber: r.order_number,
      status: r.status,
      totalRm: Number(r.total_rm ?? 0),
      itemCount: Array.isArray(r.items) ? r.items.length : 0,
      agentReferralCode: agent?.referral_code ?? '—',
      agentName: user?.full_name ?? '—',
      createdAt: r.created_at,
      paidAt: r.paid_at ?? null,
      shippedAt: r.shipped_at ?? null,
    }
  })

  let filtered = items
  if (filters.search) {
    const s = filters.search.toLowerCase()
    filtered = items.filter(
      (i) =>
        i.orderNumber.toLowerCase().includes(s) ||
        i.agentReferralCode.toLowerCase().includes(s) ||
        i.agentName.toLowerCase().includes(s),
    )
  }

  return { items: filtered, total: count ?? filtered.length }
}

export async function getWholesaleOrderById(
  supabase: SB,
  id: string,
): Promise<WholesaleOrderDetail | null> {
  const { data, error } = await supabase
    .from('wholesale_orders')
    .select(
      `id, order_number, status, subtotal_rm, shipping_rm, total_rm,
       shipping_address, shipping_postcode, shipping_state,
       agent_notes, admin_notes, payment_method, payment_proof_url,
       paid_at, tracking_number, courier, shipped_at, delivered_at,
       cancelled_at, cancel_reason, created_at, agent_id,
       agent:sales_agents!wholesale_orders_agent_id_fkey(
         referral_code,
         user:users!sales_agents_user_id_fkey(full_name, email, phone_number)
       ),
       items:wholesale_order_items(
         id, product_id, product_name, product_sku,
         quantity, unit_price_rm, line_total_rm
       )`,
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r: any = data
  const agent = Array.isArray(r.agent) ? r.agent[0] : r.agent
  const user = agent
    ? Array.isArray(agent.user)
      ? agent.user[0]
      : agent.user
    : null

  return {
    id: r.id,
    orderNumber: r.order_number,
    status: r.status,
    subtotalRm: Number(r.subtotal_rm ?? 0),
    shippingRm: Number(r.shipping_rm ?? 0),
    totalRm: Number(r.total_rm ?? 0),
    shippingAddress: r.shipping_address,
    shippingPostcode: r.shipping_postcode,
    shippingState: r.shipping_state,
    agentNotes: r.agent_notes ?? null,
    adminNotes: r.admin_notes ?? null,
    paymentMethod: r.payment_method ?? null,
    paymentProofUrl: r.payment_proof_url ?? null,
    paidAt: r.paid_at ?? null,
    trackingNumber: r.tracking_number ?? null,
    courier: r.courier ?? null,
    shippedAt: r.shipped_at ?? null,
    deliveredAt: r.delivered_at ?? null,
    cancelledAt: r.cancelled_at ?? null,
    cancelReason: r.cancel_reason ?? null,
    createdAt: r.created_at,
    agentId: r.agent_id,
    agentName: user?.full_name ?? '—',
    agentEmail: user?.email ?? null,
    agentPhone: user?.phone_number ?? null,
    agentReferralCode: agent?.referral_code ?? '—',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: ((r.items ?? []) as any[]).map((it) => ({
      id: it.id,
      productId: it.product_id,
      productName: it.product_name,
      productSku: it.product_sku ?? null,
      quantity: it.quantity,
      unitPriceRm: Number(it.unit_price_rm ?? 0),
      lineTotalRm: Number(it.line_total_rm ?? 0),
    })),
  }
}

export async function countPendingWholesalePayments(supabase: SB): Promise<number> {
  const { count } = await supabase
    .from('wholesale_orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending_payment')
  return count ?? 0
}
