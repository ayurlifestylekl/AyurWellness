import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getCurrentUser: vi.fn(),
  getProviderByName: vi.fn(),
  requestProviderRefund: vi.fn(),
  productRefundDependencies: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/auth/getCurrentUser', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/lib/payments', () => ({ getProviderByName: mocks.getProviderByName }))
vi.mock('@/lib/payments/refund', () => ({
  requestProviderRefund: mocks.requestProviderRefund,
  productRefundDependencies: mocks.productRefundDependencies,
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { approveProductCancellation } from '../actions'

const ORDER_ID = '22222222-2222-4222-8222-222222222222'
const CANCELLATION_ID = '33333333-3333-4333-8333-333333333333'

type QueryResult = { data: unknown; error: unknown }

interface Builder {
  select(cols?: string): Builder
  eq(col: string, val: unknown): Builder
  update(patch: Record<string, unknown>): Builder
  insert(patch: Record<string, unknown>): Builder
  maybeSingle(): Promise<QueryResult>
  single(): Promise<QueryResult>
  then(resolve: (v: QueryResult) => unknown): Promise<unknown>
}

interface FakeState {
  cancellationStatus: 'requested' | 'processing' | 'approved' | 'rejected'
  refundRow: { id: string; status: string; idempotency_key: string | null; failure_reason?: string | null } | null
  restoreStockCalls: number
  orderUpdate: Record<string, unknown> | null
}

function fakeSupabase(state: FakeState, orderOverrides: Record<string, unknown> = {}) {
  const order = {
    id: ORDER_ID,
    status: 'paid',
    payment_status: 'paid',
    total_rm: 150,
    email: 'guest@example.com',
    provider_bill_id: 'bill_123',
    payment_provider: 'hitpay',
    ...orderOverrides,
  }

  function cancellationsTable(): Builder {
    const filters: Record<string, unknown> = {}
    let updatePatch: Record<string, unknown> | null = null
    function readOne(): QueryResult {
      if (filters.id !== CANCELLATION_ID) return { data: null, error: null }
      return { data: { id: CANCELLATION_ID, status: state.cancellationStatus, product_orders: order }, error: null }
    }
    function resolveQuery(): QueryResult {
      if (updatePatch) {
        const matches = filters.id === CANCELLATION_ID
          && (filters.status === undefined || filters.status === state.cancellationStatus)
        if (matches) state.cancellationStatus = updatePatch.status as FakeState['cancellationStatus']
        return matches ? { data: [{ id: CANCELLATION_ID }], error: null } : { data: [], error: null }
      }
      return readOne()
    }
    const builder: Builder = {
      select: () => builder,
      eq: (col, val) => { filters[col] = val; return builder },
      update: (patch) => { updatePatch = patch; return builder },
      insert: () => builder,
      maybeSingle: () => Promise.resolve(readOne()),
      single: () => Promise.resolve(readOne()),
      then: (resolve) => Promise.resolve(resolveQuery()).then(resolve),
    }
    return builder
  }

  function refundRequestsTable(): Builder {
    const filters: Record<string, unknown> = {}
    let mode: 'select' | 'update' | 'insert' = 'select'
    let payload: Record<string, unknown> | null = null
    function runSelect(): QueryResult {
      if (!state.refundRow || filters.product_order_id !== ORDER_ID) return { data: null, error: null }
      return { data: { id: state.refundRow.id, idempotency_key: state.refundRow.idempotency_key }, error: null }
    }
    function runMutation(): QueryResult {
      if (mode === 'insert' && payload) {
        state.refundRow = { id: 'refund-1', status: 'requested', idempotency_key: payload.idempotency_key as string }
        return { data: { id: state.refundRow.id, idempotency_key: state.refundRow.idempotency_key }, error: null }
      }
      if (mode === 'update' && payload) {
        if (!state.refundRow) return { data: [], error: null }
        const matches = (filters.id === undefined || filters.id === state.refundRow.id)
          && (filters.status === undefined || filters.status === state.refundRow.status)
        if (matches) {
          state.refundRow.status = (payload.status as string | undefined) ?? state.refundRow.status
          if ('failure_reason' in payload) state.refundRow.failure_reason = payload.failure_reason as string | null
        }
        return matches ? { data: [{ id: state.refundRow.id }], error: null } : { data: [], error: null }
      }
      return runSelect()
    }
    const builder: Builder = {
      select: () => builder,
      eq: (col, val) => { filters[col] = val; return builder },
      update: (patch) => { mode = 'update'; payload = patch; return builder },
      insert: (patch) => { mode = 'insert'; payload = patch; return builder },
      maybeSingle: () => Promise.resolve(runSelect()),
      single: () => Promise.resolve(runMutation()),
      then: (resolve) => Promise.resolve(runMutation()).then(resolve),
    }
    return builder
  }

  function ordersTable(): Builder {
    const builder: Builder = {
      select: () => builder,
      eq: () => builder,
      update: (patch) => { state.orderUpdate = patch; return builder },
      insert: () => builder,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
      then: (resolve) => Promise.resolve({ data: null, error: null } as QueryResult).then(resolve),
    }
    return builder
  }

  const from = vi.fn((table: string) => {
    if (table === 'product_cancellations') return cancellationsTable()
    if (table === 'product_refund_requests') return refundRequestsTable()
    if (table === 'product_orders') return ordersTable()
    throw new Error(`unexpected table: ${table}`)
  })
  const rpc = vi.fn((fn: string) => {
    if (fn === 'restore_stock_for_product_order') state.restoreStockCalls += 1
    return Promise.resolve({ data: null, error: null })
  })
  return { from, rpc }
}

beforeEach(() => {
  vi.restoreAllMocks()
  mocks.createClient.mockReset()
  mocks.getCurrentUser.mockReset().mockResolvedValue({ authId: 'staff-1', role: 'product_manager' })
  mocks.getProviderByName.mockReset().mockReturnValue({ deleteBill: vi.fn() })
  mocks.requestProviderRefund.mockReset().mockResolvedValue({ providerRefundId: 'pe_123', status: 'pending' })
  mocks.productRefundDependencies.mockReset().mockReturnValue({})
})

describe('approveProductCancellation — double-approval race', () => {
  it('claims the cancellation atomically: a second concurrent approve is rejected before touching stock or the refund provider', async () => {
    const state: FakeState = { cancellationStatus: 'requested', refundRow: null, restoreStockCalls: 0, orderUpdate: null }
    mocks.createClient.mockReturnValue(fakeSupabase(state))

    const [first, second] = await Promise.all([
      approveProductCancellation({ cancellationId: CANCELLATION_ID }),
      approveProductCancellation({ cancellationId: CANCELLATION_ID }),
    ])

    const results = [first, second]
    const succeeded = results.filter((r) => r.ok)
    const failed = results.filter((r) => !r.ok)
    expect(succeeded).toHaveLength(1)
    expect(failed).toHaveLength(1)
    expect((failed[0] as { ok: false; error: string }).error).toMatch(/already (processed|being processed)/i)

    expect(state.restoreStockCalls).toBe(1)
    expect(mocks.requestProviderRefund).toHaveBeenCalledTimes(1)
    expect(state.cancellationStatus).toBe('approved')
  })

  it('rejects an approve outright when the cancellation is no longer requested (e.g. already approved)', async () => {
    const state: FakeState = { cancellationStatus: 'approved', refundRow: null, restoreStockCalls: 0, orderUpdate: null }
    mocks.createClient.mockReturnValue(fakeSupabase(state))

    const result = await approveProductCancellation({ cancellationId: CANCELLATION_ID })
    expect(result.ok).toBe(false)
    expect(mocks.requestProviderRefund).not.toHaveBeenCalled()
    expect(state.restoreStockCalls).toBe(0)
  })

  it('routes the refund through the shared refund engine, not a direct provider.createRefund() call', async () => {
    const state: FakeState = { cancellationStatus: 'requested', refundRow: null, restoreStockCalls: 0, orderUpdate: null }
    mocks.createClient.mockReturnValue(fakeSupabase(state))

    const result = await approveProductCancellation({ cancellationId: CANCELLATION_ID })
    expect(result.ok).toBe(true)
    expect(mocks.requestProviderRefund).toHaveBeenCalledWith(
      expect.objectContaining({ billId: 'bill_123', amountRm: 150, customerEmail: 'guest@example.com' }),
      expect.anything(),
    )
    expect(state.refundRow?.idempotency_key).toBe(`product-refund:${ORDER_ID}:full`)
  })
})

describe('approveProductCancellation — refund failure must not be reported as money moved', () => {
  it('keeps payment_status as paid (not refunded) and flags the result when the provider call throws', async () => {
    const state: FakeState = { cancellationStatus: 'requested', refundRow: null, restoreStockCalls: 0, orderUpdate: null }
    mocks.createClient.mockReturnValue(fakeSupabase(state))
    mocks.requestProviderRefund.mockRejectedValue(new Error('HitPay unreachable'))

    const result = await approveProductCancellation({ cancellationId: CANCELLATION_ID })
    expect(result.ok).toBe(true)
    expect(result.ok && result.data?.refundNeedsAttention).toBe(true)
    expect(state.orderUpdate).toMatchObject({ status: 'cancelled', payment_status: 'paid' })
    // The cancellation still completes — stock isn't left stuck mid-flight.
    expect(state.cancellationStatus).toBe('approved')
  })

  it('marks the refund as needing manual follow-up instead of leaving it stuck at claimed, when the order has no payment provider on file', async () => {
    const state: FakeState = { cancellationStatus: 'requested', refundRow: null, restoreStockCalls: 0, orderUpdate: null }
    mocks.createClient.mockReturnValue(fakeSupabase(state, { provider_bill_id: null, payment_provider: null }))

    const result = await approveProductCancellation({ cancellationId: CANCELLATION_ID })
    expect(result.ok).toBe(true)
    expect(result.ok && result.data?.refundNeedsAttention).toBe(true)
    expect(mocks.requestProviderRefund).not.toHaveBeenCalled()
    expect(state.refundRow?.status).toBe('exception')
    expect(state.refundRow?.failure_reason).toMatch(/no payment provider/i)
    expect(state.orderUpdate).toMatchObject({ status: 'cancelled', payment_status: 'paid' })
  })
})

describe('approveProductCancellation — auth', () => {
  it('is callable by a product_manager, not just admin (the whole point of the dedicated role)', async () => {
    const state: FakeState = { cancellationStatus: 'requested', refundRow: null, restoreStockCalls: 0, orderUpdate: null }
    mocks.createClient.mockReturnValue(fakeSupabase(state))
    mocks.getCurrentUser.mockResolvedValue({ authId: 'staff-1', role: 'product_manager' })

    const result = await approveProductCancellation({ cancellationId: CANCELLATION_ID })
    expect(result.ok).toBe(true)
  })

  it('rejects a customer session', async () => {
    mocks.getCurrentUser.mockResolvedValue({ authId: 'user-1', role: 'customer' })
    await expect(approveProductCancellation({ cancellationId: CANCELLATION_ID })).rejects.toThrow('Not authorised.')
  })
})
