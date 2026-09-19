
import { createClient } from '@supabase/supabase-js'

import type { ManagementActionResult } from './management-actions'
import { managementEligibility } from './management-policy'
import { activeManagementMembers } from './group-management'
import { voidBill } from './payment'
import { notifyManagedCancellation } from './notify'
import type { RefundArgs } from '@/lib/payments/provider'

export interface CancelManagedBookingInput {
  anchorId: string
  appointmentIds: string[]
  token?: string | null
  wholeGroup: boolean
  bank?: { bankCode: string; accountNumber: string; accountHolderName: string }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// ---------------------------------------------------------------------------
// Pure helpers (tested independently)
// ---------------------------------------------------------------------------

export function validateCancellationInput(input: {
  provider: string | null | undefined
  paid: boolean
  refundEligible: boolean
  bank: CancelManagedBookingInput['bank'] | undefined
}): { ok: true } | { error: string } {
  if (input.paid && input.refundEligible && input.provider === 'billplz' && !input.bank) {
    return { error: 'Bank details are required for an FPX refund.' }
  }
  return { ok: true }
}

export function refundIdempotencyKey(appointmentId: string): string {
  return `booking-refund:${appointmentId}:full`
}

export function refundStateAfterProvider(result: { status: string }): {
  refundStatus: string
  paymentStatus: 'paid' | 'refunded'
} {
  const refundStatus = result.status
  const paymentStatus = refundStatus === 'confirmed' ? 'refunded' : 'paid'
  return { refundStatus, paymentStatus }
}

export function cancellationAppointmentIds(
  groupRows: { id: string; group_management_active?: boolean | null }[],
  options: { memberId?: string; wholeGroup?: boolean } = {},
): string[] {
  const active = activeManagementMembers(groupRows)
  if (options.wholeGroup) return active.map((r) => r.id)
  if (options.memberId) {
    const row = active.find((r) => r.id === options.memberId)
    return row ? [row.id] : []
  }
  return []
}

export function validateCancellationScope(input: {
  anchorId: string
  appointmentIds: string[]
  wholeGroup: boolean
}): { ok: true; appointmentIds: string[] } | { error: string } {
  if (input.appointmentIds.length === 0) return { error: 'Choose at least one booking to cancel.' }
  if (new Set(input.appointmentIds).size !== input.appointmentIds.length) {
    return { error: 'Duplicate appointments cannot be cancelled.' }
  }
  if (input.wholeGroup && !input.appointmentIds.includes(input.anchorId)) {
    return { error: 'The managed booking must be included in the cancellation.' }
  }
  if (!input.wholeGroup && input.appointmentIds.length !== 1) {
    return { error: 'Choose either this booking or the whole active group.' }
  }
  return { ok: true, appointmentIds: [...input.appointmentIds] }
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type AppointmentRow = {
  id: string
  customer_id: string | null
  created_at: string
  appointment_date_time: string
  status: string
  payment_status: string
  payment_provider: string | null
  payment_bill_id: string | null
  payable_amount_rm: number | null
  patient_email: string | null
  patient_name: string | null
  treatment_name: string | null
  group_id: string | null
  group_management_active: boolean | null
}

type ClaimRefundRow = {
  refund_id: string
  appointment_id: string
  provider: string
  amount_rm: number
  idempotency_key: string
  bill_id: string | null
  customer_email: string | null
}

type ClaimUnpaidBill = {
  bill_id: string
  provider: string
}

type ClaimResult = {
  refund_required: boolean
  appointments: string[]
  refunds: ClaimRefundRow[]
  unpaid_bills: ClaimUnpaidBill[]
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

type ManagementError = {
  error: string
  code: 'UNAUTHORIZED' | 'POLICY_CLOSED' | 'SLOT_FULL' | 'INVALID_INPUT' | 'PROVIDER_ERROR'
}

function fail(code: ManagementError['code'], error: string): ManagementError {
  return { code, error }
}

function exactIdSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false
  const ls = [...left].sort()
  const rs = [...right].sort()
  return ls.every((id, i) => id === rs[i])
}

// ---------------------------------------------------------------------------
// Server action
// ---------------------------------------------------------------------------

export async function cancelManagedBooking(
  input: CancelManagedBookingInput,
): Promise<ManagementActionResult<{
  appointmentIds: string[]
  refunds: { appointmentId: string; refundStatus: string }[]
}>> {
  'use server'

  // ── Structural validation (before any auth or DB call) ────────────────────
  if (!input || typeof input !== 'object') return fail('INVALID_INPUT', 'Invalid cancellation input.')
  if (!UUID_RE.test(input.anchorId)) return fail('INVALID_INPUT', 'Choose a valid booking to cancel.')
  if (!Array.isArray(input.appointmentIds) || input.appointmentIds.some((id) => typeof id !== 'string' || !UUID_RE.test(id))) {
    return fail('INVALID_INPUT', 'Choose at least one valid booking to cancel.')
  }
  if (typeof input.wholeGroup !== 'boolean') return fail('INVALID_INPUT', 'Invalid cancellation scope.')
  if (input.token != null && typeof input.token !== 'string') {
    return fail('INVALID_INPUT', 'The booking access token is invalid.')
  }

  const scope = validateCancellationScope(input)
  if ('error' in scope) return fail('INVALID_INPUT', scope.error)
  const appointmentIds = scope.appointmentIds

  // ── Authorization ─────────────────────────────────────────────────────────
  const { canManageBookingTarget } = await import('./management-access')
  if (!(await canManageBookingTarget(input.anchorId, input.anchorId, input.token))) {
    return fail('UNAUTHORIZED', 'You are not authorised to cancel this booking.')
  }

  const sb = admin()

  // ── Load rows for policy and provider check ───────────────────────────────
  const { data, error } = await sb
    .from('appointments')
    .select('id, customer_id, created_at, appointment_date_time, status, payment_status, payment_provider, payment_bill_id, payable_amount_rm, patient_email, patient_name, treatment_name, group_id, group_management_active')
    .in('id', appointmentIds)
  if (error) return fail('PROVIDER_ERROR', 'We could not check this booking right now. Please try again.')
  const rows = (data ?? []) as AppointmentRow[]
  if (rows.length !== appointmentIds.length) {
    return fail('INVALID_INPUT', 'One of the selected bookings no longer exists.')
  }

  // Authorize every target
  for (const id of appointmentIds) {
    if (!(await canManageBookingTarget(input.anchorId, id, input.token))) {
      return fail('UNAUTHORIZED', 'You are not authorised to cancel one of these bookings.')
    }
  }

  // Verify whole-group scope matches the active DB membership
  if (input.wholeGroup) {
    const anchor = rows.find((r) => r.id === input.anchorId)!
    if (anchor.group_id) {
      const { data: groupRows, error: groupError } = await sb
        .from('appointments')
        .select('id')
        .eq('group_id', anchor.group_id)
        .eq('group_management_active', true)
      if (groupError) return fail('PROVIDER_ERROR', 'We could not check the booking group right now.')
      if (!exactIdSet((groupRows ?? []).map((r) => r.id), appointmentIds)) {
        return fail('INVALID_INPUT', 'Select every active group member to cancel the whole group.')
      }
    }
  }

  // Policy check per row + provider/bank validation
  const nowMs = Date.now()
  const nowISO = new Date(nowMs).toISOString()

  for (const row of rows) {
    const policy = managementEligibility({
      createdAt: row.created_at,
      appointmentAt: row.appointment_date_time,
      status: row.status,
      paymentStatus: row.payment_status,
      nowMs,
    })
    if (!policy.canCancel) return fail('POLICY_CLOSED', 'The online cancellation window is closed for this booking.')

    // Validate bank details before the RPC — don't allow paid Billplz without them
    const inputValidation = validateCancellationInput({
      provider: row.payment_provider,
      paid: row.payment_status === 'paid',
      refundEligible: policy.refundEligibility !== 'not_paid' && policy.refundEligibility !== 'not_eligible',
      bank: input.bank,
    })
    if ('error' in inputValidation) return fail('INVALID_INPUT', inputValidation.error)
  }

  // ── Call the atomic claim RPC ─────────────────────────────────────────────
  const actorType = input.token ? 'guest' : 'customer'
  const { data: claimData, error: rpcError } = await sb.rpc('claim_booking_cancellation', {
    p_appointment_ids: appointmentIds,
    p_now: nowISO,
    p_actor_type: actorType,
  })
  if (rpcError) {
    if (/POLICY_CLOSED/i.test(rpcError.message)) {
      return fail('POLICY_CLOSED', 'The online cancellation window has closed.')
    }
    if (/INVALID_INPUT/i.test(rpcError.message)) {
      return fail('INVALID_INPUT', 'The booking changed while you were cancelling. Please review it and try again.')
    }
    console.error('[booking-cancel] atomic RPC failed:', rpcError.code ?? 'unknown')
    return fail('PROVIDER_ERROR', 'We could not cancel the booking right now. No changes were made.')
  }

  const claim = claimData as ClaimResult

  // ── Post-commit: void deduplicated unpaid bills ───────────────────────────
  const unpaidBills = Array.isArray(claim.unpaid_bills) ? claim.unpaid_bills : []
  for (const bill of unpaidBills) {
    await voidBill(bill.bill_id, bill.provider || null).catch((e) => {
      console.error('[booking-cancel] voidBill failed:', e)
    })
  }

  // ── Post-commit: request provider refunds using only RPC-authoritative data ─
  const refundResults: { appointmentId: string; refundStatus: string }[] = []
  const claimedRefunds: ClaimRefundRow[] = Array.isArray(claim.refunds) ? claim.refunds : []

  for (const refundRow of claimedRefunds) {
    // Only pass bank details to Billplz rows; never to Stripe or other providers.
    const bankForProvider: RefundArgs['bank'] | undefined =
      refundRow.provider === 'billplz' ? input.bank : undefined

    try {
      const { requestProviderRefund } = await import('@/lib/payments/refund')
      const result = await requestProviderRefund({
        refundId: refundRow.refund_id,
        billId: refundRow.bill_id ?? '',
        amountRm: refundRow.amount_rm,
        idempotencyKey: refundRow.idempotency_key,
        customerEmail: refundRow.customer_email ?? '',
        bank: bankForProvider,
      })
      refundResults.push({ appointmentId: refundRow.appointment_id, refundStatus: result.status })
    } catch (e) {
      console.error('[booking-cancel] requestProviderRefund failed for', refundRow.appointment_id, (e as Error)?.message ?? 'unknown')
      refundResults.push({ appointmentId: refundRow.appointment_id, refundStatus: 'exception' })
    }
  }

  // ── Notification (best-effort, never rolls back cancellation) ─────────────
  const lead = rows.find((r) => r.id === input.anchorId) ?? rows[0]
  await notifyManagedCancellation({
    to: lead?.patient_email,
    name: lead?.patient_name,
    treatmentName: lead?.treatment_name,
    refundRequired: claim.refund_required,
    refundResults,
  }).catch((e) => {
    console.error('[booking-cancel] notifyManagedCancellation failed:', e)
  })

  return {
    ok: true,
    data: {
      appointmentIds: Array.isArray(claim.appointments) ? claim.appointments : appointmentIds,
      refunds: refundResults,
    },
  }
}
