import 'server-only'
import type { ServiceDb } from '@/lib/staff/guard'
import { dayRange, expectedCash, summarizeDay, type DayBill, type DayMoneyEntry, type DaySummary, cleanBreakdown, type CashBreakdown } from './day'

/**
 * One day at the counter: whether it was opened/closed, the bills paid and the
 * money taken. Until 20261124_front_desk_day.sql is applied `ready` is false.
 */

export interface CounterDay {
  day: string
  openedAt: string
  openedByName: string | null
  openingFloatRm: number
  closedAt: string | null
  closedByName: string | null
  countedCashRm: number | null
  expectedCashRm: number | null
  summary: DaySummary | null
  notes: string | null
  /** Cash counted by notes and coins, when the counter chose to (else null). */
  openingBreakdown: CashBreakdown | null
  closingBreakdown: CashBreakdown | null
}

export interface DayReport {
  ready: boolean
  record: CounterDay | null
  /** Live figures (for a closed day, the snapshot saved at closing is in record.summary). */
  live: DaySummary
  expectedCashRm: number
  /** Bills paid after the day was closed (they are not in the closing snapshot). */
  paidAfterClose: number
}

function missing(error: { message: string; code?: string }): boolean {
  return error.code === '42P01' || error.code === 'PGRST205' || /(does not exist|Could not find the table)/.test(error.message)
}

async function names(db: ServiceDb, ids: (string | null)[]): Promise<Map<string, string>> {
  const u = Array.from(new Set(ids.filter((x): x is string => !!x)))
  if (!u.length) return new Map()
  const { data } = await db.from('users').select('id, full_name').in('id', u)
  return new Map((data ?? []).map((r: { id: string; full_name: string | null }) => [r.id, r.full_name || 'Staff']))
}

/** The paid bills and money-in balance entries for a Malaysia calendar day. */
export async function dayActivity(db: ServiceDb, day: string): Promise<{ bills: (DayBill & { paidAt: string })[]; money: DayMoneyEntry[]; error: { message: string; code?: string } | null }> {
  const { from, to } = dayRange(day)
  const [b, m] = await Promise.all([
    db
      .from('counter_sales')
      .select('bill_no, subtotal_rm, total_rm, amount_paid_rm, balance_used_rm, outstanding_rm, payment_method, paid_at, counter_sale_items(kind, description, quantity, line_total_rm)')
      .eq('status', 'paid')
      .gte('paid_at', from)
      .lt('paid_at', to),
    db.from('patient_balance_entries').select('kind, amount, payment_method').not('payment_method', 'is', null).gte('created_at', from).lt('created_at', to),
  ])
  const error = b.error ?? m.error
  if (error) return { bills: [], money: [], error }
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bills: (b.data ?? []).map((r: any) => ({
      billNo: Number(r.bill_no),
      subtotalRm: Number(r.subtotal_rm),
      totalRm: Number(r.total_rm),
      amountPaidRm: Number(r.amount_paid_rm ?? 0),
      balanceUsedRm: Number(r.balance_used_rm ?? 0),
      outstandingRm: Number(r.outstanding_rm ?? 0),
      paymentMethod: r.payment_method ?? null,
      paidAt: r.paid_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (r.counter_sale_items ?? []).map((i: any) => ({ kind: i.kind, description: i.description, quantity: i.quantity, lineTotalRm: Number(i.line_total_rm) })),
    })),
    money: (m.data ?? []).map((r) => ({ kind: r.kind, amount: Number(r.amount), paymentMethod: r.payment_method as string })),
    error: null,
  }
}

export async function getDayReport(db: ServiceDb, day: string): Promise<DayReport> {
  const empty = summarizeDay([], [])
  const [{ data: row, error: rowErr }, act] = await Promise.all([
    db.from('counter_days').select('*').eq('day', day).maybeSingle(),
    dayActivity(db, day),
  ])
  const err = rowErr ?? act.error
  if (err) {
    if (!missing(err)) console.error('[counter day] report:', err.message)
    return { ready: !missing(err), record: null, live: empty, expectedCashRm: 0, paidAfterClose: 0 }
  }
  const live = summarizeDay(act.bills, act.money)
  let record: CounterDay | null = null
  if (row) {
    const n = await names(db, [row.opened_by, row.closed_by])
    record = {
      day: row.day,
      openedAt: row.opened_at,
      openedByName: row.opened_by ? n.get(row.opened_by) ?? null : null,
      openingFloatRm: Number(row.opening_float_rm),
      closedAt: row.closed_at ?? null,
      closedByName: row.closed_by ? n.get(row.closed_by) ?? null : null,
      countedCashRm: row.counted_cash_rm != null ? Number(row.counted_cash_rm) : null,
      expectedCashRm: row.expected_cash_rm != null ? Number(row.expected_cash_rm) : null,
      summary: (row.summary as DaySummary | null) ?? null,
      notes: row.notes ?? null,
      openingBreakdown: cleanBreakdown(row.opening_breakdown),
      closingBreakdown: cleanBreakdown(row.closing_breakdown),
    }
  }
  const paidAfterClose = record?.closedAt ? act.bills.filter((b) => b.paidAt > record!.closedAt!).length : 0
  return { ready: true, record, live, expectedCashRm: expectedCash(record?.openingFloatRm ?? 0, live), paidAfterClose }
}

export interface DayListEntry {
  day: string
  openingFloatRm: number
  closed: boolean
  countedCashRm: number | null
  expectedCashRm: number | null
}

export async function recentDays(db: ServiceDb, limit = 14): Promise<DayListEntry[]> {
  const { data, error } = await db.from('counter_days').select('day, opening_float_rm, closed_at, counted_cash_rm, expected_cash_rm').order('day', { ascending: false }).limit(limit)
  if (error) return []
  return (data ?? []).map((r) => ({
    day: r.day,
    openingFloatRm: Number(r.opening_float_rm),
    closed: !!r.closed_at,
    countedCashRm: r.counted_cash_rm != null ? Number(r.counted_cash_rm) : null,
    expectedCashRm: r.expected_cash_rm != null ? Number(r.expected_cash_rm) : null,
  }))
}
