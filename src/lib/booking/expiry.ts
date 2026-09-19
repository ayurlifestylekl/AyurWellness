import 'server-only'
import { createClient as createSb } from '@supabase/supabase-js'
import { createBookingToken } from './token'
import { reconcileByBill, voidBill } from './payment'
import { notifyCancelled, notifyPaymentReminder, BOOKING_SITE_URL } from './notify'

function admin() {
  return createSb(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const EXPIRED_REASON = 'Payment wasn’t completed in time — the slot has been released. You’re welcome to book again.'

export interface SweepResult {
  expired: number
  rescued: number
  reminded: number
}

/**
 * The payment-hold sweep:
 *  1. Cancel awaiting_payment bookings past their 15-hour window (email once per
 *     group) and free the slot — after a paid-check with the provider so a
 *     customer whose webhook was missed is confirmed, never cancelled.
 *  2. Email a reminder ~2 hours before a window expires (once).
 *
 * Idempotent and cheap when nothing is due, so it runs from several places:
 * the cron/UptimeRobot endpoint, every staff-console load, and the customer
 * status page — statuses flip promptly instead of waiting for the next cron.
 */
export async function sweepExpiredBookings(): Promise<SweepResult> {
  const sb = admin()
  const now = new Date()
  const nowISO = now.toISOString()
  // Fallback cutoff: if a hold somehow has no expiry stamp, treat >15h-old as expired.
  const staleISO = new Date(now.getTime() - 15 * 3600_000).toISOString()
  // Slack past the stamped expiry before actually cancelling. Instant-booking
  // holds are ~20 minutes now (vs the old 15-hour staff-approved window), so
  // "payment is landing right at the deadline" went from a freak coincidence
  // to an expected case for a slower payer — this buffer gives an in-flight
  // bank redirect room to land before the sweep pulls the slot back.
  const cutoffISO = new Date(now.getTime() - 5 * 60_000).toISOString()

  // 1) Expire + release — explicit-expiry holds, plus a safety net for any
  //    awaiting_payment row missing its expiry stamp but approved >15h ago.
  const [byExpiry, byStale] = await Promise.all([
    sb.from('appointments')
      .select('id, group_id, patient_email, patient_name, treatment_name, payment_bill_id, payment_provider')
      .eq('status', 'awaiting_payment')
      .lt('payment_expires_at', cutoffISO),
    sb.from('appointments')
      .select('id, group_id, patient_email, patient_name, treatment_name, payment_bill_id, payment_provider')
      .eq('status', 'awaiting_payment')
      .is('payment_expires_at', null)
      .lt('approved_at', staleISO),
  ])
  if (byExpiry.error) throw byExpiry.error
  // byStale is best-effort (approved_at may be null on old rows); don't hard-fail on it.
  const expired = [...(byExpiry.data ?? []), ...(byStale.data ?? [])]

  let expiredCount = 0
  let rescuedCount = 0
  // A group shares one email address — send its expiry notice once, not per guest.
  const cancelledGroups = new Set<string>()
  for (const a of expired) {
    // Never cancel a booking the customer actually paid for: if a bill is
    // attached, confirm-if-paid against the provider's API first. This catches
    // payments whose webhook was missed/rejected before they get released.
    if (a.payment_bill_id) {
      try {
        const r = await reconcileByBill(a.payment_bill_id, a.payment_provider)
        if ('appointmentId' in r) { rescuedCount++; continue }
      } catch (e) {
        console.error('[expiry] reconcile check failed for', a.id, e)
      }
    }
    const { error } = await sb
      .from('appointments')
      .update({ status: 'cancelled', cancelled_at: nowISO, cancellation_reason: EXPIRED_REASON })
      .eq('id', a.id)
      .eq('status', 'awaiting_payment') // guard against a race with a just-completed payment
    if (error) continue
    expiredCount++
    // Kill the open bill so the released slot can never be paid for afterwards.
    await voidBill(a.payment_bill_id, a.payment_provider)
    if (a.group_id && cancelledGroups.has(a.group_id)) continue
    if (a.group_id) cancelledGroups.add(a.group_id)
    // One bad email must not abort the whole sweep.
    try {
      await notifyCancelled({
        to: a.patient_email,
        name: a.patient_name,
        treatmentName: a.group_id ? `${a.treatment_name ?? 'Treatment'} (group)` : a.treatment_name,
        refundable: false,
        reason: EXPIRED_REASON,
      })
    } catch (e) {
      console.error('[expiry] notifyCancelled failed for', a.id, e)
    }
  }

  // 2) Remind (within 2h of expiry, not yet reminded). Instant-booking holds
  //    (~20 min, never staff-approved so approved_at is null) are excluded —
  //    a "2 hours left" reminder is meaningless on a 20-minute window; the
  //    on-page countdown is the signal for that flow instead.
  const soonISO = new Date(now.getTime() + 2 * 3600_000).toISOString()
  const { data: soon, error: soonErr } = await sb
    .from('appointments')
    .select('id, group_id, patient_email, patient_name, treatment_name, payment_expires_at')
    .eq('status', 'awaiting_payment')
    .eq('payment_reminded', false)
    .not('approved_at', 'is', null)
    .gt('payment_expires_at', nowISO)
    .lt('payment_expires_at', soonISO)
  if (soonErr) throw soonErr

  // A group shares one combined bill — remind it ONCE, not once per guest.
  const remindedGroups = new Set<string>()
  let remindedCount = 0
  for (const a of soon ?? []) {
    if (a.group_id && remindedGroups.has(a.group_id)) continue
    try {
      await notifyPaymentReminder({
        to: a.patient_email,
        name: a.patient_name,
        treatmentName: a.group_id ? `${a.treatment_name ?? 'Treatment'} (group)` : a.treatment_name,
        payUrl: `${BOOKING_SITE_URL}/book/request/${a.id}/pay?t=${createBookingToken(a.id)}`,
        expiresISO: a.payment_expires_at,
      })
      if (a.group_id) {
        remindedGroups.add(a.group_id)
        await sb.from('appointments').update({ payment_reminded: true }).eq('group_id', a.group_id)
      } else {
        await sb.from('appointments').update({ payment_reminded: true }).eq('id', a.id)
      }
      remindedCount++
    } catch (e) {
      console.error('[expiry] reminder failed for', a.id, e)
    }
  }

  return { expired: expiredCount, rescued: rescuedCount, reminded: remindedCount }
}

/**
 * Best-effort sweep for page loads: never throws, never blocks the page on
 * failure. Statuses staff/customers see are corrected as a side effect.
 */
export async function sweepExpiredBookingsSafe(): Promise<SweepResult | null> {
  try {
    return await sweepExpiredBookings()
  } catch (e) {
    console.error('[expiry] sweep failed:', e)
    return null
  }
}
