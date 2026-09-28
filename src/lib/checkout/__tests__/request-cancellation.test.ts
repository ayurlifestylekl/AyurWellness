import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getCurrentUser: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/auth/getCurrentUser', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('@/lib/payments', () => ({ getPaymentProvider: vi.fn() }))
vi.mock('@/lib/shipping/zones', () => ({ calculateShipping: vi.fn(), getShippingZone: vi.fn() }))

import { requestProductCancellation } from '../actions'

const ORDER_ID = '22222222-2222-4222-8222-222222222222'

type QueryResult = { data: unknown; error: unknown }

// requestProductCancellation only ever does bare `await sb.from(t).select(...).eq(...).single()`
// (read) or bare `await sb.from(t).insert(...)` (write, no chaining) — so `insert()` here
// resolves directly rather than returning a further-chainable builder.
interface ReadBuilder {
  select(cols?: string): ReadBuilder
  eq(col: string, val: unknown): ReadBuilder
  single(): Promise<QueryResult>
  maybeSingle(): Promise<QueryResult>
}

function fakeSupabase(options: { hasActiveCancellation: boolean }) {
  const order = {
    id: ORDER_ID,
    status: 'paid',
    payment_status: 'paid',
    total_rm: 150,
    customer_id: 'user-1',
    email: 'guest@example.com',
  }

  function ordersTable(): ReadBuilder {
    const builder: ReadBuilder = {
      select: () => builder,
      eq: () => builder,
      single: () => Promise.resolve({ data: order, error: null }),
      maybeSingle: () => Promise.resolve({ data: order, error: null }),
    }
    return builder
  }

  const from = vi.fn((table: string) => {
    if (table === 'product_orders') return ordersTable()
    if (table === 'product_cancellations') {
      return {
        // The DB's partial unique index (one active cancellation per order)
        // is what actually enforces this in production — simulate its 23505.
        insert: () => Promise.resolve(
          options.hasActiveCancellation
            ? { data: null, error: { code: '23505', message: 'duplicate key' } }
            : { data: null, error: null },
        ),
      }
    }
    if (table === 'product_refund_requests') {
      return { insert: () => Promise.resolve({ data: null, error: null }) }
    }
    throw new Error(`unexpected table: ${table}`)
  })
  return { from }
}

beforeEach(() => {
  vi.restoreAllMocks()
  mocks.createClient.mockReset()
  mocks.getCurrentUser.mockReset().mockResolvedValue({ authId: 'user-1', email: 'guest@example.com' })
})

describe('requestProductCancellation — duplicate submission', () => {
  it('reports a clear error instead of creating a second cancellation for the same order', async () => {
    mocks.createClient.mockReturnValue(fakeSupabase({ hasActiveCancellation: true }))
    const result = await requestProductCancellation({ orderId: ORDER_ID, reason: 'Changed my mind' })
    expect(result.ok).toBe(false)
    expect((result as { ok: false; error: string }).error).toMatch(/already pending/i)
  })

  it('succeeds for the first submission', async () => {
    mocks.createClient.mockReturnValue(fakeSupabase({ hasActiveCancellation: false }))
    const result = await requestProductCancellation({ orderId: ORDER_ID, reason: 'Changed my mind' })
    expect(result.ok).toBe(true)
  })
})
