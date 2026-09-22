import type { PaymentProvider } from './provider'
import { stubProvider } from './stub'
import { hitpayProvider } from './hitpay'

/**
 * HitPay is the only payment provider. Stub mode is available for local
 * end-to-end testing only and is never selectable in production.
 */
export function getPaymentProvider(): PaymentProvider {
  if (process.env.PAYMENTS_PROVIDER === 'hitpay') return hitpayProvider
  // The stub trusts `paid=true` straight from the callback URL — it exists only
  // for local end-to-end testing. It must NEVER be selectable in production,
  // where it would let anyone confirm a booking for free. Fail closed.
  const allowStub = process.env.PAYMENTS_ALLOW_STUB === 'true'
  if (process.env.NODE_ENV === 'production' && !allowStub) {
    throw new Error(
      'Payment provider misconfigured: set PAYMENTS_PROVIDER=hitpay in production. Refusing to fall back to the insecure test stub.',
    )
  }
  return stubProvider
}

/**
 * Looks up a provider by its stored `payment_provider` name — used when
 * reconciling/voiding an EXISTING bill, where we must talk to the same
 * provider that created it, not whichever one is currently the default.
 */
export function getProviderByName(name: string | null | undefined): PaymentProvider | null {
  if (name === 'hitpay') return hitpayProvider
  if (name === 'stub') return stubProvider
  return null
}

export type { PaymentProvider } from './provider'
