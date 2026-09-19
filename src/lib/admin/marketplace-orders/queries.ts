import type { SupabaseClient } from '@supabase/supabase-js'
import { EXTERNAL_CHANNEL_LABEL, type ExternalChannel } from '@/lib/admin/external-sales/queries'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, 'public', any>

export type MarketplaceOrderStatus = 'pending_payment' | 'pending' | 'approved' | 'rejected'

export interface MarketplaceItem {
  product_id: string
  product_name: string
  sku: string | null
  quantity: number
  unit_price_rm: number
}

export interface MarketplaceOrderListItem {
  id: string
  channel: ExternalChannel
  marketplaceOrderRef: string | null
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  totalAmountRm: number
  itemCount: number
  referralAgentId: string | null
  referralAgentCode: string | null
  status: MarketplaceOrderStatus
  notes: string | null
  createdAt: string
  approvedAt: string | null
  createdOrderId: string | null
}

export interface MarketplaceOrdersFilters {
  status?: MarketplaceOrderStatus | 'all'
  channel?: ExternalChannel
  /**
   * 'admin' = only entries admin staff keyed in directly
   * 'agent' = only entries submitted by affiliates awaiting / past approval
   * Distinguished by whether entered_by_admin_id is set.
   */
  source?: 'admin' | 'agent'
  search?: string
  limit?: number
  offset?: number
}

export { EXTERNAL_CHANNEL_LABEL }

export async function listMarketplaceOrders(
  supabase: SB,
  filters: MarketplaceOrdersFilters = {},
): Promise<{ items: MarketplaceOrderListItem[]; total: number }> {
  let q = supabase
    .from('marketplace_orders')
    .select(
      `*, agent:sales_agents!marketplace_orders_referral_agent_id_fkey(referral_code)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status)
  if (filters.channel) q = q.eq('channel', filters.channel)
  if (filters.source === 'admin') q = q.not('entered_by_admin_id', 'is', null)
  if (filters.source === 'agent') q = q.is('entered_by_admin_id', null)

  const offset = filters.offset ?? 0
  const limit = filters.limit ?? 100
  q = q.range(offset, offset + limit - 1)

  const { data, error, count } = await q
  if (error) {
    console.error('[admin/marketplace-orders] list failed:', error.message)
    return { items: [], total: 0 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items = ((data ?? []) as any[]).map((r): MarketplaceOrderListItem => {
    const ag = Array.isArray(r.agent) ? r.agent[0] : r.agent
    return {
      id: r.id,
      channel: r.channel,
      marketplaceOrderRef: r.marketplace_order_ref,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      customerEmail: r.customer_email,
      totalAmountRm: Number(r.total_amount_rm),
      itemCount: Array.isArray(r.items) ? r.items.length : 0,
      referralAgentId: r.referral_agent_id,
      referralAgentCode: ag?.referral_code ?? null,
      status: r.status,
      notes: r.notes,
      createdAt: r.created_at,
      approvedAt: r.approved_at,
      createdOrderId: r.created_order_id,
    }
  })

  if (filters.search) {
    const s = filters.search.toLowerCase()
    items = items.filter(
      (m) =>
        m.customerName.toLowerCase().includes(s) ||
        (m.customerPhone ?? '').toLowerCase().includes(s) ||
        (m.marketplaceOrderRef ?? '').toLowerCase().includes(s),
    )
  }

  return { items, total: filters.search ? items.length : count ?? 0 }
}

export async function getMarketplaceOrderById(supabase: SB, id: string) {
  const { data, error } = await supabase
    .from('marketplace_orders')
    .select(
      `*, agent:sales_agents!marketplace_orders_referral_agent_id_fkey(
        id, referral_code,
        user:users!sales_agents_user_id_fkey(full_name)
      )`,
    )
    .eq('id', id)
    .single()
  if (error) {
    console.error('[admin/marketplace-orders] get failed:', error.message)
    return null
  }
  return data
}

export async function listProductsForPicker(supabase: SB) {
  const { data } = await supabase
    .from('products')
    .select('id, name, sku, price_rm, stock_qty')
    .eq('status', 'active')
    .order('name')
    .limit(200)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    sku: (p.sku as string) ?? null,
    priceRm: Number(p.price_rm),
    stockQty: Number(p.stock_qty),
  }))
}

export async function listAgentsForPicker(supabase: SB) {
  const { data } = await supabase
    .from('sales_agents')
    .select(
      `id, referral_code, commission_rate,
       user:users!sales_agents_user_id_fkey(full_name)`,
    )
    .eq('status', 'active')
    .order('referral_code')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => {
    const u = Array.isArray(r.user) ? r.user[0] : r.user
    return {
      id: r.id as string,
      referralCode: r.referral_code as string,
      commissionRate: Number(r.commission_rate),
      fullName: (u?.full_name as string) ?? '',
    }
  })
}
