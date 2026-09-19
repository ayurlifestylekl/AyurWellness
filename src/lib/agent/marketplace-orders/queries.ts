import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExternalChannel } from '@/lib/admin/external-sales/queries'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, 'public', any>

export interface AgentMarketplaceOrder {
  id: string
  channel: ExternalChannel
  marketplaceOrderRef: string | null
  customerName: string
  customerPhone: string | null
  itemCount: number
  totalAmountRm: number
  status: 'pending_payment' | 'pending' | 'approved' | 'rejected'
  rejectionReason: string | null
  createdAt: string
  approvedAt: string | null
  createdOrderId: string | null
}

/**
 * Lists marketplace orders an agent has submitted. Relies on the RLS policy
 * "Agent reads own marketplace orders" — the agent only sees their own rows.
 */
export async function listAgentMarketplaceOrders(
  supabase: SB,
): Promise<AgentMarketplaceOrder[]> {
  const { data, error } = await supabase
    .from('marketplace_orders')
    .select(
      `id, channel, marketplace_order_ref, customer_name, customer_phone,
       items, total_amount_rm, status, rejection_reason, created_at,
       approved_at, created_order_id`,
    )
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[agent/marketplace-orders] list failed:', error.message)
    return []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    channel: r.channel,
    marketplaceOrderRef: r.marketplace_order_ref,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    itemCount: Array.isArray(r.items) ? r.items.length : 0,
    totalAmountRm: Number(r.total_amount_rm),
    status: r.status,
    rejectionReason: r.rejection_reason,
    createdAt: r.created_at,
    approvedAt: r.approved_at,
    createdOrderId: r.created_order_id,
  }))
}

/**
 * Resolves the current authenticated user's sales_agents row.
 * Returns null if they're not an agent (or no row found).
 */
export async function getMyAgentProfile(supabase: SB, userId: string) {
  const { data, error } = await supabase
    .from('sales_agents')
    .select('id, referral_code, commission_rate, status')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.error('[agent] getMyAgentProfile failed:', error.message)
    return null
  }
  return data
}

export async function listActiveProductsForAgent(supabase: SB) {
  const { data } = await supabase
    .from('products')
    .select('id, name, sku, price_rm, stock_qty')
    .eq('status', 'active')
    .order('name')
    .limit(500)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    sku: (p.sku as string) ?? null,
    priceRm: Number(p.price_rm),
    stockQty: Number(p.stock_qty),
  }))
}
