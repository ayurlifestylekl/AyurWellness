import type { PaymentProvider } from './provider'
import { stubProvider } from './stub'
import { billplzProvider } from './billplz'
import { stripeProvider } from './stripe'

/**
 * Selects the FPX/local-banking provider. Stub (test mode) is the default so
 * the flow works end-to-end with no real money; set PAYMENTS_PROVIDER=billplz
 * to switch over. (We gate on an explicit flag, not the mere presence of
 * BILLPLZ_API_KEY — that key already exists for the product shop and must
 * not silently route appointment payments live.)
 *
 * Untouched by the Stripe/card addition below — this is exactly the selector
 * that has been running the live FPX flow, kept as-is to avoid regressing it.
 */
export function getPaymentProvider(): PaymentProvider {
  if (process.env.PAYMENTS_PROVIDER === 'billplz') return billplzProvider
  // The stub trusts `paid=true` straight from the callback URL — it exists only
  // for local end-to-end testing. It must NEVER be selectable in production,
  // where it would let anyone confirm a booking for free. Fail closed.
  const allowStub = process.env.PAYMENTS_ALLOW_STUB === 'true'
  if (process.env.NODE_ENV === 'production' && !allowStub) {
    throw new Error(
      'Payment provider misconfigured: set PAYMENTS_PROVIDER=billplz in production. Refusing to fall back to the insecure test stub.',
    )
  }
  return stubProvider
}

export type PaymentMethod = 'fpx' | 'card'

/** Card payments only appear once the clinic's Stripe account is configured. */
export function isCardPaymentEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

/** Selects a provider by the customer's chosen payment method. */
export function getProviderForMethod(method: PaymentMethod): PaymentProvider {
  if (method === 'card') {
    if (!isCardPaymentEnabled()) {
      throw new Error('Card payment is not available yet.')
    }
    return stripeProvider
  }
  return getPaymentProvider()
}

/**
 * Looks up a provider by its stored `payment_provider` name — used when
 * reconciling/voiding an EXISTING bill, where we must talk to the same
 * provider that created it, not whichever one is currently the default.
 * Returns null for an unrecognised or now-unconfigured provider (caller
 * treats that as "nothing we can do", never as "assume billplz").
 */
export function getProviderByName(name: string | null | undefined): PaymentProvider | null {
  if (name === 'billplz') return billplzProvider
  if (name === 'stripe') return isCardPaymentEnabled() ? stripeProvider : null
  if (name === 'stub') return stubProvider
  return null
}

export type { PaymentProvider } from './provider'
