import 'server-only'
import { createClient as createSb } from '@supabase/supabase-js'
import { getPaymentProvider, getProviderForMethod, getProviderByName, type PaymentMethod } from '@/lib/payments'
import { canAccessBooking } from './access'
import { createBookingToken } from './token'
import { notifyConfirmed, notifyPaymentAssociationProblem, notifyPaymentProblem, BOOKING_SITE_URL } from './notify'
import {
  classifyPaymentConfirmation,
  parsePaymentConfirmation,
  persistBillAssociation,
  paymentProblemAlertInput,
  type PaymentHandlingResult,
} from './payment-result'
import { groupBillTotals } from './group-management'

function admin() {
  return createSb(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      // Payment decisions must always read the live row — never Next's fetch
      // cache. A stale row once re-sent an already-corrected invalid phone to
      // Billplz and kept the pay page failing after the data was fixed.
      global: { fetch: (i, init) => fetch(i, { ...init, cache: 'no-store' }) },
    },
  )
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
}

/**
 * Create a bill for an approved (awaiting_payment) appointment and return the
 * URL to send the customer to. Server-only — never exposed as a client action.
 */
export async function startPaymentForAppointment(
  id: string,
  token?: string | null,
  method: PaymentMethod = 'fpx',
): Promise<{ url: string } | { error: string }> {
  const sb = admin()
  const { data: a } = await sb
    .from('appointments')
    .select('id, status, payable_amount_rm, patient_name, patient_email, patient_phone, treatment_name, customer_id, payment_bill_id, payment_url, payment_provider')
    .eq('id', id)
    .maybeSingle()
  if (!a) return { error: 'Booking not found.' }
  if (!(await canAccessBooking(id, a.customer_id ?? null, token))) {
    return { error: 'Not authorised.' }
  }
  if (a.status !== 'awaiting_payment') return { error: 'This booking is not awaiting payment.' }
  // Best-effort expiry check (separate query so a missing column can't break pay).
  const { data: exp } = await sb.from('appointments').select('payment_expires_at').eq('id', id).maybeSingle()
  if (exp?.payment_expires_at && new Date(exp.payment_expires_at).getTime() < Date.now()) {
    return { error: 'This payment link has expired and the slot was released. Please book again.' }
  }
  if (a.payable_amount_rm == null) return { error: 'No amount is payable for this booking.' }

  let provider
  try {
    provider = getProviderForMethod(method)
  } catch (e) {
    console.error('[payment] provider unavailable for method', method, e)
    return { error: 'That payment method is not available right now — please try Online Banking (FPX), or WhatsApp us.' }
  }

  // Re-use the bill from an earlier "Pay" click on the SAME method while it's
  // still open — minting a new bill per click leaves multiple payable bills
  // (double-charge risk). Switching method (e.g. FPX → Card) mints a fresh one.
  if (a.payment_bill_id && a.payment_url && a.payment_provider === provider.name && provider.fetchBillStatus) {
    const existing = await provider.fetchBillStatus(a.payment_bill_id).catch(() => null)
    if (existing && !existing.paid) return { url: a.payment_url }
    if (existing?.paid) {
      // Paid but the webhook hasn't landed — confirm now instead of re-billing.
      await markBillPaid(a.payment_bill_id)
      return { error: 'This booking is already paid — please check your email for the confirmation.' }
    }
    // Bill deleted/unreachable → fall through and mint a fresh one.
  }

  // Group bookings: one combined bill across all guests (best-effort group lookup).
  let amountRm = Number(a.payable_amount_rm)
  let description = `${a.treatment_name ?? 'Treatment'} booking`
  let expectedAssociationCount = 1
  const { data: g } = await sb.from('appointments').select('group_id').eq('id', id).maybeSingle()
  const groupId: string | null = g?.group_id ?? null
  if (groupId) {
    const { data: members, error: membersError } = await sb
      .from('appointments')
      .select('status, payable_amount_rm, payment_bill_id, group_management_active')
      .eq('group_id', groupId)
      .eq('group_management_active', true)
    const list = members ?? []
    if (membersError || list.length === 0) {
      console.error('[payment] group lookup failed before bill creation for', a.id, membersError)
      return { error: 'The payment could not be started — please try again shortly, or WhatsApp us and we will send you a payment link.' }
    }
    if (list.some((m) => m.status !== 'awaiting_payment')) {
      return { error: 'This group can\'t be paid right now — one of the guests is no longer awaiting payment. Please check the booking status page.' }
    }
    if (list.some((m) => (m.payment_bill_id ?? null) !== (a.payment_bill_id ?? null))) {
      console.error('[payment] group has inconsistent existing bill associations for', a.id)
      return { error: 'The payment could not be started — please try again shortly, or WhatsApp us and we will send you a payment link.' }
    }
    const totals = groupBillTotals(list)
    expectedAssociationCount = totals.count
    amountRm = totals.amountRm
    description = `${a.treatment_name ?? 'Treatment'} — group of ${totals.count}`
  }

  const base = siteUrl()
  // A provider rejection must degrade to a friendly message on the status page,
  // never a 500 — the customer is mid-payment and needs a way forward.
  let billId: string
  let url: string
  try {
    ;({ billId, url } = await provider.createBill({
      appointmentId: a.id,
      amountRm,
      name: a.patient_name ?? 'Guest',
      email: a.patient_email ?? '',
      phone: a.patient_phone ?? '',
      description,
      callbackUrl: `${base}/api/payments/callback`,
      redirectUrl: `${base}/book/request/${a.id}${token ? `?t=${token}` : ''}`,
    }))
  } catch (e) {
    console.error('[payment] createBill failed for', a.id, e)
    return { error: 'The payment could not be started — please try again shortly, or WhatsApp us and we will send you a payment link.' }
  }

  // Group bookings share one bill — write it onto EVERY guest's row, not just
  // the lead's. sweepExpiredBookings reconciles a bill per-row before
  // cancelling it, so a non-lead row missing payment_bill_id would get
  // cancelled with no paid-check at all if the sweep ran while payment was
  // still landing (a real risk now that holds are minutes, not hours).
  const billPatch = { payment_bill_id: billId, payment_url: url, payment_provider: provider.name, payment_status: 'pending' }
  const association = await persistBillAssociation({
    billId,
    expectedCount: expectedAssociationCount,
    associate: async () => {
      let query = groupId
        ? sb.from('appointments').update(billPatch, { count: 'exact' }).eq('group_id', groupId).eq('group_management_active', true)
        : sb.from('appointments').update(billPatch, { count: 'exact' }).eq('id', a.id)
      query = query.eq('status', 'awaiting_payment')
      query = a.payment_bill_id
        ? query.eq('payment_bill_id', a.payment_bill_id)
        : query.is('payment_bill_id', null)
      const result = await query
      return { count: result.count, error: result.error }
    },
    deactivate: async (unsafeBillId) => {
      if (provider.deleteBill) await provider.deleteBill(unsafeBillId)
    },
    alert: async (unsafeBillId) => {
      console.error(`[payment] bill association failed billId=${unsafeBillId} appointment=${a.id}`)
      await notifyPaymentAssociationProblem({ billId: unsafeBillId, name: a.patient_name, treatmentName: a.treatment_name })
    },
  })
  if (association === 'failed') {
    return { error: 'The payment could not be started — please try again shortly, or WhatsApp us and we will send you a payment link.' }
  }

  return { url }
}

/**
 * Void an open bill after its booking is cancelled, so the customer can never
 * pay for a booking that no longer exists. Never throws — a delete failure
 * usually means the bill was JUST paid, so we reconcile instead: either the
 * payment confirms the booking, or staff get the payment-problem alert.
 *
 * `providerName` should be the bill's own stored `payment_provider` — voiding
 * MUST talk to the provider that created the bill, not whichever is default
 * today. Omit only for legacy callers that predate multi-provider (falls
 * back to the FPX/stub selector, matching the old single-provider behaviour).
 */
export async function voidBill(billId: string | null | undefined, providerName?: string | null): Promise<void> {
  if (!billId || billId.startsWith('stub_')) return
  try {
    const provider = providerName !== undefined ? getProviderByName(providerName) : getPaymentProvider()
    if (!provider?.deleteBill) return
    await provider.deleteBill(billId)
  } catch (e) {
    console.error('[payment] voidBill failed (bill may be paid) —', billId, e)
    try {
      await reconcileByBill(billId, providerName)
    } catch (e2) {
      console.error('[payment] voidBill reconcile also failed —', billId, e2)
    }
  }
}

/**
 * Authoritatively reconcile a bill against the provider's API and confirm the
 * booking if the provider reports it paid. Safety net for a webhook that was
 * missed or failed signature verification. Idempotent; a no-op if the provider
 * can't be queried or the bill isn't paid.
 *
 * `providerName` should be the bill's own stored `payment_provider` (multiple
 * providers may now be live at once, so we must ask the SAME one that issued
 * the bill). Omit only for legacy callers that predate multi-provider (falls
 * back to the FPX/stub selector, matching the old single-provider behaviour).
 */
export async function reconcileByBill(
  billId: string,
  providerName?: string | null,
): Promise<PaymentHandlingResult | { skipped: true }> {
  if (!billId) return { skipped: true }
  const provider = providerName !== undefined ? getProviderByName(providerName) : getPaymentProvider()
  if (!provider?.fetchBillStatus) return { disposition: 'transient', state: 'provider_unconfirmed' }
  const status = await provider.fetchBillStatus(billId)
  // `status === null` means we couldn't get an answer at all (network error,
  // provider unreachable, bill lookup failed) — that's inconclusive, so retry.
  // `status.paid === false` means the provider positively confirmed this bill
  // is not paid — a definite negative, not a glitch, so don't retry forever.
  if (!status) return { disposition: 'transient', state: 'provider_unconfirmed' }
  if (!status.paid) return { disposition: 'final', state: 'provider_not_paid' }
  return markBillPaid(billId)
}

/**
 * Reconcile a single appointment that's awaiting payment — used when the
 * customer returns from the gateway, so a paid booking self-heals even if the
 * webhook never landed. Returns 'confirmed' when it flips, else 'noop'.
 */
export async function reconcileAppointment(appointmentId: string): Promise<'confirmed' | 'noop'> {
  const sb = admin()
  const { data: a } = await sb
    .from('appointments')
    .select('status, payment_bill_id, payment_provider')
    .eq('id', appointmentId)
    .maybeSingle()
  if (!a || a.status !== 'awaiting_payment' || !a.payment_bill_id) return 'noop'
  const res = await reconcileByBill(a.payment_bill_id, a.payment_provider)
  return 'disposition' in res && res.disposition === 'terminal' && ['confirmed', 'already_confirmed'].includes(res.state)
    ? 'confirmed'
    : 'noop'
}

/** Mark a bill paid and confirm its appointment. Idempotent. */
export async function markBillPaid(billId: string): Promise<PaymentHandlingResult> {
  const sb = admin()
  let data: unknown
  try {
    const rpc = await sb.rpc('confirm_appointment_payment', { p_bill_id: billId })
    if (rpc.error) {
      console.error('[payment] atomic confirmation RPC failed for', billId, rpc.error)
      return { disposition: 'transient', state: 'rpc_error' }
    }
    data = rpc.data
  } catch (error) {
    console.error('[payment] atomic confirmation request failed for', billId, error)
    return { disposition: 'transient', state: 'rpc_error' }
  }

  let result
  try {
    result = parsePaymentConfirmation(data)
  } catch (error) {
    console.error('[payment] invalid atomic confirmation result for', billId, error)
    return { disposition: 'transient', state: 'invalid_result' }
  }

  const handling = classifyPaymentConfirmation(result)
  if (result.state === 'not_found' || result.state === 'already_confirmed') return handling
  if (result.state === 'not_payable') {
    // Money arrived after the booking ceased to be payable. The RPC changed no
    // appointment rows; staff must review and refund rather than silently lose it.
    const alert = paymentProblemAlertInput(result)
    if (alert) await notifyPaymentProblem({ billId, ...alert })
    return handling
  }

  const lead = result.rows.find((row) => row.id === result.leadId) ?? result.rows[0]
  if (!lead) {
    console.error('[payment] atomic confirmation returned no changed rows for', billId)
    return { disposition: 'transient', state: 'invalid_result' }
  }

  // Only the callback that changed awaiting_payment -> confirmed receives the
  // rows and reaches this notification. Duplicate callbacks get
  // already_confirmed above, making confirmation notifications exactly once.
  await notifyConfirmed({
    to: lead.patient_email,
    name: lead.patient_name,
    treatmentName: lead.treatment_name,
    whenISO: lead.appointment_date_time ?? null,
    bookingKind: 'treatment',
    bookingId: lead.id,
    statusUrl: `${BOOKING_SITE_URL}/book/request/${lead.id}?t=${createBookingToken(lead.id)}`,
    guests: result.groupId
      ? result.rows.map((row) => ({
          name: row.patient_name ?? null,
          age: row.guest_age != null ? Number(row.guest_age) : null,
          treatmentName: row.treatment_name ?? null,
          whenISO: row.appointment_date_time ?? null,
        }))
      : undefined,
  })
  return handling
}
