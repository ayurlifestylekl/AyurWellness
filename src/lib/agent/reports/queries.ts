import type { SupabaseClient } from '@supabase/supabase-js'
import type { CommissionStatus } from '@/lib/agent/orders/queries'

export interface CommissionLedgerEntry {
  id: string
  orderId: string | null
  orderRef: string | null
  amountRm: number
  status: CommissionStatus
  reversedReason: string | null
  createdAt: string
  updatedAt: string
}

export interface PayoutEntry {
  id: string
  amountRm: number
  method: string | null
  reference: string | null
  paidAt: string | null
  createdAt: string
}

export interface EarningsSummary {
  totalAccruedRm: number
  totalPendingRm: number
  totalPaidRm: number
  totalReversedRm: number
  pendingCount: number
}

export interface MonthBreakdownPoint {
  monthKey: string
  label: string
  accruedRm: number
  paidRm: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any>

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export async function listAgentCommissions(
  supabase: SB,
  agentId: string,
  filters: { status?: CommissionStatus | 'all'; limit?: number } = {},
): Promise<CommissionLedgerEntry[]> {
  let q = supabase
    .from('agent_commissions')
    .select(
      `id, order_id, commission_rm, status, reversal_reason, created_at, paid_at, reversed_at,
       order:orders!agent_commissions_order_id_fkey(invoice_number)`,
    )
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? 200)

  if (filters.status && filters.status !== 'all') {
    q = q.eq('status', filters.status)
  }

  const { data, error } = await q
  if (error || !data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((r): CommissionLedgerEntry => {
    const order = Array.isArray(r.order) ? r.order[0] : r.order
    return {
      id: r.id,
      orderId: r.order_id ?? null,
      orderRef: order?.invoice_number ?? null,
      amountRm: Number(r.commission_rm ?? 0),
      status: r.status,
      reversedReason: r.reversal_reason ?? null,
      createdAt: r.created_at,
      updatedAt: r.paid_at ?? r.reversed_at ?? r.created_at,
    }
  })
}

export async function listAgentPayouts(
  supabase: SB,
  agentId: string,
  limit = 50,
): Promise<PayoutEntry[]> {
  const { data } = await supabase
    .from('agent_payouts')
    .select('id, amount_rm, payment_method, bank_reference, created_at')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((r) => ({
    id: r.id,
    amountRm: Number(r.amount_rm ?? 0),
    method: r.payment_method ?? null,
    reference: r.bank_reference ?? null,
    paidAt: r.created_at ?? null,
    createdAt: r.created_at,
  }))
}

export async function getEarningsSummary(
  supabase: SB,
  agentId: string,
): Promise<EarningsSummary> {
  const { data } = await supabase
    .from('agent_commissions')
    .select('commission_rm, status')
    .eq('agent_id', agentId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[]
  let pending = 0,
    paid = 0,
    reversed = 0,
    pendingCount = 0
  for (const r of rows) {
    const amt = Number(r.commission_rm ?? 0)
    if (r.status === 'pending') {
      pending += amt
      pendingCount += 1
    } else if (r.status === 'paid') paid += amt
    else if (r.status === 'reversed') reversed += amt
  }
  return {
    totalAccruedRm: pending + paid,
    totalPendingRm: pending,
    totalPaidRm: paid,
    totalReversedRm: reversed,
    pendingCount,
  }
}

export async function getMonthlyBreakdown(
  supabase: SB,
  agentId: string,
  monthsBack = 6,
): Promise<MonthBreakdownPoint[]> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1)
  const { data } = await supabase
    .from('agent_commissions')
    .select('commission_rm, status, created_at')
    .eq('agent_id', agentId)
    .gte('created_at', start.toISOString())

  const accruedByMonth = new Map<string, number>()
  const paidByMonth = new Map<string, number>()
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    accruedByMonth.set(key, 0)
    paidByMonth.set(key, 0)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (data ?? []) as any[]) {
    if (r.status === 'reversed') continue
    const d = new Date(r.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const amt = Number(r.commission_rm ?? 0)
    if (accruedByMonth.has(key)) {
      accruedByMonth.set(key, (accruedByMonth.get(key) ?? 0) + amt)
      if (r.status === 'paid') {
        paidByMonth.set(key, (paidByMonth.get(key) ?? 0) + amt)
      }
    }
  }
  return Array.from(accruedByMonth.entries()).map(([key, accrued]) => {
    const [, m] = key.split('-').map(Number)
    return {
      monthKey: key,
      label: MONTH_LABELS[m - 1] ?? '',
      accruedRm: accrued,
      paidRm: paidByMonth.get(key) ?? 0,
    }
  })
}
