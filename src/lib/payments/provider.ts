/**
 * Payment provider seam. The booking flow only ever talks to this interface,
 * so swapping the stub for real Billplz (day 2) is a single-file drop-in.
 */

export interface CreateBillArgs {
  appointmentId: string
  amountRm: number
  name: string
  email: string
  phone: string
  description: string
  /** Absolute URL the provider calls server-side when payment settles. */
  callbackUrl: string
  /** Absolute URL the customer is returned to after paying. */
  redirectUrl: string
}

export interface CreateBillResult {
  billId: string
  /** Where to send the customer to complete payment. */
  url: string
}

export interface CallbackResult {
  billId: string
  paid: boolean
  /** Optional URL to redirect the browser to (used by the stub return flow). */
  redirectTo?: string
}

export interface RefundArgs {
  billId: string
  amountRm: number
  idempotencyKey: string
  customerEmail: string
  bank?: {
    bankCode: string
    accountNumber: string
    accountHolderName: string
  }
}

export interface ProviderRefundResult {
  providerRefundId: string
  status: 'pending' | 'confirmed'
  bankCode?: string
  bankAccountLast4?: string
}

export interface RefundStatusResult {
  status: 'pending' | 'confirmed' | 'exception'
}

export interface RefundCallbackResult extends RefundStatusResult {
  providerRefundId: string
  idempotencyKey?: string
  provider?: 'hitpay' | 'stub'
}

export type ProviderRefundErrorCategory = 'definitive' | 'ambiguous'

/** A fixed, redacted provider failure classification for durable retry decisions. */
export class ProviderRefundError extends Error {
  readonly category: ProviderRefundErrorCategory

  constructor(category: ProviderRefundErrorCategory) {
    super(category === 'definitive'
      ? 'Refund provider rejected the request.'
      : 'Refund provider outcome is pending.')
    this.name = 'ProviderRefundError'
    this.category = category
  }
}

export function isSafeProviderRefundId(provider: string, value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 255 || value.trim() !== value) {
    return false
  }
  if (provider === 'stub') return /^stub_refund_[A-Za-z0-9:_-]+$/.test(value)
  if (provider !== 'hitpay') return false

  const safeToken = /^[A-Za-z0-9][A-Za-z0-9_-]*$/
  const hasSeparator = /[_-]/.test(value)
  const hasLetterAndDigit = /[A-Za-z]/.test(value) && /\d/.test(value)
  return UUID_PATTERN.test(value) || (safeToken.test(value) && (hasSeparator || hasLetterAndDigit))
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isSafeRefundIdempotencyKey(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = /^(?:booking|product)-refund:([^:]+):full$/.exec(value)
  return match !== null && UUID_PATTERN.test(match[1])
}

export function providerIdMatchesSensitiveValue(
  providerRefundId: string,
  ...sensitiveValues: Array<string | null | undefined>
): boolean {
  const normalizedId = providerRefundId.toLowerCase().replace(/[^a-z0-9]/g, '')
  return normalizedId.length > 0 && sensitiveValues.some((value) => (
    typeof value === 'string'
    && value.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedId
  ))
}

export interface PaymentProvider {
  readonly name: string
  createBill(args: CreateBillArgs): Promise<CreateBillResult>
  /** Parse + verify a provider callback/return request. */
  verifyCallback(req: Request): Promise<CallbackResult>
  /**
   * Authoritative status lookup straight from the provider's API — used to
   * reconcile a webhook that was missed or failed signature verification.
   * Returns null when the provider can't be queried (e.g. the test stub).
   */
  fetchBillStatus?(billId: string): Promise<{ paid: boolean } | null>
  /**
   * Remove an UNPAID bill so a cancelled booking can never be paid for.
   * Providers reject deleting a paid bill — callers treat failure as
   * "possibly paid" and rely on reconciliation, never on this succeeding.
   */
  deleteBill?(billId: string): Promise<void>
  /** Create an idempotent refund or outgoing refund disbursement. */
  createRefund(args: RefundArgs): Promise<ProviderRefundResult>
  /** Authoritative provider lookup used to reconcile a pending refund. */
  fetchRefundStatus(providerRefundId: string): Promise<RefundStatusResult | null>
  /** Parse and verify a provider refund callback without returning recipient PII. */
  verifyRefundCallback?(req: Request): Promise<RefundCallbackResult | null>
}
