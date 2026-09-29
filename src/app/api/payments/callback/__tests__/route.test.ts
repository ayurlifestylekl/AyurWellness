import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  verifyCallback: vi.fn(),
  markBillPaid: vi.fn(),
  reconcileByBill: vi.fn(),
  markProductBillPaid: vi.fn(),
  reconcileProductOrderByBill: vi.fn(),
}))

vi.mock('@/lib/payments', () => ({ getPaymentProvider: () => ({ verifyCallback: mocks.verifyCallback }) }))
vi.mock('@/lib/booking/payment', () => ({ markBillPaid: mocks.markBillPaid, reconcileByBill: mocks.reconcileByBill }))
vi.mock('@/lib/checkout/payment', () => ({
  markProductBillPaid: mocks.markProductBillPaid,
  reconcileProductOrderByBill: mocks.reconcileProductOrderByBill,
}))
vi.mock('@/lib/booking/payment-result', () => ({ paymentCallbackResponse: () => ({ ok: true, status: 200 }) }))

import { GET, POST } from '../route'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.reconcileProductOrderByBill.mockResolvedValue({ ok: true, state: 'not_found' })
  mocks.markProductBillPaid.mockResolvedValue({ ok: true, state: 'not_found' })
  mocks.reconcileByBill.mockResolvedValue({ disposition: 'final', state: 'provider_not_paid' })
  mocks.markBillPaid.mockResolvedValue({ disposition: 'final', state: 'confirmed' })
})

describe('payment callback', () => {
  it('never trusts status=completed from an unverified browser return — it re-checks with the provider', async () => {
    mocks.verifyCallback.mockResolvedValue({ billId: 'bill_1', paid: true, verified: false })
    await GET(new Request('http://x/api/payments/callback?reference=bill_1&status=completed') as never)
    expect(mocks.markBillPaid).not.toHaveBeenCalled()
    expect(mocks.markProductBillPaid).not.toHaveBeenCalled()
    expect(mocks.reconcileProductOrderByBill).toHaveBeenCalledWith('bill_1')
    expect(mocks.reconcileByBill).toHaveBeenCalledWith('bill_1')
  })

  it('confirms directly only for a verified (signed) webhook', async () => {
    mocks.verifyCallback.mockResolvedValue({ billId: 'bill_2', paid: true, verified: true })
    await POST(new Request('http://x/api/payments/callback', { method: 'POST', body: '{}' }) as never)
    expect(mocks.markProductBillPaid).toHaveBeenCalledWith('bill_2')
    expect(mocks.markBillPaid).toHaveBeenCalledWith('bill_2')
  })
})
