import { createHmac } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { hitpayProvider } from '../hitpay'
import {
  applyRefundCallback,
  reconcileRefund,
  reconcilePendingRefunds,
  reconcilePendingRefundsSafe,
  requestProviderRefund,
  REFUND_ATTEMPT_LEASE_MS,
  type RefundRecord,
  type RefundStore,
} from '../refund'
import { stubProvider } from '../stub'
import {
  ProviderRefundError,
  isSafeProviderRefundId,
  isSafeRefundIdempotencyKey,
  type PaymentProvider,
  type RefundCallbackResult,
} from '../provider'

const RAW_ACCOUNT = '1234567890'
const NOW_MS = Date.parse('2026-09-01T01:00:00.000Z')
const APPOINTMENT_ID = '11111111-1111-4111-8111-111111111111'
const ORDER_ID = '22222222-2222-4222-8222-222222222222'
const REFUND_ARGS = {
  billId: 'bill_123',
  amountRm: 20,
  idempotencyKey: `booking-refund:${APPOINTMENT_ID}:full`,
  customerEmail: 'asha@example.com',
}

function responseJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function hitpaySignature(payload: string, salt: string): string {
  return createHmac('sha256', salt).update(payload).digest('hex')
}

function hitpayRefundCallback(body: Record<string, unknown>, salt = 'test-signature-salt'): Request {
  const payload = JSON.stringify(body)
  return new Request('https://example.test/api/payments/hitpay-refund-callback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'hitpay-signature': hitpaySignature(payload, salt) },
    body: payload,
  })
}

/** In-memory RefundStore fake standing in for either booking_refunds or product_refund_requests. */
function memoryStore(initial: RefundRecord, options: { failCompleteOnce?: boolean } = {}) {
  let row = { ...initial }
  let failComplete = options.failCompleteOnce === true
  const store: RefundStore = {
    async findById(id) {
      return row.id === id ? { ...row } : null
    },
    async findByProviderRefundId(providerRefundId) {
      return row.providerRefundId === providerRefundId ? { ...row } : null
    },
    async findByIdempotencyKey(idempotencyKey) {
      return row.idempotencyKey === idempotencyKey ? { ...row } : null
    },
    async claimAttempt(id, expected, requestedAt) {
      if (
        row.id !== id
        || row.status !== expected.status
        || row.providerRefundId !== null
        || (row.requestedAt ?? null) !== expected.requestedAt
      ) return false
      row = { ...row, status: 'pending', requestedAt }
      return true
    },
    async completeAttempt(id, requestedAt, patch) {
      if (failComplete) {
        failComplete = false
        throw new Error('database unavailable')
      }
      if (
        row.id !== id
        || row.status !== 'pending'
        || row.providerRefundId !== null
        || row.requestedAt !== requestedAt
      ) return false
      row = { ...row, ...patch }
      return true
    },
    async applyCallback(id, expectedProviderRefundId, patch) {
      if (
        row.id !== id
        || row.status !== 'pending'
        || row.providerRefundId !== expectedProviderRefundId
      ) return false
      row = { ...row, ...patch }
      return true
    },
    async listPending() {
      return row.status === 'pending' && row.providerRefundId ? [row.id] : []
    },
  }
  return { store, current: () => ({ ...row }) }
}

/** A pending-refund store spanning several ids, for the reconciliation sweep. */
function multiRowStore(rows: RefundRecord[]) {
  const byId = new Map(rows.map((r) => [r.id, { ...r }]))
  const store: RefundStore = {
    async findById(id) {
      const row = byId.get(id)
      return row ? { ...row } : null
    },
    async findByProviderRefundId(providerRefundId) {
      return Array.from(byId.values()).find((row) => row.providerRefundId === providerRefundId) ?? null
    },
    async findByIdempotencyKey(idempotencyKey) {
      return Array.from(byId.values()).find((row) => row.idempotencyKey === idempotencyKey) ?? null
    },
    async claimAttempt() {
      return false
    },
    async completeAttempt() {
      return false
    },
    async applyCallback(id, expectedProviderRefundId, patch) {
      const row = byId.get(id)
      if (!row || row.status !== 'pending' || row.providerRefundId !== expectedProviderRefundId) return false
      byId.set(id, { ...row, ...patch })
      return true
    },
    async listPending(limit) {
      return Array.from(byId.values())
        .filter((r) => r.status === 'pending' && r.providerRefundId)
        .slice(0, limit)
        .map((r) => r.id)
    },
  }
  return { store, current: (id: string) => { const r = byId.get(id); return r ? { ...r } : null } }
}

function refundProvider(overrides: Partial<PaymentProvider> = {}): PaymentProvider {
  return {
    name: 'hitpay',
    createBill: vi.fn(),
    verifyCallback: vi.fn(),
    createRefund: vi.fn().mockResolvedValue({ providerRefundId: 're_123', status: 'pending' }),
    fetchRefundStatus: vi.fn().mockResolvedValue({ status: 'pending' }),
    ...overrides,
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  process.env.HITPAY_API_KEY = 'not-a-real-key'
  process.env.HITPAY_SIGNATURE_SALT = 'test-signature-salt'
  process.env.HITPAY_API_BASE = 'https://api.sandbox.hit-pay.com'
})

describe('refund provider contracts', () => {
  it('exposes refund operations on every provider', () => {
    expect(hitpayProvider.createRefund).toBeTypeOf('function')
    expect(hitpayProvider.fetchRefundStatus).toBeTypeOf('function')
    expect(stubProvider.createRefund).toBeTypeOf('function')
  })

  it('accepts both booking and product refund idempotency keys, exact UUID only', () => {
    expect(isSafeRefundIdempotencyKey(`booking-refund:${APPOINTMENT_ID}:full`)).toBe(true)
    expect(isSafeRefundIdempotencyKey(`product-refund:${ORDER_ID}:full`)).toBe(true)
    expect(isSafeRefundIdempotencyKey('booking-refund:appointment-a:full')).toBe(false)
    expect(isSafeRefundIdempotencyKey(`product-refund:${ORDER_ID}:partial`)).toBe(false)
    expect(isSafeRefundIdempotencyKey(`shipping-refund:${ORDER_ID}:full`)).toBe(false)
  })

  it('rejects HitPay provider IDs that look like raw PII', () => {
    expect(isSafeProviderRefundId('hitpay', 're_123')).toBe(true)
    expect(isSafeProviderRefundId('hitpay', RAW_ACCOUNT)).toBe(false)
    expect(isSafeProviderRefundId('hitpay', 'asha@example.com')).toBe(false)
    expect(isSafeProviderRefundId('hitpay', 'Asha Nair')).toBe(false)
    expect(isSafeProviderRefundId('hitpay', '  re_123  ')).toBe(false)
  })
})

describe('HitPay refunds', () => {
  it('resolves the succeeded payment on the bill and forwards amount plus email', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(responseJson({ payments: [{ id: 'payment_123', status: 'succeeded' }] }))
      .mockResolvedValueOnce(responseJson({ id: 're_123', status: 'succeeded', payment_method: 'card' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(hitpayProvider.createRefund(REFUND_ARGS)).resolves.toEqual({
      providerRefundId: 're_123',
      status: 'confirmed',
      bankCode: 'card',
    })
    // HITPAY_API_BASE is read once at module load, so assert the path rather
    // than the host (which reflects whatever env was ambient at import time).
    expect(fetchMock.mock.calls[0]?.[0]).toMatch(/\/v1\/payment-requests\/bill_123$/)
    const [, refundInit] = fetchMock.mock.calls[1] as [string, RequestInit]
    const body = refundInit.body as URLSearchParams
    expect(body.get('payment_id')).toBe('payment_123')
    expect(body.get('amount')).toBe('20.00')
    expect(body.get('email')).toBe(REFUND_ARGS.customerEmail)
  })

  it('rejects definitively when the bill has no succeeded payment', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseJson({ payments: [{ id: 'p1', status: 'pending' }] })))
    const error = await hitpayProvider.createRefund(REFUND_ARGS).catch((value) => value)
    expect(error).toBeInstanceOf(ProviderRefundError)
    expect(error).toMatchObject({ category: 'definitive' })
  })

  it.each([
    ['succeeded', 'confirmed'],
    ['failed', 'exception'],
    ['cancelled', 'exception'],
    ['processing', 'pending'],
  ] as const)('maps HitPay refund status %s to %s', async (providerStatus, status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseJson({ status: providerStatus })))
    await expect(hitpayProvider.fetchRefundStatus!('re_123')).resolves.toEqual({ status })
  })

  it('returns null (never throws) when the status lookup fails, so reconciliation just retries later', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('server error', { status: 500 })))
    await expect(hitpayProvider.fetchRefundStatus!('re_123')).resolves.toBeNull()
  })

  it('verifies the webhook signature before returning a redacted callback result', async () => {
    const request = hitpayRefundCallback({ object: { id: 're_123', status: 'succeeded' } })
    await expect(hitpayProvider.verifyRefundCallback!(request)).resolves.toEqual({
      providerRefundId: 're_123',
      status: 'confirmed',
      provider: 'hitpay',
    })
  })

  it('rejects a refund webhook with a tampered signature', async () => {
    const request = hitpayRefundCallback({ object: { id: 're_123', status: 'succeeded' } }, 'wrong-salt')
    await expect(hitpayProvider.verifyRefundCallback!(request)).rejects.toThrow(/signature/i)
  })
})

describe('shared refund persistence', () => {
  const claimed: RefundRecord = {
    id: 'refund-a',
    provider: 'hitpay',
    providerRefundId: null,
    status: 'claimed',
    amountRm: 20,
    idempotencyKey: REFUND_ARGS.idempotencyKey,
    bankCode: null,
    bankAccountLast4: null,
    requestedAt: null,
  }

  it('persists only safe provider fields and does not call the provider twice after transition', async () => {
    const memory = memoryStore(claimed)
    const provider = refundProvider({
      createRefund: vi.fn().mockResolvedValue({
        providerRefundId: 're_123', status: 'pending', bankCode: 'card', bankAccountLast4: '7890',
      }),
    })
    const deps = { store: memory.store, providerForName: () => provider, now: () => NOW_MS }
    const args = { refundId: claimed.id, ...REFUND_ARGS }

    await expect(requestProviderRefund(args, deps)).resolves.toMatchObject({ status: 'pending' })
    await expect(requestProviderRefund(args, deps)).resolves.toMatchObject({ status: 'pending' })
    expect(provider.createRefund).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(memory.current())).not.toContain(RAW_ACCOUNT)
  })

  it('claims the row before the provider call so concurrent requests cannot double-submit', async () => {
    const memory = memoryStore(claimed)
    let finish!: (result: { providerRefundId: string; status: 'pending' }) => void
    const createRefund = vi.fn().mockImplementation(() => new Promise((resolve) => { finish = resolve }))
    const provider = refundProvider({ createRefund })
    const deps = { store: memory.store, providerForName: () => provider, now: () => NOW_MS }
    const args = { refundId: claimed.id, ...REFUND_ARGS }

    const first = requestProviderRefund(args, deps)
    await vi.waitFor(() => expect(createRefund).toHaveBeenCalledTimes(1))
    await expect(requestProviderRefund(args, deps)).rejects.toMatchObject({ category: 'ambiguous' })
    expect(createRefund).toHaveBeenCalledTimes(1)
    finish({ providerRefundId: 're_123', status: 'pending' })
    await expect(first).resolves.toMatchObject({ providerRefundId: 're_123', status: 'pending' })
  })

  it('recovers a crashed pending attempt after its lease expires', async () => {
    const staleAt = new Date(NOW_MS - REFUND_ATTEMPT_LEASE_MS - 1).toISOString()
    const memory = memoryStore({ ...claimed, status: 'pending', requestedAt: staleAt })
    const createRefund = vi.fn().mockResolvedValue({ providerRefundId: 're_123', status: 'pending' })
    const provider = refundProvider({ createRefund })

    await expect(requestProviderRefund(
      { refundId: claimed.id, ...REFUND_ARGS },
      { store: memory.store, providerForName: () => provider, now: () => NOW_MS },
    )).resolves.toMatchObject({ providerRefundId: 're_123', status: 'pending' })
    expect(createRefund).toHaveBeenCalledTimes(1)
  })

  it('moves only a definitive provider failure to exception with a fixed reason', async () => {
    const memory = memoryStore(claimed)
    const provider = refundProvider({
      createRefund: vi.fn().mockRejectedValue(new ProviderRefundError('definitive')),
    })
    await expect(requestProviderRefund(
      { refundId: claimed.id, ...REFUND_ARGS },
      { store: memory.store, providerForName: () => provider, now: () => NOW_MS },
    )).rejects.toMatchObject({ category: 'definitive' })
    expect(memory.current()).toMatchObject({
      status: 'exception',
      providerRefundId: null,
      failureReason: 'Provider refund request failed.',
    })
  })

  it('reconciles only pending rows and leaves duplicate terminal callbacks as no-ops', async () => {
    const memory = memoryStore({ ...claimed, status: 'pending', providerRefundId: 're_123' })
    const provider = refundProvider({ fetchRefundStatus: vi.fn().mockResolvedValue({ status: 'confirmed' }) })
    const deps = { store: memory.store, providerForName: () => provider, now: () => NOW_MS }

    await expect(reconcileRefund(claimed.id, deps)).resolves.toMatchObject({ status: 'confirmed' })
    await expect(reconcileRefund(claimed.id, deps)).resolves.toMatchObject({ status: 'confirmed' })
    expect(provider.fetchRefundStatus).toHaveBeenCalledTimes(1)

    const callback: RefundCallbackResult = {
      providerRefundId: 're_123',
      status: 'exception',
      idempotencyKey: REFUND_ARGS.idempotencyKey,
    }
    await expect(applyRefundCallback(callback, deps)).resolves.toMatchObject({ status: 'confirmed' })
    expect(memory.current().status).toBe('confirmed')
  })

  it('recovers a callback that arrives before provider-ID persistence via the idempotency key', async () => {
    const memory = memoryStore({ ...claimed, status: 'pending', requestedAt: new Date(NOW_MS).toISOString() })
    const callback: RefundCallbackResult = {
      providerRefundId: 're_123',
      status: 'confirmed',
      idempotencyKey: REFUND_ARGS.idempotencyKey,
    }
    await expect(applyRefundCallback(callback, {
      store: memory.store, providerForName: () => refundProvider(), now: () => NOW_MS,
    })).resolves.toMatchObject({ providerRefundId: 're_123', status: 'confirmed' })
  })
})

describe('reconcilePendingRefunds / reconcilePendingRefundsSafe', () => {
  function row(id: string, providerRefundId: string): RefundRecord {
    return {
      id,
      provider: 'hitpay',
      providerRefundId,
      status: 'pending',
      amountRm: 20,
      idempotencyKey: `product-refund:${id}:full`,
      bankCode: null,
      bankAccountLast4: null,
      requestedAt: new Date(NOW_MS).toISOString(),
    }
  }

  it('tallies confirmed, exception, and still-pending outcomes across a batch, one bad row does not stop the rest', async () => {
    const rows = [row('r1', 'pe_1'), row('r2', 'pe_2'), row('r3', 'pe_3')]
    const memory = multiRowStore(rows)
    const statuses: Record<string, { status: 'confirmed' | 'exception' | 'pending' } | null> = {
      pe_1: { status: 'confirmed' },
      pe_2: { status: 'exception' },
      pe_3: null, // simulates a lookup failure for this one row
    }
    const provider = refundProvider({
      fetchRefundStatus: vi.fn(async (id: string) => {
        if (id === 'pe_3') throw new Error('network blip')
        return statuses[id]
      }),
    })
    const deps = { store: memory.store, providerForName: () => provider, now: () => NOW_MS }

    const tally = await reconcilePendingRefunds(deps)
    expect(tally).toEqual({ checked: 3, confirmed: 1, exception: 1, stillPending: 0 })
    expect(memory.current('r1')).toMatchObject({ status: 'confirmed' })
    expect(memory.current('r2')).toMatchObject({ status: 'exception' })
    expect(memory.current('r3')).toMatchObject({ status: 'pending' }) // untouched — its lookup threw
  })

  it('reconcilePendingRefundsSafe swallows a listPending failure and returns null instead of throwing', async () => {
    const store: RefundStore = {
      findById: vi.fn(),
      findByProviderRefundId: vi.fn(),
      findByIdempotencyKey: vi.fn(),
      claimAttempt: vi.fn(),
      completeAttempt: vi.fn(),
      applyCallback: vi.fn(),
      listPending: vi.fn().mockRejectedValue(new Error('db unavailable')),
    }
    const deps = { store, providerForName: () => refundProvider(), now: () => NOW_MS }
    await expect(reconcilePendingRefundsSafe(deps)).resolves.toBeNull()
  })
})
