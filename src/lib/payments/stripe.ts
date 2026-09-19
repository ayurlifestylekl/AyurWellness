import Stripe from 'stripe'
import {
  ProviderRefundError,
  isSafeProviderRefundId,
  isSafeRefundIdempotencyKey,
} from './provider'
import type {
  CallbackResult,
  CreateBillArgs,
  CreateBillResult,
  PaymentProvider,
  ProviderRefundResult,
  RefundArgs,
  RefundCallbackResult,
  RefundStatusResult,
} from './provider'

/**
 * Stripe (card) provider — for customers without a Malaysian bank account,
 * who can't use FPX. Billplz stays the default for local FPX payments; this
 * is the "Card" option shown alongside it once Stripe is configured.
 *
 * To go live: set in the environment
 *   STRIPE_SECRET_KEY     — secret key (sk_live_… / sk_test_…)
 *   STRIPE_WEBHOOK_SECRET — signing secret for the webhook endpoint below
 *
 * In the Stripe Dashboard → Developers → Webhooks, add an endpoint at
 *   https://<your-domain>/api/payments/stripe-webhook
 * listening for the `checkout.session.completed` event.
 *
 * Uses hosted Stripe Checkout (redirect flow) — same shape as Billplz's
 * hosted bill page, so no client-side Stripe.js or PCI scope is needed.
 */

let cached: Stripe | null = null
function client(): Stripe {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured.')
  // The SDK does NOT auto-retry by default (maxNetworkRetries is 0 unless
  // set) — a momentary network blip or transient 5xx from Stripe used to
  // fail the whole checkout attempt outright, forcing the customer to
  // press "pay" again themselves. Stripe's own retry logic only retries
  // genuinely safe conditions (network errors, timeouts, 429, 5xx) and
  // reuses the same idempotency key across attempts, so this can't create
  // a duplicate charge/session.
  cached = new Stripe(key, { maxNetworkRetries: 2 })
  return cached
}

function stripeRefundStatus(status: Stripe.Refund['status']): RefundStatusResult['status'] {
  if (status === 'succeeded') return 'confirmed'
  if (status === 'pending' || status === 'requires_action') return 'pending'
  return 'exception'
}

async function verifiedEvent(req: Request): Promise<Stripe.Event | null> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const sig = req.headers.get('stripe-signature')
  const raw = await req.text()
  if (!secret || !sig) return null
  try {
    return client().webhooks.constructEvent(raw, sig, secret)
  } catch {
    // Signature errors are deliberately opaque: never echo webhook payloads.
    return null
  }
}

function stripeFailure(error: unknown): ProviderRefundError {
  const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
    ? Number((error as { statusCode?: unknown }).statusCode)
    : null
  const transient = statusCode !== null
    && ([408, 409, 425, 429].includes(statusCode) || statusCode >= 500)
  const definitive = !transient && statusCode !== null
    && Number.isInteger(statusCode)
    && statusCode >= 400
    && statusCode < 500
    && statusCode !== 409
  return new ProviderRefundError(definitive ? 'definitive' : 'ambiguous')
}

export const stripeProvider: PaymentProvider = {
  name: 'stripe',

  async createBill(args: CreateBillArgs): Promise<CreateBillResult> {
    const session = await client().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: args.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'myr',
            product_data: { name: args.description.slice(0, 200) },
            unit_amount: Math.round(args.amountRm * 100), // sen
          },
          quantity: 1,
        },
      ],
      success_url: args.redirectUrl,
      cancel_url: args.redirectUrl,
      metadata: { appointmentId: args.appointmentId },
    })
    if (!session.url) throw new Error('Stripe did not return a Checkout URL.')
    return { billId: session.id, url: session.url }
  },

  async fetchBillStatus(billId: string): Promise<{ paid: boolean } | null> {
    if (!billId) return null
    try {
      const session = await client().checkout.sessions.retrieve(billId)
      return { paid: session.payment_status === 'paid' }
    } catch {
      return null
    }
  },

  async deleteBill(billId: string): Promise<void> {
    if (!billId) return
    try {
      await client().checkout.sessions.expire(billId)
    } catch (e) {
      // Already expired/completed is fine — either way it can't be paid again.
      const msg = e instanceof Error ? e.message : String(e)
      if (/already expired|already completed|no longer accepting/i.test(msg)) return
      throw e
    }
  },

  async createRefund(args: RefundArgs): Promise<ProviderRefundResult> {
    const amount = Math.round(args.amountRm * 100)
    if (
      !process.env.STRIPE_SECRET_KEY
      || !Number.isSafeInteger(amount)
      || amount <= 0
      || !args.idempotencyKey
      || !args.billId
    ) {
      throw new ProviderRefundError('definitive')
    }

    let session: Stripe.Checkout.Session
    try {
      session = await client().checkout.sessions.retrieve(args.billId)
    } catch (error) {
      throw stripeFailure(error)
    }
    const paymentIntent = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id
    if (!paymentIntent) throw new ProviderRefundError('definitive')

    let refund: Stripe.Refund
    try {
      refund = await client().refunds.create({
        payment_intent: paymentIntent,
        amount,
        metadata: { booking_refund_idempotency_key: args.idempotencyKey },
      }, { idempotencyKey: args.idempotencyKey })
    } catch (error) {
      throw stripeFailure(error)
    }
    if (!isSafeProviderRefundId('stripe', refund.id)) throw new ProviderRefundError('ambiguous')
    const status = stripeRefundStatus(refund.status)
    if (status === 'exception') throw new ProviderRefundError('definitive')
    return { providerRefundId: refund.id, status }
  },

  async fetchRefundStatus(providerRefundId: string): Promise<RefundStatusResult | null> {
    if (!isSafeProviderRefundId('stripe', providerRefundId)) return null
    try {
      const refund = await client().refunds.retrieve(providerRefundId)
      return { status: stripeRefundStatus(refund.status) }
    } catch {
      return null
    }
  },

  async verifyRefundCallback(req: Request): Promise<RefundCallbackResult | null> {
    const event = await verifiedEvent(req)
    if (!event || event.type !== 'refund.updated') return null
    const refund = event.data.object as Stripe.Refund
    if (!isSafeProviderRefundId('stripe', refund.id)) return null
    const idempotencyKey = refund.metadata?.booking_refund_idempotency_key
    return {
      providerRefundId: refund.id,
      status: stripeRefundStatus(refund.status),
      provider: 'stripe',
      ...(isSafeRefundIdempotencyKey(idempotencyKey)
        ? { idempotencyKey }
        : {}),
    }
  },

  /**
   * Verifies a Stripe webhook. Requires the RAW request body — the caller
   * (the /api/payments/stripe-webhook route) must not have parsed it first.
   */
  async verifyCallback(req: Request): Promise<CallbackResult> {
    const event = await verifiedEvent(req)
    if (!event || event.type !== 'checkout.session.completed') return { billId: '', paid: false }
    const session = event.data.object as Stripe.Checkout.Session
    return { billId: session.id, paid: session.payment_status === 'paid' }
  },
}
