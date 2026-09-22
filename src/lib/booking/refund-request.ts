'use server'

import { createClient } from '@supabase/supabase-js'
import { MISTAKE_WINDOW_MS, REFUND_ADVANCE_MS } from './management-policy'
import { canManageBookingTarget } from './management-access'
import { requireStaff } from '@/lib/staff/guard'
import { requestProviderRefund } from '@/lib/payments/refund'
import {
  notifyRefundRequested,
  notifyRefundApproved,
  notifyRefundRejected,
  BOOKING_SITE_URL,
} from './notify'

export interface RefundBankDetails {
  bankCode: string
  accountNumber: string
  accountHolderName: string
}

export interface RefundRequestRecord {
  id: string
  appointmentId: string
  status: string
  provider: string
  amountRm: number
  customerReason: string | null
  staffReason: string | null
  bankCode: string | null
  bankAccountNumber: string | null
  bankAccountHolderName: string | null
  bankAccountLast4: string | null
  createdAt: string
}

export interface RequestBookingRefundInput {
  appointmentId: string
  reason: string
  token?: string | null
  bank?: RefundBankDetails
}

type Ok<T = undefined> = T extends undefined ? { ok: true } : { ok: true; data: T }
type Err = { error: string }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function last4(value: string): string {
  return value.length <= 4 ? value : value.slice(-4)
}

function statusUrl(appointmentId: string, token?: string | null): string {
  const base = `${BOOKING_SITE_URL}/book/request/${appointmentId}/manage`
  return token ? `${base}?t=${encodeURIComponent(token)}` : base
}

export async function requestBookingRefund(
  input: RequestBookingRefundInput,
): Promise<Ok | Err> {
  if (!input || typeof input !== 'object') return { error: 'Invalid refund request.' }
  if (!UUID_RE.test(input.appointmentId)) return { error: 'Invalid booking.' }
  const reason = (input.reason ?? '').trim()
  if (!reason) return { error: 'Please provide a reason for the refund request.' }

  if (!(await canManageBookingTarget(input.appointmentId, input.appointmentId, input.token ?? null))) {
    return { error: 'You are not authorised to request a refund for this booking.' }
  }

  const sb = admin()
  const { data: row, error } = await sb
    .from('appointments')
    .select('id, created_at, appointment_date_time, status, payment_status, payment_provider, payment_bill_id, payable_amount_rm, patient_email, patient_name, treatment_name')
    .eq('id', input.appointmentId)
    .maybeSingle()
  if (error || !row) return { error: 'We could not find this booking.' }

  if (row.status !== 'cancelled') return { error: 'Only cancelled bookings can request a refund.' }
  if (row.payment_status !== 'paid') return { error: 'No payment was made for this booking.' }

  const nowMs = Date.now()
  const apptMs = Date.parse(row.appointment_date_time)
  if (!Number.isFinite(apptMs) || nowMs >= apptMs) {
    return { error: 'The appointment time has passed, so this booking is no longer refundable.' }
  }

  const createdMs = Date.parse(row.created_at)
  const inMistakeWindow = Number.isFinite(createdMs) && nowMs - createdMs <= MISTAKE_WINDOW_MS && nowMs >= createdMs
  const inAdvanceWindow = apptMs - nowMs >= REFUND_ADVANCE_MS
  if (!inMistakeWindow && !inAdvanceWindow) {
    return { error: 'This booking is outside the refundable window.' }
  }

  const amount = Number(row.payable_amount_rm)
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Invalid payable amount.' }

  const provider = row.payment_provider ?? ''
  const idempotencyKey = `booking-refund:${row.id}:full`
  const { error: insertError } = await sb.from('booking_refunds').insert({
    appointment_id: row.id,
    provider,
    amount_rm: amount,
    status: 'requested',
    eligibility_reason: inMistakeWindow ? 'mistake_window' : 'advance_window',
    idempotency_key: idempotencyKey,
    customer_reason: reason,
    bank_code: input.bank?.bankCode.trim() ?? null,
    bank_account_number: input.bank?.accountNumber.trim() ?? null,
    bank_account_holder_name: input.bank?.accountHolderName.trim() ?? null,
    bank_account_last4: input.bank?.accountNumber ? last4(input.bank.accountNumber.trim()) : null,
  })

  if (insertError) {
    if (insertError.code === '23505') return { error: 'A refund request already exists for this booking.' }
    console.error('[refund-request] insert failed:', insertError)
    return { error: 'We could not submit your refund request right now. Please try again.' }
  }

  const status = statusUrl(row.id, input.token)
  await notifyRefundRequested({
    to: row.patient_email,
    name: row.patient_name,
    treatmentName: row.treatment_name,
    amountRm: amount,
    reason,
    statusUrl: status,
  }).catch((e) => console.error('[refund-request] notify failed:', e))

  return { ok: true }
}

export async function approveRefund(refundId: string): Promise<Ok | Err> {
  if (!UUID_RE.test(refundId)) return { error: 'Invalid refund request.' }

  const { db } = await requireStaff(['admin', 'front_desk'])

  const { data: refund, error } = await db
    .from('booking_refunds')
    .select('id, appointment_id, provider, amount_rm, status, idempotency_key, bank_code, bank_account_number, bank_account_holder_name, bank_account_last4')
    .eq('id', refundId)
    .maybeSingle()
  if (error || !refund) return { error: 'Refund request not found.' }
  if (refund.status !== 'requested') return { error: 'This refund request has already been processed.' }

  const { data: appt, error: apptError } = await db
    .from('appointments')
    .select('id, payment_bill_id, patient_email, patient_name, treatment_name')
    .eq('id', refund.appointment_id)
    .maybeSingle()
  if (apptError || !appt) return { error: 'Associated booking not found.' }

  // Claim the refund so only one staff action processes it. The UPDATE's own
  // affected-row count is the source of truth for who won — a separate
  // re-read can't tell "I won" from "someone else won and I'm just observing
  // their write", which let two concurrent approvals both pass this guard.
  const { data: claimedRows, error: claimError } = await db
    .from('booking_refunds')
    .update({ status: 'claimed' })
    .eq('id', refundId)
    .eq('status', 'requested')
    .select('id')
  if (claimError) return { error: claimError.message }
  if (!claimedRows?.length) {
    return { error: 'This refund request was processed by someone else. Please refresh.' }
  }

  try {
    await requestProviderRefund({
      refundId: refund.id,
      billId: appt.payment_bill_id ?? '',
      amountRm: Number(refund.amount_rm),
      idempotencyKey: refund.idempotency_key,
      customerEmail: appt.patient_email ?? '',
      bank:
        refund.bank_code
          ? {
              bankCode: refund.bank_code,
              accountNumber: refund.bank_account_number ?? '',
              accountHolderName: refund.bank_account_holder_name ?? '',
            }
          : undefined,
    })
  } catch (e) {
    console.error('[approve-refund] provider refund failed:', (e as Error)?.message ?? e)
    return { error: 'The refund was approved but the provider request failed. Please review the refund record.' }
  }

  await notifyRefundApproved({
    to: appt.patient_email,
    name: appt.patient_name,
    treatmentName: appt.treatment_name,
    amountRm: Number(refund.amount_rm),
    statusUrl: statusUrl(appt.id),
  }).catch((e) => console.error('[approve-refund] notify failed:', e))

  return { ok: true }
}

export async function rejectRefund(refundId: string, staffReason: string): Promise<Ok | Err> {
  if (!UUID_RE.test(refundId)) return { error: 'Invalid refund request.' }
  const reason = (staffReason ?? '').trim()
  if (!reason) return { error: 'Please provide a reason for declining the refund.' }

  const { db } = await requireStaff(['admin', 'front_desk'])

  const { data: refund, error } = await db
    .from('booking_refunds')
    .select('id, appointment_id, amount_rm, status')
    .eq('id', refundId)
    .maybeSingle()
  if (error || !refund) return { error: 'Refund request not found.' }
  if (refund.status !== 'requested') return { error: 'This refund request has already been processed.' }

  const { data: appt, error: apptError } = await db
    .from('appointments')
    .select('id, patient_email, patient_name, treatment_name')
    .eq('id', refund.appointment_id)
    .maybeSingle()
  if (apptError || !appt) return { error: 'Associated booking not found.' }

  const { data: rejectedRows, error: updateError } = await db
    .from('booking_refunds')
    .update({ status: 'rejected', staff_reason: reason })
    .eq('id', refundId)
    .eq('status', 'requested')
    .select('id')
  if (updateError) return { error: updateError.message }
  if (!rejectedRows?.length) {
    return { error: 'This refund request has already been processed.' }
  }

  await notifyRefundRejected({
    to: appt.patient_email,
    name: appt.patient_name,
    treatmentName: appt.treatment_name,
    amountRm: Number(refund.amount_rm),
    staffReason: reason,
    statusUrl: statusUrl(appt.id),
  }).catch((e) => console.error('[reject-refund] notify failed:', e))

  return { ok: true }
}

export async function getRefundRequestsForAppointment(
  appointmentId: string,
): Promise<RefundRequestRecord[]> {
  const { data, error } = await admin()
    .from('booking_refunds')
    .select(
      'id, appointment_id, status, provider, amount_rm, customer_reason, staff_reason, bank_code, bank_account_number, bank_account_holder_name, bank_account_last4, created_at',
    )
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[refund-request] fetch failed:', error)
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    appointmentId: r.appointment_id,
    status: r.status,
    provider: r.provider,
    amountRm: Number(r.amount_rm),
    customerReason: r.customer_reason ?? null,
    staffReason: r.staff_reason ?? null,
    bankCode: r.bank_code ?? null,
    bankAccountNumber: r.bank_account_number ?? null,
    bankAccountHolderName: r.bank_account_holder_name ?? null,
    bankAccountLast4: r.bank_account_last4 ?? null,
    createdAt: r.created_at,
  }))
}
