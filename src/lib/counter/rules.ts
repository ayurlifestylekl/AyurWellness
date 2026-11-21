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
  { value: 'other', label: 'Other' },
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value']
export type BillItemKind = 'service' | 'product' | 'package'
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
  const m = raw.match(/(bill_not_found|bill_not_open|bill_empty|payment_method_required|cash_short|bill_closed|out_of_stock|product_missing)(?::([^:]*))?(?::(\d+))?/)
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
    }
  }
  if (/expired/i.test(raw)) return 'That package has expired.'
  if (/already used/i.test(raw)) return 'That package has no sessions left.'
  if (/not active/i.test(raw)) return 'That package isn’t active.'
  return 'Something went wrong. Please try again.'
}
