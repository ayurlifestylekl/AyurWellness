/**
 * Counter checkout rules shared by the cart (browser), the server actions and
 * the receipt. Money is handled in whole sen to avoid floating-point drift.
 */

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card_terminal', label: 'Card (at counter)' },
  { value: 'duitnow_qr', label: 'DuitNow QR / Bank QR' },
  { value: 'tng_ewallet', label: "Touch 'n Go eWallet" },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'hitpay_online', label: 'Online (HitPay)' },
  { value: 'other', label: 'Other' },
] as const

/** Marks a billing item the centre added itself in the cart's service / product lists. */
export const ITEM_PREFIX = 'item:'

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value']
/** package = a session used; package_sale = a package bought; deposit = money paid into the patient's deposit. */
export type BillItemKind = 'service' | 'product' | 'package' | 'package_sale' | 'deposit'
export type BillStatus = 'open' | 'paid' | 'void'

export function isPaymentMethod(v: unknown): v is PaymentMethod {
  return PAYMENT_METHODS.some((m) => m.value === v)
}

export function paymentLabel(method: string | null): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? (method ? method : 'No payment due')
}

export const toSen = (rm: number | string | null | undefined): number => Math.round(Number(rm ?? 0) * 100)
export const fromSen = (sen: number): number => sen / 100
const MONEY = new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const rm = (amount: number | string | null | undefined): string => `RM ${MONEY.format(Number(amount ?? 0))}`

/** INV-000123 */
export function billNoText(no: number | null | undefined): string {
  return no == null ? 'INV-—' : `INV-${String(no).padStart(6, '0')}`
}

export interface LineLike {
  quantity: number
  unitPriceRm: number
}

/** Subtotal, the discount actually applied (never more than the subtotal) and the total. */
export function billTotals(lines: LineLike[], discountRm: number): { subtotal: number; discount: number; total: number } {
  const sub = lines.reduce((s, l) => s + l.quantity * toSen(l.unitPriceRm), 0)
  const disc = Math.min(Math.max(0, toSen(discountRm)), sub)
  return { subtotal: fromSen(sub), discount: fromSen(disc), total: fromSen(sub - disc) }
}

/** Change to hand back for a cash payment, or null when not enough was given. */
export function cashChange(totalRm: number, receivedRm: number): number | null {
  const diff = toSen(receivedRm) - toSen(totalRm)
  return diff >= 0 ? fromSen(diff) : null
}

/** Accepts "12", "12.5", "12.50", "1,200.00"; null for anything else. */
export function parseRm(input: string): number | null {
  const s = input.replace(/[,\s]/g, '').replace(/^rm/i, '')
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(s)) return null
  return Number(s)
}

/** The database's short error codes, in words for the front desk. */
export function checkoutErrorMessage(raw: string): string {
  const m = raw.match(/(bill_not_found|bill_not_open|bill_empty|payment_method_required|cash_short|bill_closed|out_of_stock|product_missing|deposit_paid_now|package_needs_phone)(?::([^:]*))?(?::(\d+))?/)
  if (m) {
    switch (m[1]) {
      case 'bill_not_found': return 'This bill no longer exists.'
      case 'bill_not_open':
      case 'bill_closed': return 'This bill is already paid, so it can’t be changed.'
      case 'bill_empty': return 'Add at least one item before taking payment.'
      case 'payment_method_required': return 'Choose how the customer is paying.'
      case 'cash_short': return 'The cash received is less than the total.'
      case 'out_of_stock': return `Not enough stock of ${m[2] ?? 'a product'}${m[3] ? ` (${m[3]} left)` : ''}.`
      case 'product_missing': return `${m[2] ?? 'A product'} is no longer in the catalogue.`
      case 'deposit_paid_now': return 'A deposit has to be paid now: no discount, balance or pay-later on a bill with a deposit.'
      case 'package_needs_phone': return 'Add the customer’s phone number before selling a package, so its sessions can be found later.'
    }
  }
  const b = raw.match(/(balance_short|balance_over_total|balance_needs_patient|balance_invalid)(?::([a-z_]+))?(?::([0-9.]+))?/)
  if (b) {
    const label: Record<string, string> = { credit: 'credit', deposit: 'deposit', gift_card: 'gift card' }
    switch (b[1]) {
      case 'balance_short': return `Not enough ${label[b[2] ?? ''] ?? 'balance'} — RM ${Number(b[3] ?? 0).toFixed(2)} left.`
      case 'balance_over_total': return 'You’re using more balance than the bill total.'
      case 'balance_needs_patient': return 'Balances and pay-later need a saved patient. Save the patient’s details first.'
      case 'balance_invalid': return 'Choose a balance and an amount to use.'
    }
  }
  if (/expired/i.test(raw)) return 'That package has expired.'
  if (/already used/i.test(raw)) return 'That package has no sessions left.'
  if (/not active/i.test(raw)) return 'That package isn’t active.'
  return 'Something went wrong. Please try again.'
}

// ── Patient balances ──────────────────────────────────────────────────────────

export const BALANCE_KINDS = ['credit', 'deposit', 'gift_card', 'points', 'outstanding'] as const
export type BalanceKind = (typeof BALANCE_KINDS)[number]
/** Balances a bill can be paid from (points have no money value set yet). */
export const SPENDABLE_KINDS = ['deposit', 'credit', 'gift_card'] as const
export type SpendableKind = (typeof SPENDABLE_KINDS)[number]

export const BALANCE_LABEL: Record<BalanceKind, string> = {
  credit: 'Credit',
  deposit: 'Deposit',
  gift_card: 'Gift card',
  points: 'Points',
  outstanding: 'Outstanding',
}

export function isBalanceKind(v: unknown): v is BalanceKind {
  return BALANCE_KINDS.includes(v as BalanceKind)
}

/** Sum of each balance from its ledger entries (worked in sen). */
export function balanceTotals(entries: { kind: string; amount: number }[]): Record<BalanceKind, number> {
  const sen: Record<BalanceKind, number> = { credit: 0, deposit: 0, gift_card: 0, points: 0, outstanding: 0 }
  for (const e of entries) if (isBalanceKind(e.kind)) sen[e.kind] += toSen(e.amount)
  return Object.fromEntries(BALANCE_KINDS.map((k) => [k, fromSen(sen[k])])) as Record<BalanceKind, number>
}

const POINTS = new Intl.NumberFormat('en-MY', { maximumFractionDigits: 2 })

/** Points are a count, the rest are ringgit. */
export function balanceText(kind: BalanceKind, amount: number): string {
  return kind === 'points' ? `${POINTS.format(amount)} pts` : rm(amount)
}

/**
 * What the customer still pays after using balances, or null when the uses
 * don't fit (more than they hold, or more than the bill).
 */
export function amountDue(totalRm: number, uses: { kind: SpendableKind; amount: number }[], held: Record<BalanceKind, number>): number | null {
  let used = 0
  const perKind: Partial<Record<SpendableKind, number>> = {}
  for (const u of uses) {
    if (!(u.amount > 0)) continue
    perKind[u.kind] = (perKind[u.kind] ?? 0) + toSen(u.amount)
    used += toSen(u.amount)
  }
  for (const k of SPENDABLE_KINDS) if ((perKind[k] ?? 0) > toSen(held[k])) return null
  const due = toSen(totalRm) - used
  return due < 0 ? null : fromSen(due)
}
