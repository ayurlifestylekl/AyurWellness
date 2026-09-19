import type { SupabaseClient } from '@supabase/supabase-js'

export interface FinanceSummary {
  grossRevenueRm: number
  refundsRm: number
  netRevenueRm: number
  ordersCount: number
  avgOrderRm: number
  commissionsAccruedRm: number
  commissionsPaidRm: number
  commissionsOutstandingRm: number
  topProducts: Array<{ productId: string; name: string; revenueRm: number; qty: number }>
  channelBreakdown: Array<{ channel: string; revenueRm: number; ordersCount: number }>
  rangeStart: string
  rangeEnd: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any>

function isoStartOfDay(d: Date): string {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.toISOString()
}

function isoEndOfDay(d: Date): string {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x.toISOString()
}

export function defaultMonthRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start, end }
}

export async function getFinanceSummary(
  supabase: SB,
  start: Date,
  end: Date,
): Promise<FinanceSummary> {
  const startIso = isoStartOfDay(start)
  const endIso = isoEndOfDay(end)

  // Paid orders in range
  const { data: ordersData } = await supabase
    .from('orders')
    .select('id, total_amount_rm, channel, created_at')
    .eq('payment_status', 'paid')
    .gte('created_at', startIso)
    .lte('created_at', endIso)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders: any[] = ordersData ?? []
  const grossRevenueRm = orders.reduce((s, o) => s + Number(o.total_amount_rm ?? 0), 0)
  const ordersCount = orders.length
  const avgOrderRm = ordersCount > 0 ? grossRevenueRm / ordersCount : 0

  // Channel breakdown
  const channelMap = new Map<string, { revenueRm: number; ordersCount: number }>()
  for (const o of orders) {
    const k = o.channel ?? 'web'
    const cur = channelMap.get(k) ?? { revenueRm: 0, ordersCount: 0 }
    cur.revenueRm += Number(o.total_amount_rm ?? 0)
    cur.ordersCount += 1
    channelMap.set(k, cur)
  }
  const channelBreakdown = Array.from(channelMap.entries())
    .map(([channel, v]) => ({ channel, ...v }))
    .sort((a, b) => b.revenueRm - a.revenueRm)

  // Refunds in range
  const { data: refundsData } = await supabase
    .from('refunds')
    .select('amount_rm')
    .gte('created_at', startIso)
    .lte('created_at', endIso)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refundsRm = (refundsData ?? []).reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: number, r: any) => s + Number(r.amount_rm ?? 0),
    0,
  )

  const netRevenueRm = grossRevenueRm - refundsRm

  // Commissions in range
  const { data: commData } = await supabase
    .from('agent_commissions')
    .select('amount_rm, status, created_at')
    .gte('created_at', startIso)
    .lte('created_at', endIso)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comms: any[] = commData ?? []
  const commissionsAccruedRm = comms.reduce(
    (s, c) => (c.status !== 'reversed' ? s + Number(c.amount_rm ?? 0) : s),
    0,
  )
  const commissionsPaidRm = comms.reduce(
    (s, c) => (c.status === 'paid' ? s + Number(c.amount_rm ?? 0) : s),
    0,
  )
  const commissionsOutstandingRm = comms.reduce(
    (s, c) => (c.status === 'pending' ? s + Number(c.amount_rm ?? 0) : s),
    0,
  )

  // Top products from order_items
  const orderIds = orders.map((o) => o.id)
  let topProducts: FinanceSummary['topProducts'] = []
  if (orderIds.length > 0) {
    const { data: itemsData } = await supabase
      .from('order_items')
      .select(
        'product_id, quantity, unit_price_rm, product:products!order_items_product_id_fkey(name)',
      )
      .in('order_id', orderIds)
    const agg = new Map<string, { name: string; revenueRm: number; qty: number }>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const it of (itemsData ?? []) as any[]) {
      if (!it.product_id) continue
      const p = Array.isArray(it.product) ? it.product[0] : it.product
      const name = p?.name ?? 'Product'
      const cur = agg.get(it.product_id) ?? { name, revenueRm: 0, qty: 0 }
      cur.revenueRm += Number(it.unit_price_rm ?? 0) * Number(it.quantity ?? 0)
      cur.qty += Number(it.quantity ?? 0)
      agg.set(it.product_id, cur)
    }
    topProducts = Array.from(agg.entries())
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.revenueRm - a.revenueRm)
      .slice(0, 10)
  }

  return {
    grossRevenueRm,
    refundsRm,
    netRevenueRm,
    ordersCount,
    avgOrderRm,
    commissionsAccruedRm,
    commissionsPaidRm,
    commissionsOutstandingRm,
    topProducts,
    channelBreakdown,
    rangeStart: startIso,
    rangeEnd: endIso,
  }
}
