import type { SupabaseClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, 'public', any>

export interface PendingPayoutSummary {
  agentId: string
  agentName: string | null
  agentEmail: string | null
  referralCode: string
  commissionType: 'affiliate' | 'reseller'
  pendingCount: number
  pendingTotalRm: number
  oldestPendingAt: string | null
}

/**
 * Groups pending commissions by agent — the basis of the payouts queue.
 * Excludes suspended agents from the default view but keeps them visible
 * for historical-tally purposes via the `includeSuspended` flag.
 */
export async function listPendingPayouts(
  supabase: SB,
  options: { includeSuspended?: boolean; minTotalRm?: number } = {},
): Promise<PendingPayoutSummary[]> {
  const q = supabase
    .from('agent_commissions')
    .select(
      `agent_id, commission_rm, created_at,
       agent:sales_agents!agent_commissions_agent_id_fkey(
         id, referral_code, commission_type, status,
         user:users!sales_agents_user_id_fkey(full_name, email)
       )`,
    )
    .eq('status', 'pending')
  const { data, error } = await q
  if (error) {
    console.error('[admin/payouts] listPendingPayouts failed:', error.message)
    return []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[]

  const byAgent = new Map<string, PendingPayoutSummary>()
  for (const r of rows) {
    const ag = Array.isArray(r.agent) ? r.agent[0] : r.agent
    if (!ag) continue
    if (!options.includeSuspended && ag.status === 'suspended') continue
    const u = Array.isArray(ag.user) ? ag.user[0] : ag.user
    const cur = byAgent.get(ag.id) ?? {
      agentId: ag.id,
      agentName: u?.full_name ?? null,
      agentEmail: u?.email ?? null,
      referralCode: ag.referral_code,
      commissionType: ag.commission_type,
      pendingCount: 0,
      pendingTotalRm: 0,
      oldestPendingAt: null as string | null,
    }
    cur.pendingCount += 1
    cur.pendingTotalRm += Number(r.commission_rm)
    if (!cur.oldestPendingAt || new Date(r.created_at) < new Date(cur.oldestPendingAt)) {
      cur.oldestPendingAt = r.created_at
    }
    byAgent.set(ag.id, cur)
  }

  let items = Array.from(byAgent.values()).sort(
    (a, b) => b.pendingTotalRm - a.pendingTotalRm,
  )
  if (options.minTotalRm) {
    items = items.filter((i) => i.pendingTotalRm >= options.minTotalRm!)
  }
  return items
}

/** Detailed commission rows for one agent (used on agent detail page) */
export async function listAgentCommissions(
  supabase: SB,
  agentId: string,
  status?: 'pending' | 'paid' | 'reversed',
  limit = 200,
) {
  let q = supabase
    .from('agent_commissions')
    .select(
      `*,
       order:orders!agent_commissions_order_id_fkey(id, total_amount_rm, payment_status, fulfillment_status, created_at)`,
    )
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (status) q = q.eq('status', status)
  const { data } = await q
  return data ?? []
}

/** Payouts history for one agent */
export async function listAgentPayouts(
  supabase: SB,
  agentId: string,
  limit = 50,
) {
  const { data } = await supabase
    .from('agent_payouts')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

/** Leaderboard — top agents by commission earned (this month + lifetime) */
export interface LeaderboardEntry {
  agentId: string
  agentName: string | null
  referralCode: string
  monthCommissionRm: number
  lifetimeCommissionRm: number
  monthOrderCount: number
}

export async function getCommissionLeaderboard(
  supabase: SB,
  limit = 5,
): Promise<LeaderboardEntry[]> {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('agent_commissions')
    .select(
      `agent_id, commission_rm, status, created_at,
       agent:sales_agents!agent_commissions_agent_id_fkey(
         referral_code,
         user:users!sales_agents_user_id_fkey(full_name)
       )`,
    )
    .neq('status', 'reversed')
  if (error) {
    console.error('[admin/payouts] leaderboard failed:', error.message)
    return []
  }

  const map = new Map<string, LeaderboardEntry>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (data ?? []) as any[]) {
    const ag = Array.isArray(r.agent) ? r.agent[0] : r.agent
    const u = ag ? (Array.isArray(ag.user) ? ag.user[0] : ag.user) : null
    if (!ag) continue
    const cur = map.get(r.agent_id) ?? {
      agentId: r.agent_id,
      agentName: u?.full_name ?? null,
      referralCode: ag.referral_code,
      monthCommissionRm: 0,
      lifetimeCommissionRm: 0,
      monthOrderCount: 0,
    }
    cur.lifetimeCommissionRm += Number(r.commission_rm)
    if (new Date(r.created_at) >= monthStart) {
      cur.monthCommissionRm += Number(r.commission_rm)
      cur.monthOrderCount += 1
    }
    map.set(r.agent_id, cur)
  }
  return Array.from(map.values())
    .sort((a, b) => b.monthCommissionRm - a.monthCommissionRm)
    .slice(0, limit)
}
