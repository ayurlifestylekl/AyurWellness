/**
 * Whether the site can take an online payment right now.
 *
 * Paid treatment bookings and shop checkout both end at a HitPay bill. Until
 * the clinic has its own HitPay account (and the key + webhook salt are set on
 * the host), starting one just fails — so the paid paths check this first and
 * tell the customer to WhatsApp instead, rather than letting them fill in a
 * whole form, take a slot hold, and then hit an error at the payment step.
 *
 * It switches itself on: setting HITPAY_API_KEY and HITPAY_SIGNATURE_SALT is
 * all it takes — no code change or redeploy of this file. Both are required;
 * a key without the salt can create bills but could never confirm them, since
 * the signed webhook is the only thing trusted to mark a booking paid.
 *
 * Server-only by nature: the HITPAY_* variables are not exposed to the browser,
 * so client components receive the result as a prop.
 */
export function onlinePaymentsAvailable(): boolean {
  if (process.env.PAYMENTS_PROVIDER === 'hitpay') {
    return Boolean(
      process.env.HITPAY_API_KEY?.trim() && process.env.HITPAY_SIGNATURE_SALT?.trim(),
    )
  }
  // Anything else is the local test stub, which getPaymentProvider() only
  // allows outside production (or with an explicit override). Mirror that, so
  // local development and the test suite keep working unchanged.
  return process.env.NODE_ENV !== 'production' || process.env.PAYMENTS_ALLOW_STUB === 'true'
}

/** Shown when a paid path is reached while online payment is not yet available. */
export const PAYMENTS_CLOSED_MESSAGE =
  'Online treatment booking and payment open soon. To book a treatment now, please WhatsApp us and we will arrange it for you.'

/** Same, for the product shop. */
export const SHOP_PAYMENTS_CLOSED_MESSAGE =
  'Online ordering opens soon. To order now, please WhatsApp us and we will arrange it for you.'
