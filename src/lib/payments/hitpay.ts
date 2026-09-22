import { createHmac, timingSafeEqual } from 'crypto'
import { ProviderRefundError } from './provider'
import type {
  CallbackResult,
  CreateBillArgs,
  CreateBillResult,
  PaymentProvider,
  ProviderRefundResult,
  RefundArgs,
  RefundCallbackResult,
  RefundStatusResult,
} from './provider'

/**
 * HitPay payment provider.
 *
 * Docs:
 * - Create payment request: https://docs.hitpayapp.com/apis/payment-request/create-request
 * - Webhooks: https://docs.hitpayapp.com/apis/guide/events
 * - Refunds: https://docs.hitpayapp.com/apis/payment-request/refund
 *
 * Required env:
 *   HITPAY_API_KEY
 *   HITPAY_SIGNATURE_SALT  (for webhook signature verification)
 *   HITPAY_API_BASE        (defaults to production; use https://api.sandbox.hit-pay.com for testing)
 *   HITPAY_CURRENCY        (defaults to MYR)
 *   HITPAY_PAYMENT_METHODS (comma-separated, e.g. "card,paynow_online,fpx")
 */

const API_BASE = (process.env.HITPAY_API_BASE || 'https://api.hit-pay.com').replace(/\/$/, '')
const CURRENCY = (process.env.HITPAY_CURRENCY || 'MYR').toLowerCase()

function headers(): Record<string, string> {
  return {
    'X-BUSINESS-API-KEY': process.env.HITPAY_API_KEY || '',
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/x-www-form-urlencoded',
  }
}

function paymentMethods(): string[] {
  const raw = process.env.HITPAY_PAYMENT_METHODS || 'card'
  return raw
    .split(',')
    .map((m) => m.trim().toLowerCase())
    .filter(Boolean)
}

function safeSignatureEqual(expected: string, supplied: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false
  try {
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(supplied, 'hex')
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function verifyWebhookPayload(payload: string, signature: string | null): boolean {
  if (!signature) return false
  const salt = process.env.HITPAY_SIGNATURE_SALT
  if (!salt) return false
  const expected = createHmac('sha256', salt).update(payload).digest('hex')
  return safeSignatureEqual(expected, signature)
}

function parseStatus(status: unknown): { paid: boolean; failed: boolean } {
  const s = typeof status === 'string' ? status.toLowerCase() : ''
  return { paid: s === 'completed' || s === 'succeeded', failed: s === 'failed' || s === 'cancelled' }
}

async function hitpayFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...headers(),
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => 'HitPay API error')
    throw new Error(`HitPay ${init?.method || 'GET'} ${path} failed: ${res.status} ${body}`)
  }
  return (await res.json()) as T
}

function formBody(params: Record<string, string | string[] | boolean | number>): URLSearchParams {
  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      for (const v of value) body.append(`${key}[]`, v)
    } else {
      body.append(key, String(value))
    }
  }
  return body
}

export const hitpayProvider: PaymentProvider = {
  name: 'hitpay',

  async createBill(args: CreateBillArgs): Promise<CreateBillResult> {
    if (!process.env.HITPAY_API_KEY) {
      throw new Error('HITPAY_API_KEY is not configured')
    }

    const body = formBody({
      amount: args.amountRm.toFixed(2),
      currency: CURRENCY,
      purpose: args.description,
      reference_number: args.appointmentId,
      redirect_url: args.redirectUrl,
      name: args.name,
      email: args.email,
      phone: args.phone,
      'payment_methods[]': paymentMethods(),
      allow_repeated_payments: 'false',
    })

    const data = await hitpayFetch<{
      id: string
      url: string
      status?: string
    }>('/v1/payment-requests', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    if (!data.id || !data.url) {
      throw new Error('HitPay payment request did not return an id or url')
    }

    return { billId: data.id, url: data.url }
  },

  async verifyCallback(req: Request): Promise<CallbackResult> {
    // Webhook (POST, authoritative)
    if (req.method === 'POST') {
      const payload = await req.text()
      const signature = req.headers.get('hitpay-signature') || req.headers.get('Hitpay-Signature')
      if (!verifyWebhookPayload(payload, signature)) {
        throw new Error('HitPay webhook signature verification failed')
      }
      const data = JSON.parse(payload) as Record<string, unknown>
      const object = data.object as Record<string, unknown> | undefined
      const id = typeof object?.id === 'string' ? object.id : (typeof data.id === 'string' ? data.id : '')
      const status = parseStatus(object?.status ?? data.status)
      return { billId: id || '', paid: status.paid }
    }

    // Customer browser return (GET, best-effort)
    const url = new URL(req.url)
    const reference = url.searchParams.get('reference') || ''
    const status = url.searchParams.get('status') || ''
    return { billId: reference, paid: status.toLowerCase() === 'completed' }
  },

  async fetchBillStatus(billId: string): Promise<{ paid: boolean } | null> {
    if (!process.env.HITPAY_API_KEY) return null
    try {
      const data = await hitpayFetch<{
        id: string
        status: string
        payments?: { status: string }[]
      }>(`/v1/payment-requests/${billId}`)
      const status = parseStatus(data.status)
      return { paid: status.paid }
    } catch (e) {
      console.error('[hitpay] fetchBillStatus failed', e)
      return null
    }
  },

  async deleteBill(): Promise<void> {
    // HitPay does not expose a "delete pending payment request" endpoint.
    // Unpaid requests simply expire; we rely on the order expiry sweep.
  },

  async createRefund(args: RefundArgs): Promise<ProviderRefundResult> {
    if (!process.env.HITPAY_API_KEY) {
      throw new ProviderRefundError('definitive')
    }

    // Resolve the HitPay payment_id from the stored bill.
    const bill = await hitpayFetch<{
      payments?: { id: string; status: string }[]
    }>(`/v1/payment-requests/${args.billId}`)
    const payment = bill.payments?.find((p) => p.status === 'succeeded' || p.status === 'completed')
    if (!payment?.id) {
      throw new ProviderRefundError('definitive')
    }

    const body = formBody({
      payment_id: payment.id,
      amount: args.amountRm.toFixed(2),
      email: args.customerEmail,
    })

    const data = await hitpayFetch<{
      id: string
      status: string
      payment_method?: string
    }>('/v1/refund', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    if (!data.id) {
      throw new ProviderRefundError('ambiguous')
    }

    return {
      providerRefundId: data.id,
      status: data.status === 'succeeded' ? 'confirmed' : 'pending',
      bankCode: data.payment_method,
    }
  },

  async fetchRefundStatus(providerRefundId: string): Promise<RefundStatusResult | null> {
    if (!process.env.HITPAY_API_KEY) return null
    try {
      const data = await hitpayFetch<{ status: string }>(`/v1/refund/${providerRefundId}`)
      const status = data.status.toLowerCase()
      if (status === 'succeeded') return { status: 'confirmed' }
      if (status === 'failed' || status === 'cancelled') return { status: 'exception' }
      return { status: 'pending' }
    } catch (e) {
      console.error('[hitpay] fetchRefundStatus failed', e)
      return null
    }
  },

  async verifyRefundCallback(req: Request): Promise<RefundCallbackResult | null> {
    if (req.method !== 'POST') return null
    const payload = await req.text()
    const signature = req.headers.get('hitpay-signature') || req.headers.get('Hitpay-Signature')
    if (!verifyWebhookPayload(payload, signature)) {
      throw new Error('HitPay refund webhook signature verification failed')
    }
    const data = JSON.parse(payload) as Record<string, unknown>
    const object = data.object as Record<string, unknown> | undefined
    const id = typeof object?.id === 'string' ? object.id : (typeof data.id === 'string' ? data.id : '')
    const status = parseStatus(object?.status ?? data.status)
    if (!id) return null
    return {
      providerRefundId: id,
      status: status.paid ? 'confirmed' : status.failed ? 'exception' : 'pending',
      provider: 'hitpay',
    }
  },
}
