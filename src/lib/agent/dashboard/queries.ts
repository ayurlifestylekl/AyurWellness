import type { SupabaseClient } from '@supabase/supabase-js'

export interface AgentProfile {
  id: string
  userId: string
  referralCode: string
  commissionRate: number
  totalSalesGeneratedRm: number
  totalCommissionEarnedRm: number
  status: 'active' | 'suspended' | null
  fullName: string | null
}

export interface DashboardKpis {
  thisMonthCommissionRm: number
  thisMonthOrdersCount: number
  pendingPayoutRm: number
  lifetimeSalesRm: number
  lifetimeCommissionRm: number
}

export interface RecentReferredOrder {
  id: string
  createdAt: string
  customerName: string
  totalAmountRm: number
  commissionRm: number
  paymentStatus: string
  fulfillmentStatus: string | null
}

export interface RecentSubmission {
  id: string
  createdAt: string
  channel: string
  totalAmountRm: number
  status: 'pending' | 'approved' | 'rejected'
}

export interface MonthlyTrendPoint {
  monthKey: string // 'YYYY-MM'
  label: string    // 'May'
  commissionRm: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any>

export async function getAgentProfileByUserId(
  supabase: SB,
  userId: string,
): Promise<AgentProfile | null> {
  const { data, error } = await supabase
    .from('sales_agents')
    .select('id, user_id, referral_code, commission_rate, total_sales_generated_rm, total_commission_earned_rm, status, user:users!sales_agents_user_id_fkey(full_name)')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = data
  const user = Array.isArray(row.user) ? row.user[0] : row.user
  return {
    id: row.id,
    userId: row.user_id,
    referralCode: row.referral_code,
    commissionRate: Number(row.commission_rate ?? 0),
    totalSalesGeneratedRm: Number(row.total_sales_generated_rm ?? 0),
    totalCommissionEarnedRm: Number(row.total_commission_earned_rm ?? 0),
    status: row.status ?? null,
    fullName: user?.full_name ?? null,
  }
}

export async function getDashboardKpis(
  supabase: SB,
  agentId: string,
  profile: AgentProfile,
): Promise<DashboardKpis> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()

  // This month — commissions in range, regardless of status (accrued view)
  const { data: monthCommData } = await supabase
    .from('agent_commissions')
    .select('amount_rm, status, order_id')
    .eq('agent_id', agentId)
    .gte('created_at', monthStart)
    .lte('created_at', monthEnd)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monthComms: any[] = monthCommData ?? []
  const thisMonthCommissionRm = monthComms
    .filter((c) => c.status !== 'reversed')
    .reduce((s, c) => s + Number(c.amount_rm ?? 0), 0)
  const thisMonthOrdersCount = new Set(
    monthComms.filter((c) => c.status !== 'reversed').map((c) => c.order_id),
  ).size

  // Pending payout (all-time pending)
  const { data: pendingData } = await supabase
    .from('agent_commissions')
    .select('amount_rm')
    .eq('agent_id', agentId)
    .eq('status', 'pending')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingPayoutRm = ((pendingData ?? []) as any[]).reduce(
    (s, r) => s + Number(r.amount_rm ?? 0),
    0,
  )

  return {
    thisMonthCommissionRm,
    thisMonthOrdersCount,
    pendingPayoutRm,
    lifetimeSalesRm: profile.totalSalesGeneratedRm,
    lifetimeCommissionRm: profile.totalCommissionEarnedRm,
  }
}

export async function getRecentReferredOrders(
  supabase: SB,
  agentId: string,
  limit = 5,
): Promise<RecentReferredOrder[]> {
  const { data } = await supabase
    .from('orders')
    .select('id, created_at, total_amount_rm, payment_status, fulfillment_status, customer:users!orders_customer_id_fkey(full_name), commission:agent_commissions!agent_commissions_order_id_fkey(amount_rm)')
    .eq('referral_agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((o) => {
    const cust = Array.isArray(o.customer) ? o.customer[0] : o.customer
    const comm = Array.isArray(o.commission) ? o.commission[0] : o.commission
    return {
      id: o.id,
      createdAt: o.created_at,
      customerName: maskName(cust?.full_name ?? 'Customer'),
      totalAmountRm: Number(o.total_amount_rm ?? 0),
      commissionRm: Number(comm?.amount_rm ?? 0),
      paymentStatus: o.payment_status,
      fulfillmentStatus: o.fulfillment_status ?? null,
    }
  })
}

export async function getRecentSubmissions(
  supabase: SB,
  agentId: string,
  limit = 5,
): Promise<RecentSubmission[]> {
  const { data } = await supabase
    .from('marketplace_orders')
    .select('id, created_at, channel, total_amount_rm, status')
    .eq('referral_agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((m) => ({
    id: m.id,
    createdAt: m.created_at,
    channel: m.channel,
    totalAmountRm: Number(m.total_amount_rm ?? 0),
    status: m.status,
  }))
}

export async function getMonthlyTrend(
  supabase: SB,
  agentId: string,
  monthsBack = 6,
): Promise<MonthlyTrendPoint[]> {
  const now = new Date()
  const startMonth = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1)
  const startIso = startMonth.toISOString()

  const { data } = await supabase
    .from('agent_commissions')
    .select('amount_rm, status, created_at')
    .eq('agent_id', agentId)
    .gte('created_at', startIso)
    .neq('status', 'reversed')

  const bucket = new Map<string, number>()
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    bucket.set(key, 0)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const c of (data ?? []) as any[]) {
    const d = new Date(c.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (bucket.has(key)) {
      bucket.set(key, (bucket.get(key) ?? 0) + Number(c.amount_rm ?? 0))
    }
  }
  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return Array.from(bucket.entries()).map(([monthKey, commissionRm]) => {
    const [, m] = monthKey.split('-').map(Number)
    return { monthKey, label: MONTH_LABELS[m - 1] ?? '', commissionRm }
  })
}

function maskName(full: string): string {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 0) return 'Customer'
  if (parts.length === 1) {
    const w = parts[0]
    return w.length <= 2 ? w : `${w[0]}${'*'.repeat(w.length - 2)}${w[w.length - 1]}`
  }
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}
