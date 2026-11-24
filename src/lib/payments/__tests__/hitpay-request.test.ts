import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hitpayProvider } from '../hitpay'

const SALT = 'test-salt'

beforeEach(() => {
  vi.stubEnv('HITPAY_API_KEY', 'key')
  vi.stubEnv('HITPAY_SIGNATURE_SALT', SALT)
  vi.stubEnv('HITPAY_PAYMENT_METHODS', 'card, fpx')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('createBill request', () => {
  it('sends payment_methods[] once per method and the webhook address', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'pr_1', url: 'https://pay' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await hitpayProvider.createBill({
      appointmentId: 'ORD-1', amountRm: 89, name: 'A', email: 'a@b.co', phone: '0164071129',
      description: 'Product order ORD-1', callbackUrl: 'https://site/api/payments/callback', redirectUrl: 'https://site/ok',
    })
    const body = (fetchMock.mock.calls[0][1] as RequestInit).body as URLSearchParams
    expect(body.getAll('payment_methods[]')).toEqual(['card', 'fpx'])
    expect(body.has('payment_methods[][]')).toBe(false)
    expect(body.get('webhook')).toBe('https://site/api/payments/callback')
    expect(body.get('amount')).toBe('89.00')
  })
})

function formWebhook(fields: Record<string, string>, salt = SALT) {
  const msg = Object.keys(fields).sort().map((k) => k + fields[k]).join('')
  const hmac = createHmac('sha256', salt).update(msg).digest('hex')
  return new Request('https://site/api/payments/callback', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...fields, hmac }).toString(),
  })
}

describe('form webhook', () => {
  const fields = { payment_id: 'p1', payment_request_id: 'pr_1', amount: '89.00', currency: 'myr', status: 'completed', reference_number: 'ORD-1' }

  it('accepts a correctly signed paid webhook', async () => {
    await expect(hitpayProvider.verifyCallback(formWebhook(fields))).resolves.toEqual({ billId: 'pr_1', paid: true, verified: true })
  })
  it('rejects a webhook signed with the wrong salt', async () => {
    await expect(hitpayProvider.verifyCallback(formWebhook(fields, 'other'))).rejects.toThrow(/signature/)
  })
  it('rejects a tampered amount', async () => {
    const req = formWebhook(fields)
    const body = (await req.text()).replace('89.00', '1.00')
    const tampered = new Request(req.url, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body })
    await expect(hitpayProvider.verifyCallback(tampered)).rejects.toThrow(/signature/)
  })
  it('a failed payment is not paid', async () => {
    await expect(hitpayProvider.verifyCallback(formWebhook({ ...fields, status: 'failed' }))).resolves.toMatchObject({ paid: false, verified: true })
  })
})
