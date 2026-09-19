import type { SupabaseClient } from '@supabase/supabase-js'

export type AgentOrderChannel =
  | 'web'
  | 'shopee'
  | 'tiktok_shop'
  | 'lazada'
  | 'instagram'
  | 'whatsapp'
  | 'other'
  | 'staff'

export const CHANNEL_LABEL: Record<string, string> = {
  web: 'Web',
  shopee: 'Shopee',
  tiktok_shop: 'TikTok Shop',
  lazada: 'Lazada',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  other: 'Other',
  staff: 'Staff',
}

export type CommissionStatus = 'pending' | 'paid' | 'reversed'

export interface ReferredOrderItem {
  orderId: string
  createdAt: string
  customerName: string
  channel: string
  itemsCount: number
  firstItemName: string | null
  totalAmountRm: number
  paymentStatus: string
  fulfillmentStatus: string | null
  commissionRm: number
  commissionStatus: CommissionStatus | null
}

export interface ReferredOrdersFilters {
  status?: CommissionStatus | 'all'
  channel?: string
  from?: Date
  to?: Date
  limit?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any>

function maskName(full: string | null | undefined): string {
  if (!full) return 'Customer'
  const parts = full.trim().split(/\s+/)
  if (parts.length === 0) return 'Customer'
  if (parts.length === 1) {
    const w = parts[0]
    return w.length <= 2 ? w : `${w[0]}${'*'.repeat(w.length - 2)}${w[w.length - 1]}`
  }
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export async function listReferredOrders(
  supabase: SB,
  agentId: string,
  filters: ReferredOrdersFilters = {},
): Promise<ReferredOrderItem[]> {
  let q = supabase
    .from('orders')
    .select(
      `id, created_at, total_amount_rm, payment_status, fulfillment_status, channel,
       customer:users!orders_customer_id_fkey(full_name),
       items:order_items(product:products!order_items_product_id_fkey(name)),
       commission:agent_commissions!agent_commissions_order_id_fkey(amount_rm, status)`,
    )
    .eq('referral_agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? 200)

  if (filters.channel) q = q.eq('channel', filters.channel)
  if (filters.from) q = q.gte('created_at', filters.from.toISOString())
  if (filters.to) q = q.lte('created_at', filters.to.toISOString())

  const { data, error } = await q
  if (error || !data) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mapped = (data as any[]).map((o): ReferredOrderItem => {
    const cust = Array.isArray(o.customer) ? o.customer[0] : o.customer
    const comm = Array.isArray(o.commission) ? o.commission[0] : o.commission
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (o.items ?? []) as any[]
    const first = items[0]
    const firstProduct = first
      ? Array.isArray(first.product)
        ? first.product[0]
        : first.product
      : null
    return {
      orderId: o.id,
      createdAt: o.created_at,
      customerName: maskName(cust?.full_name),
      channel: o.channel ?? 'web',
      itemsCount: items.length,
      firstItemName: firstProduct?.name ?? null,
      totalAmountRm: Number(o.total_amount_rm ?? 0),
      paymentStatus: o.payment_status,
      fulfillmentStatus: o.fulfillment_status ?? null,
      commissionRm: Number(comm?.amount_rm ?? 0),
      commissionStatus: (comm?.status as CommissionStatus | undefined) ?? null,
    }
  })

  if (filters.status && filters.status !== 'all') {
    mapped = mapped.filter((r) => r.commissionStatus === filters.status)
  }

  return mapped
}
