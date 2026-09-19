import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, 'public', any>

type AgentRow = Database['public']['Tables']['sales_agents']['Row']
export type AgentStatus = AgentRow['status']
export type CommissionType = AgentRow['commission_type']

export interface AgentListItem {
  id: string
  userId: string
  fullName: string | null
  email: string | null
  phone: string | null
  referralCode: string
  commissionRate: number
  commissionType: CommissionType
  canAffiliate: boolean
  canWholesale: boolean
  status: AgentStatus
  totalSalesRm: number
  totalCommissionRm: number
  attributedOrderCount: number
  createdAt: string
}

export interface AgentFilters {
  status?: AgentStatus | 'all'
  commissionType?: CommissionType
  search?: string
  limit?: number
  offset?: number
}

export async function listAgents(
  supabase: SB,
  filters: AgentFilters = {},
): Promise<{ items: AgentListItem[]; total: number }> {
  let q = supabase
    .from('sales_agents')
    .select(
      `id, user_id, referral_code, commission_rate, commission_type,
       can_affiliate, can_wholesale, status,
       total_sales_generated_rm, total_commission_earned_rm, created_at,
       user:users!sales_agents_user_id_fkey(full_name, email, phone_number)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status)
  if (filters.commissionType) q = q.eq('commission_type', filters.commissionType)

  const offset = filters.offset ?? 0
  const limit = filters.limit ?? 100
  q = q.range(offset, offset + limit - 1)

  const { data, error, count } = await q
  if (error) {
    console.error('[admin/agents] listAgents failed:', error.message)
    return { items: [], total: 0 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agents = (data ?? []) as any[]

  // Fetch attributed order counts in one batch
  const agentIds = agents.map((a) => a.id)
  const attributedCounts = new Map<string, number>()
  if (agentIds.length > 0) {
    const { data: ords } = await supabase
      .from('orders')
      .select('referral_agent_id')
      .in('referral_agent_id', agentIds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const o of (ords ?? []) as any[]) {
      const k = o.referral_agent_id as string
      attributedCounts.set(k, (attributedCounts.get(k) ?? 0) + 1)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items = agents.map((a: any): AgentListItem => {
    const u = Array.isArray(a.user) ? a.user[0] : a.user
    return {
      id: a.id,
      userId: a.user_id,
      fullName: u?.full_name ?? null,
      email: u?.email ?? null,
      phone: u?.phone_number ?? null,
      referralCode: a.referral_code,
      commissionRate: Number(a.commission_rate),
      commissionType: a.commission_type,
      canAffiliate: Boolean(a.can_affiliate),
      canWholesale: Boolean(a.can_wholesale),
      status: a.status,
      totalSalesRm: Number(a.total_sales_generated_rm ?? 0),
      totalCommissionRm: Number(a.total_commission_earned_rm ?? 0),
      attributedOrderCount: attributedCounts.get(a.id) ?? 0,
      createdAt: a.created_at,
    }
  })

  if (filters.search) {
    const s = filters.search.toLowerCase()
    items = items.filter(
      (a) =>
        a.referralCode.toLowerCase().includes(s) ||
        (a.fullName ?? '').toLowerCase().includes(s) ||
        (a.email ?? '').toLowerCase().includes(s),
    )
  }

  return { items, total: filters.search ? items.length : count ?? 0 }
}

export async function getAgentById(supabase: SB, id: string) {
  const { data, error } = await supabase
    .from('sales_agents')
    .select(
      `*,
       user:users!sales_agents_user_id_fkey(id, full_name, email, phone_number, created_at)`,
    )
    .eq('id', id)
    .single()
  if (error) {
    console.error('[admin/agents] getAgentById failed:', error.message)
    return null
  }
  return data
}

export async function listAttributedOrders(
  supabase: SB,
  agentId: string,
  limit = 50,
) {
  const { data } = await supabase
    .from('orders')
    .select(
      `id, total_amount_rm, payment_status, fulfillment_status, created_at,
       customer:users!orders_customer_id_fkey(full_name)`,
    )
    .eq('referral_agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function listOpenInvites(supabase: SB) {
  const { data } = await supabase
    .from('agent_invites')
    .select('*')
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  return data ?? []
}
