import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, 'public', any>

export type ExternalChannel =
  | 'tiktok_shop'
  | 'shopee'
  | 'lazada'
  | 'instagram'
  | 'whatsapp'
  | 'other'

export const EXTERNAL_CHANNEL_LABEL: Record<ExternalChannel, string> = {
  tiktok_shop: 'TikTok Shop',
  shopee: 'Shopee',
  lazada: 'Lazada',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  other: 'Other',
}

export interface ExternalSaleListItem {
  id: string
  agentId: string
  agentName: string | null
  referralCode: string | null
  channel: ExternalChannel
  grossAmountRm: number
  ratePercent: number
  commissionRm: number
  customerName: string | null
  marketplaceOrderRef: string | null
  notes: string | null
  createdAt: string
}

export interface ExternalSalesFilters {
  agentId?: string
  channel?: ExternalChannel
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

export async function listExternalSales(
  supabase: SB,
  filters: ExternalSalesFilters = {},
): Promise<{ items: ExternalSaleListItem[]; total: number }> {
  let q = supabase
    .from('external_sales')
    .select(
      `*, agent:sales_agents!external_sales_agent_id_fkey(
        referral_code,
        user:users!sales_agents_user_id_fkey(full_name)
      )`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (filters.agentId) q = q.eq('agent_id', filters.agentId)
  if (filters.channel) q = q.eq('channel', filters.channel)
  if (filters.dateFrom) q = q.gte('created_at', filters.dateFrom)
  if (filters.dateTo) q = q.lte('created_at', filters.dateTo)

  const offset = filters.offset ?? 0
  const limit = filters.limit ?? 100
  q = q.range(offset, offset + limit - 1)

  const { data, error, count } = await q
  if (error) {
    console.error('[admin/external-sales] list failed:', error.message)
    return { items: [], total: 0 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = ((data ?? []) as any[]).map((r): ExternalSaleListItem => {
    const ag = Array.isArray(r.agent) ? r.agent[0] : r.agent
    const u = ag ? (Array.isArray(ag.user) ? ag.user[0] : ag.user) : null
    return {
      id: r.id,
      agentId: r.agent_id,
      agentName: u?.full_name ?? null,
      referralCode: ag?.referral_code ?? null,
      channel: r.channel,
      grossAmountRm: Number(r.gross_amount_rm),
      ratePercent: Number(r.rate_percent),
      commissionRm: Number(r.commission_rm),
      customerName: r.customer_name,
      marketplaceOrderRef: r.marketplace_order_ref,
      notes: r.notes,
      createdAt: r.created_at,
    }
  })

  return { items, total: count ?? 0 }
}

export async function summarizeExternalSales(
  supabase: SB,
): Promise<{ totalGross: number; totalCommission: number; count: number }> {
  const { data } = await supabase
    .from('external_sales')
    .select('gross_amount_rm, commission_rm')
  if (!data) return { totalGross: 0, totalCommission: 0, count: 0 }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = data as any[]
  return {
    totalGross: rows.reduce((s, r) => s + Number(r.gross_amount_rm), 0),
    totalCommission: rows.reduce((s, r) => s + Number(r.commission_rm), 0),
    count: rows.length,
  }
}

export async function listAgentsForPicker(supabase: SB) {
  const { data } = await supabase
    .from('sales_agents')
    .select(
      `id, referral_code, commission_rate, status,
       user:users!sales_agents_user_id_fkey(full_name, email)`,
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
      email: (u?.email as string) ?? '',
    }
  })
}
