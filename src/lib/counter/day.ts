import { PAYMENT_METHODS, fromSen, toSen, type BillItemKind } from './rules'

/**
 * The day's figures for opening/closing the counter. Pure, so it is the same
 * on screen, in the saved snapshot and in tests. Money is added in sen.
 */

export interface DayBill {
  billNo: number
  subtotalRm: number
  totalRm: number
  amountPaidRm: number
  balanceUsedRm: number
  outstandingRm: number
  paymentMethod: string | null
  items: { kind: BillItemKind; description: string; quantity: number; lineTotalRm: number }[]
}

/** Balance entries where money changed hands at the counter (deposit / gift card bought, amount owed settled). */
export interface DayMoneyEntry {
  kind: string
  amount: number
  paymentMethod: string
}

export interface DaySummary {
  billCount: number
  /** Bills paid, less deposits paid in (a deposit is money held, not a sale). */
  salesRm: number
  /** Deposits paid in on bills, added to patients' deposit balances. */
  depositsRm?: number
  discountRm: number
  balanceUsedRm: number
  outstandingAddedRm: number
  /** Money taken, by payment method: bills plus balance top-ups and settlements. */
  takenByMethod: { method: string; label: string; billsRm: number; otherRm: number; totalRm: number }[]
  takenRm: number
  cashInRm: number
  servicesCount: number
  packageSessions: number
  productsSold: { name: string; quantity: number; amountRm: number }[]
}

export function summarizeDay(bills: DayBill[], money: DayMoneyEntry[]): DaySummary {
  const byMethodBills = new Map<string, number>()
  const byMethodOther = new Map<string, number>()
  const products = new Map<string, { quantity: number; sen: number }>()
  let sales = 0
  let disc = 0
  let used = 0
  let owed = 0
  let deposits = 0
  let services = 0
  let sessions = 0

  for (const b of bills) {
    sales += toSen(b.totalRm)
    disc += Math.max(0, toSen(b.subtotalRm) - toSen(b.totalRm)) // the discount actually applied
    used += toSen(b.balanceUsedRm)
    owed += toSen(b.outstandingRm)
    if (b.paymentMethod && b.amountPaidRm > 0) byMethodBills.set(b.paymentMethod, (byMethodBills.get(b.paymentMethod) ?? 0) + toSen(b.amountPaidRm))
    for (const i of b.items) {
      if (i.kind === 'deposit') deposits += toSen(i.lineTotalRm)
      if (i.kind === 'service') services += i.quantity
      if (i.kind === 'package') sessions += i.quantity
      if (i.kind === 'product') {
        const p = products.get(i.description) ?? { quantity: 0, sen: 0 }
        p.quantity += i.quantity
        p.sen += toSen(i.lineTotalRm)
        products.set(i.description, p)
      }
    }
  }
  for (const m of money) byMethodOther.set(m.paymentMethod, (byMethodOther.get(m.paymentMethod) ?? 0) + Math.abs(toSen(m.amount)))

  const methods = PAYMENT_METHODS.map((m) => m.value as string)
  for (const k of [...Array.from(byMethodBills.keys()), ...Array.from(byMethodOther.keys())]) if (!methods.includes(k)) methods.push(k)
  const takenByMethod = methods
    .map((method) => {
      const billsSen = byMethodBills.get(method) ?? 0
      const otherSen = byMethodOther.get(method) ?? 0
      return {
        method,
        label: PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method,
        billsRm: fromSen(billsSen),
        otherRm: fromSen(otherSen),
        totalRm: fromSen(billsSen + otherSen),
      }
    })
    .filter((m) => m.totalRm > 0)

  return {
    billCount: bills.length,
    salesRm: fromSen(sales - deposits),
    depositsRm: fromSen(deposits),
    discountRm: fromSen(disc),
    balanceUsedRm: fromSen(used),
    outstandingAddedRm: fromSen(owed),
    takenByMethod,
    takenRm: fromSen(takenByMethod.reduce((s, m) => s + toSen(m.totalRm), 0)),
    cashInRm: takenByMethod.find((m) => m.method === 'cash')?.totalRm ?? 0,
    servicesCount: services,
    packageSessions: sessions,
    productsSold: Array.from(products.entries())
      .map(([name, p]) => ({ name, quantity: p.quantity, amountRm: fromSen(p.sen) }))
      .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name)),
  }
}

/** Cash that should be in the drawer: the opening float plus cash taken. */
export function expectedCash(openingFloatRm: number, summary: Pick<DaySummary, 'cashInRm'>): number {
  return fromSen(toSen(openingFloatRm) + toSen(summary.cashInRm))
}

/** Counted minus expected: positive = over, negative = short. */
export function cashDifference(countedRm: number, expectedRm: number): number {
  return fromSen(toSen(countedRm) - toSen(expectedRm))
}

/** Start and end of a Malaysia calendar day, as ISO instants. */
export function dayRange(day: string): { from: string; to: string } {
  const from = new Date(`${day}T00:00:00+08:00`)
  return { from: from.toISOString(), to: new Date(from.getTime() + 864e5).toISOString() }
}

// ── Counting cash by notes and coins ─────────────────────────────────────────

/** Malaysian notes and coins, largest first. Value in sen. */
export const DENOMINATIONS = [
  { key: 'RM100', label: 'RM 100', sen: 10000 },
  { key: 'RM50', label: 'RM 50', sen: 5000 },
  { key: 'RM20', label: 'RM 20', sen: 2000 },
  { key: 'RM10', label: 'RM 10', sen: 1000 },
  { key: 'RM5', label: 'RM 5', sen: 500 },
  { key: 'RM1', label: 'RM 1', sen: 100 },
  { key: '50sen', label: '50 sen', sen: 50 },
  { key: '20sen', label: '20 sen', sen: 20 },
  { key: '10sen', label: '10 sen', sen: 10 },
  { key: '5sen', label: '5 sen', sen: 5 },
] as const

export type CashBreakdown = Partial<Record<(typeof DENOMINATIONS)[number]['key'], number>>

/** Only known notes and coins, whole counts 0–100000; empty entries dropped. */
export function cleanBreakdown(raw: unknown): CashBreakdown | null {
  if (!raw || typeof raw !== 'object') return null
  const out: CashBreakdown = {}
  for (const d of DENOMINATIONS) {
    const n = Number((raw as Record<string, unknown>)[d.key])
    if (Number.isInteger(n) && n > 0 && n <= 100_000) out[d.key] = n
  }
  return Object.keys(out).length ? out : null
}

/** Total of a breakdown in RM. */
export function breakdownTotal(b: CashBreakdown | null | undefined): number {
  if (!b) return 0
  return fromSen(DENOMINATIONS.reduce((s, d) => s + (b[d.key] ?? 0) * d.sen, 0))
}
