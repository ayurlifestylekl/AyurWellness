import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireStaff: vi.fn(),
  requestProviderRefund: vi.fn(),
  notifyRefundRequested: vi.fn(),
  notifyRefundApproved: vi.fn(),
  notifyRefundRejected: vi.fn(),
}))

vi.mock('@/lib/staff/guard', () => ({ requireStaff: mocks.requireStaff }))
vi.mock('@/lib/payments/refund', () => ({ requestProviderRefund: mocks.requestProviderRefund }))
vi.mock('../notify', () => ({
  notifyRefundRequested: mocks.notifyRefundRequested,
  notifyRefundApproved: mocks.notifyRefundApproved,
  notifyRefundRejected: mocks.notifyRefundRejected,
  BOOKING_SITE_URL: 'https://example.test',
}))

import { approveRefund, rejectRefund } from '../refund-request'

const REFUND_ID = '11111111-1111-4111-8111-111111111111'
const APPOINTMENT_ID = '22222222-2222-4222-8222-222222222222'

interface FakeState {
  refundStatus: 'requested' | 'claimed' | 'confirmed' | 'rejected'
}

type QueryResult = { data: unknown; error: unknown }

interface Builder {
  select(cols?: string): Builder
  eq(col: string, val: unknown): Builder
  update(patch: Record<string, unknown>): Builder
  maybeSingle(): Promise<QueryResult>
  then(resolve: (v: QueryResult) => unknown): Promise<unknown>
}

function fakeDb(state: FakeState) {
  function refundsTable(): Builder {
    const filters: Record<string, unknown> = {}
    let updatePatch: Record<string, unknown> | null = null
    function readOne(): QueryResult {
      return {
        data: {
          id: REFUND_ID,
          appointment_id: APPOINTMENT_ID,
          provider: 'hitpay',
          amount_rm: 150,
          status: state.refundStatus,
          idempotency_key: `booking-refund:${APPOINTMENT_ID}:full`,
          bank_code: null,
          bank_account_number: null,
          bank_account_holder_name: null,
          bank_account_last4: null,
        },
        error: null,
      }
    }
    function resolveMutation(): QueryResult {
      if (!updatePatch) return readOne()
      const matches = (filters.id === undefined || filters.id === REFUND_ID)
        && (filters.status === undefined || filters.status === state.refundStatus)
      if (matches) state.refundStatus = updatePatch.status as FakeState['refundStatus']
      return matches ? { data: [{ id: REFUND_ID }], error: null } : { data: [], error: null }
    }
    const builder: Builder = {
      select: () => builder,
      eq: (col, val) => { filters[col] = val; return builder },
      update: (patch) => { updatePatch = patch; return builder },
      maybeSingle: () => Promise.resolve(readOne()),
      then: (resolve) => Promise.resolve(resolveMutation()).then(resolve),
    }
    return builder
  }

  function appointmentsTable(): Builder {
    const result: QueryResult = {
      data: {
        id: APPOINTMENT_ID,
        payment_bill_id: 'bill_123',
        patient_email: 'guest@example.com',
        patient_name: 'Arun',
        treatment_name: 'Abhyanga',
      },
      error: null,
    }
    const builder: Builder = {
      select: () => builder,
      eq: () => builder,
      update: () => builder,
      maybeSingle: () => Promise.resolve(result),
      then: (resolve) => Promise.resolve(result).then(resolve),
    }
    return builder
  }

  return {
    from: vi.fn((table: string) => {
      if (table === 'booking_refunds') return refundsTable()
      if (table === 'appointments') return appointmentsTable()
      throw new Error(`unexpected table: ${table}`)
    }),
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  mocks.requireStaff.mockReset()
  mocks.requestProviderRefund.mockReset().mockResolvedValue({ providerRefundId: 'pe_123', status: 'pending' })
  mocks.notifyRefundApproved.mockReset().mockResolvedValue(undefined)
  mocks.notifyRefundRejected.mockReset().mockResolvedValue(undefined)
})

describe('approveRefund — double-approval race', () => {
  it('claims the row atomically: a second concurrent approve is rejected and never notifies the customer twice', async () => {
    const state: FakeState = { refundStatus: 'requested' }
    mocks.requireStaff.mockResolvedValue({ userId: 'staff-a', role: 'admin', db: fakeDb(state) })

    const [first, second] = await Promise.all([approveRefund(REFUND_ID), approveRefund(REFUND_ID)])

    const results = [first, second]
    expect(results.filter((r) => 'ok' in r)).toHaveLength(1)
    expect(results.filter((r) => 'error' in r)).toHaveLength(1)
    expect(mocks.requestProviderRefund).toHaveBeenCalledTimes(1)
    expect(mocks.notifyRefundApproved).toHaveBeenCalledTimes(1)
  })

  it('rejects outright when the refund is no longer requested', async () => {
    const state: FakeState = { refundStatus: 'claimed' }
    mocks.requireStaff.mockResolvedValue({ userId: 'staff-a', role: 'admin', db: fakeDb(state) })

    const result = await approveRefund(REFUND_ID)
    expect('error' in result).toBe(true)
    expect(mocks.requestProviderRefund).not.toHaveBeenCalled()
  })
})

describe('rejectRefund — cannot silently no-op', () => {
  it('reports failure instead of false success when the row was already claimed by an approval', async () => {
    const state: FakeState = { refundStatus: 'claimed' }
    mocks.requireStaff.mockResolvedValue({ userId: 'staff-b', role: 'front_desk', db: fakeDb(state) })

    const result = await rejectRefund(REFUND_ID, 'Changed my mind')
    expect('error' in result).toBe(true)
    expect(mocks.notifyRefundRejected).not.toHaveBeenCalled()
    expect(state.refundStatus).toBe('claimed')
  })

  it('succeeds and notifies once when the row is genuinely still requested', async () => {
    const state: FakeState = { refundStatus: 'requested' }
    mocks.requireStaff.mockResolvedValue({ userId: 'staff-b', role: 'front_desk', db: fakeDb(state) })

    const result = await rejectRefund(REFUND_ID, 'Changed my mind')
    expect('ok' in result).toBe(true)
    expect(mocks.notifyRefundRejected).toHaveBeenCalledTimes(1)
    expect(state.refundStatus).toBe('rejected')
  })
})
