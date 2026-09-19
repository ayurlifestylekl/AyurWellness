import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  canManageBookingTarget: vi.fn(),
  createClient: vi.fn(),
  requestProviderRefund: vi.fn(),
  voidBill: vi.fn(),
  notifyManagedCancellation: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }))
vi.mock('../management-access', () => ({
  canManageBookingTarget: mocks.canManageBookingTarget,
}))
vi.mock('@/lib/payments/refund', () => ({
  requestProviderRefund: mocks.requestProviderRefund,
}))
vi.mock('../payment', () => ({ voidBill: mocks.voidBill }))
vi.mock('../notify', () => ({ notifyManagedCancellation: mocks.notifyManagedCancellation }))

import {
  cancelManagedBooking,
  cancellationAppointmentIds,
  refundIdempotencyKey,
  refundStateAfterProvider,
  validateCancellationInput,
  validateCancellationScope,
} from '../cancellation'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260718c_atomic_booking_cancellation.sql',
)
const ANCHOR_ID = '11111111-1111-4111-8111-111111111111'
const TARGET_ID = '22222222-2222-4222-8222-222222222222'
const GROUP_ID = '44444444-4444-4444-8444-444444444444'
const NOW_MS = Date.parse('2026-07-19T09:30:00+08:00')
const ACCOUNT_NUMBER = '1234567890'

type QueryResult = { data: unknown; error: unknown }

function chain(result: QueryResult) {
  const query: Record<string, unknown> = {}
  for (const method of ['select', 'in', 'eq', 'is', 'lte', 'gte', 'lt', 'not']) {
    query[method] = vi.fn(() => query)
  }
  query.maybeSingle = () => Promise.resolve(result)
  query.then = (resolveResult: (value: QueryResult) => unknown) => Promise.resolve(result).then(resolveResult)
  return query
}

function paidRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ANCHOR_ID,
    customer_id: null,
    created_at: '2026-07-18T09:30:00+08:00',
    appointment_date_time: '2026-07-25T09:30:00+08:00',
    status: 'confirmed',
    payment_status: 'paid',
    payment_provider: 'stub',
    payment_bill_id: `stub_${ANCHOR_ID}`,
    payable_amount_rm: 180,
    patient_email: 'guest@example.com',
    patient_name: 'Arun',
    treatment_name: 'Abhyanga',
    group_id: null,
    group_management_active: true,
    ...overrides,
  }
}

function claimResult(overrides: Record<string, unknown> = {}) {
  return {
    refund_required: true,
    appointments: [ANCHOR_ID],
    refunds: [{
      refund_id: 'refund-1',
      appointment_id: ANCHOR_ID,
      provider: 'stub',
      amount_rm: 180,
      idempotency_key: `booking-refund:${ANCHOR_ID}:full`,
      bill_id: `stub_${ANCHOR_ID}`,
      customer_email: 'guest@example.com',
    }],
    unpaid_bills: [],
    ...overrides,
  }
}

function actionDb(
  rows: ReturnType<typeof paidRow>[] = [paidRow()],
  claim: unknown = claimResult(),
  rpcError: unknown = null,
  groupRows?: { id: string }[],
) {
  let appointmentQueries = 0
  const rpc = vi.fn().mockResolvedValue({ data: claim, error: rpcError })
  const from = vi.fn((table: string) => {
    if (table === 'appointments') {
      appointmentQueries += 1
      if (appointmentQueries === 1) return chain({ data: rows, error: null })
      if (appointmentQueries === 2 && groupRows) return chain({ data: groupRows, error: null })
      return chain({ data: [], error: null })
    }
    throw new Error(`unexpected table: ${table}`)
  })
  return { client: { from, rpc }, rpc }
}

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    anchorId: ANCHOR_ID,
    appointmentIds: [ANCHOR_ID],
    token: null,
    wholeGroup: false,
    ...overrides,
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  mocks.createClient.mockReset()
  mocks.canManageBookingTarget.mockReset()
  mocks.requestProviderRefund.mockReset()
  mocks.voidBill.mockReset()
  mocks.notifyManagedCancellation.mockReset()
  mocks.requestProviderRefund.mockResolvedValue({ providerRefundId: 'stub_refund_x', status: 'confirmed' })
  mocks.voidBill.mockResolvedValue(undefined)
  mocks.notifyManagedCancellation.mockResolvedValue(undefined)
})

describe('cancellation pure helpers', () => {
  it('requires bank details only for eligible paid FPX cancellation', () => {
    expect(validateCancellationInput({ provider: 'billplz', paid: true, refundEligible: true, bank: undefined }))
      .toEqual({ error: 'Bank details are required for an FPX refund.' })
    expect(validateCancellationInput({ provider: 'stripe', paid: true, refundEligible: true, bank: undefined }))
      .toEqual({ ok: true })
  })

  it('does not require bank details for an unpaid or ineligible cancellation', () => {
    expect(validateCancellationInput({ provider: 'billplz', paid: false, refundEligible: false, bank: undefined }))
      .toEqual({ ok: true })
    expect(validateCancellationInput({ provider: 'billplz', paid: true, refundEligible: false, bank: undefined }))
      .toEqual({ ok: true })
  })

  it('uses one deterministic refund claim per appointment', () => {
    expect(refundIdempotencyKey('appointment-a')).toBe('booking-refund:appointment-a:full')
  })

  it('never treats a provider exception as refunded', () => {
    expect(refundStateAfterProvider({ status: 'exception' })).toEqual({ refundStatus: 'exception', paymentStatus: 'paid' })
    expect(refundStateAfterProvider({ status: 'pending' })).toEqual({ refundStatus: 'pending', paymentStatus: 'paid' })
    expect(refundStateAfterProvider({ status: 'confirmed' })).toEqual({ refundStatus: 'confirmed', paymentStatus: 'refunded' })
  })

  it('cancels one active group member without selecting siblings', () => {
    const groupRows = [
      { id: 'a', group_management_active: true },
      { id: 'b', group_management_active: true },
    ]
    expect(cancellationAppointmentIds(groupRows, { memberId: 'a' })).toEqual(['a'])
    expect(cancellationAppointmentIds(groupRows, { wholeGroup: true })).toEqual(['a', 'b'])
  })

  it('rejects an individual subset and a whole group missing the anchor', () => {
    expect(validateCancellationScope({ anchorId: ANCHOR_ID, appointmentIds: [ANCHOR_ID], wholeGroup: false }))
      .toEqual({ ok: true, appointmentIds: [ANCHOR_ID] })
    expect(validateCancellationScope({ anchorId: ANCHOR_ID, appointmentIds: [ANCHOR_ID, TARGET_ID], wholeGroup: false }))
      .toEqual({ error: 'Choose either this booking or the whole active group.' })
    expect(validateCancellationScope({ anchorId: ANCHOR_ID, appointmentIds: [TARGET_ID], wholeGroup: true }))
      .toEqual({ error: 'The managed booking must be included in the cancellation.' })
    expect(validateCancellationScope({ anchorId: ANCHOR_ID, appointmentIds: [ANCHOR_ID, ANCHOR_ID], wholeGroup: true }))
      .toEqual({ error: 'Duplicate appointments cannot be cancelled.' })
  })
})

describe('cancelManagedBooking action', () => {
  it.each([
    ['malformed ID', validInput({ anchorId: 'not-a-uuid' })],
    ['duplicate IDs', validInput({ appointmentIds: [ANCHOR_ID, ANCHOR_ID] })],
    ['individual extra target', validInput({ appointmentIds: [ANCHOR_ID, TARGET_ID] })],
    ['non-string token', validInput({ token: { forged: true } })],
    ['non-boolean wholeGroup', validInput({ wholeGroup: 'yes' })],
  ])('rejects %s before token authorization', async (_label, input) => {
    const result = await cancelManagedBooking(input as never)
    expect(result).toMatchObject({ code: 'INVALID_INPUT' })
    expect(mocks.canManageBookingTarget).not.toHaveBeenCalled()
    expect(mocks.createClient).not.toHaveBeenCalled()
  })

  it('returns UNAUTHORIZED and never creates an RPC client when anchor access fails', async () => {
    mocks.canManageBookingTarget.mockResolvedValue(false)
    const result = await cancelManagedBooking(validInput())
    expect(result).toMatchObject({ code: 'UNAUTHORIZED' })
    expect(mocks.canManageBookingTarget).toHaveBeenCalledWith(ANCHOR_ID, ANCHOR_ID, null)
    expect(mocks.createClient).not.toHaveBeenCalled()
  })

  it('authorizes every target and stops before the RPC when one group member fails', async () => {
    mocks.canManageBookingTarget
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
    const rows = [
      paidRow({ group_id: GROUP_ID }),
      paidRow({ id: TARGET_ID, group_id: GROUP_ID }),
    ]
    const db = actionDb(rows, claimResult(), null, [{ id: ANCHOR_ID }, { id: TARGET_ID }])
    mocks.createClient.mockReturnValue(db.client)
    const result = await cancelManagedBooking(validInput({
      appointmentIds: [ANCHOR_ID, TARGET_ID],
      wholeGroup: true,
    }))
    expect(result).toMatchObject({ code: 'UNAUTHORIZED' })
    expect(db.rpc).not.toHaveBeenCalled()
  })

  it('requires whole-group scope to equal the active database membership', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW_MS)
    mocks.canManageBookingTarget.mockResolvedValue(true)
    const rows = [
      paidRow({ group_id: GROUP_ID }),
      paidRow({ id: TARGET_ID, group_id: GROUP_ID }),
    ]
    const db = actionDb(rows, claimResult(), null, [{ id: ANCHOR_ID }])
    mocks.createClient.mockReturnValue(db.client)
    const result = await cancelManagedBooking(validInput({
      appointmentIds: [ANCHOR_ID, TARGET_ID],
      wholeGroup: true,
    }))
    expect(result).toMatchObject({ code: 'INVALID_INPUT' })
    expect(db.rpc).not.toHaveBeenCalled()
  })

  it('does not call the RPC when policy makes the booking ineligible to cancel', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW_MS)
    mocks.canManageBookingTarget.mockResolvedValue(true)
    const db = actionDb([paidRow({ status: 'completed' })])
    mocks.createClient.mockReturnValue(db.client)
    const result = await cancelManagedBooking(validInput())
    expect(result).toMatchObject({ code: 'POLICY_CLOSED' })
    expect(db.rpc).not.toHaveBeenCalled()
    expect(mocks.requestProviderRefund).not.toHaveBeenCalled()
  })

  it('requires bank details for an eligible paid Billplz cancellation before the RPC', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW_MS)
    mocks.canManageBookingTarget.mockResolvedValue(true)
    const db = actionDb([paidRow({ payment_provider: 'billplz', payment_bill_id: 'bill-1' })])
    mocks.createClient.mockReturnValue(db.client)
    const result = await cancelManagedBooking(validInput())
    expect(result).toMatchObject({ code: 'INVALID_INPUT', error: 'Bank details are required for an FPX refund.' })
    expect(db.rpc).not.toHaveBeenCalled()
  })

  it('requests each claimed provider refund with RPC-authoritative metadata and no bank to Stripe', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW_MS)
    mocks.canManageBookingTarget.mockResolvedValue(true)
    const db = actionDb()
    mocks.createClient.mockReturnValue(db.client)
    const result = await cancelManagedBooking(validInput())
    expect(result).toMatchObject({ ok: true })
    expect(db.rpc).toHaveBeenCalledWith('claim_booking_cancellation', expect.objectContaining({
      p_appointment_ids: [ANCHOR_ID],
    }))
    expect(mocks.requestProviderRefund).toHaveBeenCalledWith(expect.objectContaining({
      refundId: 'refund-1',
      billId: `stub_${ANCHOR_ID}`,
      amountRm: 180,
      idempotencyKey: `booking-refund:${ANCHOR_ID}:full`,
      customerEmail: 'guest@example.com',
      bank: undefined,
    }), ...([] as never[]))
    expect(mocks.voidBill).not.toHaveBeenCalled()
  })

  it('passes the FPX bank recipient only to Billplz rows and never to the RPC', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW_MS)
    mocks.canManageBookingTarget.mockResolvedValue(true)
    const db = actionDb(
      [paidRow({ payment_provider: 'billplz', payment_bill_id: 'bill-1' })],
      claimResult({ refunds: [{
        refund_id: 'refund-1',
        appointment_id: ANCHOR_ID,
        provider: 'billplz',
        amount_rm: 180,
        idempotency_key: `booking-refund:${ANCHOR_ID}:full`,
        bill_id: 'bill-1',
        customer_email: 'guest@example.com',
      }] }),
    )
    mocks.createClient.mockReturnValue(db.client)
    const bank = { bankCode: 'MBBEMYKL', accountNumber: ACCOUNT_NUMBER, accountHolderName: 'Arun Kumar' }
    const result = await cancelManagedBooking(validInput({ bank }))
    expect(result).toMatchObject({ ok: true })
    expect(mocks.requestProviderRefund).toHaveBeenCalledWith(expect.objectContaining({ bank }), ...([] as never[]))
    // The raw account number must never reach the RPC arguments.
    expect(JSON.stringify(db.rpc.mock.calls)).not.toContain(ACCOUNT_NUMBER)
  })

  it('voids deduplicated unpaid bills and never requests a refund', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW_MS)
    mocks.canManageBookingTarget.mockResolvedValue(true)
    const db = actionDb(
      [paidRow({ payment_status: 'unpaid', payment_bill_id: 'bill-1' })],
      claimResult({ refund_required: false, refunds: [], unpaid_bills: [{ bill_id: 'bill-1', provider: 'stub' }] }),
    )
    mocks.createClient.mockReturnValue(db.client)
    const result = await cancelManagedBooking(validInput())
    expect(result).toMatchObject({ ok: true })
    expect(mocks.voidBill).toHaveBeenCalledWith('bill-1', 'stub')
    expect(mocks.requestProviderRefund).not.toHaveBeenCalled()
  })

  it('keeps a committed cancellation when the provider refund throws', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW_MS)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocks.canManageBookingTarget.mockResolvedValue(true)
    mocks.requestProviderRefund.mockRejectedValue(new Error('provider outcome pending'))
    const db = actionDb()
    mocks.createClient.mockReturnValue(db.client)
    const result = await cancelManagedBooking(validInput())
    expect(result).toMatchObject({ ok: true })
    if (!('ok' in result)) throw new Error('expected success')
    expect(result.data.refunds).toEqual([{ appointmentId: ANCHOR_ID, refundStatus: 'exception' }])
  })

  it.each([
    ['POLICY_CLOSED: window closed', 'POLICY_CLOSED'],
    ['INVALID_INPUT: booking changed', 'INVALID_INPUT'],
    ['unexpected database failure', 'PROVIDER_ERROR'],
  ] as const)('maps RPC error %s to stable %s', async (message, code) => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW_MS)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocks.canManageBookingTarget.mockResolvedValue(true)
    const db = actionDb([paidRow()], null, { message, code: 'P0001' })
    mocks.createClient.mockReturnValue(db.client)
    const result = await cancelManagedBooking(validInput())
    expect(result).toMatchObject({ code })
    expect(mocks.requestProviderRefund).not.toHaveBeenCalled()
  })
})

describe('atomic cancellation migration', () => {
  const sql = readFileSync(migrationPath, 'utf8')

  it('locks sorted target rows for update before sampling database time', () => {
    expect(sql).toMatch(/order by\s+a\.id[\s\S]*for update/i)
    const clock = sql.indexOf('clock_timestamp()')
    const forUpdate = sql.toLowerCase().indexOf('for update')
    expect(forUpdate).toBeLessThan(clock)
  })

  it('never marks payment refunded inside the claim RPC', () => {
    const claim = sql.slice(
      sql.indexOf('function public.claim_booking_cancellation'),
      sql.indexOf('function public.sync_appointment_after_refund'),
    )
    expect(claim).not.toMatch(/payment_status\s*=\s*'refunded'/i)
    expect(claim).toMatch(/status\s*=\s*'cancelled'/i)
  })

  it('claims exactly one refund per paid appointment with the deterministic key', () => {
    expect(sql).toContain('insert into public.booking_refunds')
    expect(sql).toContain("'claimed'")
    expect(sql).toContain("'booking-refund:' || ")
    expect(sql).toContain(':full')
  })

  it('writes cancellation and refund_requested audit events in the same transaction', () => {
    expect(sql).toContain("'cancelled'")
    expect(sql).toContain("'refund_requested'")
    expect(sql).toContain("'group_detached'")
  })

  it('synchronizes appointment payment only on a confirmed refund transition, once', () => {
    const trigger = sql.slice(sql.indexOf('function public.sync_appointment_after_refund'))
    expect(trigger).toMatch(/old\.status is distinct from new\.status/i)
    expect(trigger).toMatch(/new\.status\s*=\s*'confirmed'[\s\S]*payment_status\s*=\s*'refunded'/i)
    expect(trigger).toContain("'refund_confirmed'")
    expect(trigger).toContain("'refund_failed'")
    expect(sql).toMatch(/create trigger[\s\S]*after update on public\.booking_refunds/i)
  })

  it('exposes the fixed-search-path claim RPC to the service role only', () => {
    expect(sql).toMatch(/security definer[\s\S]*set search_path = public, pg_temp/i)
    expect(sql).toContain('revoke all on function public.claim_booking_cancellation(uuid[], timestamptz, text) from public, anon, authenticated')
    expect(sql).toContain('grant execute on function public.claim_booking_cancellation(uuid[], timestamptz, text) to service_role')
  })
})
