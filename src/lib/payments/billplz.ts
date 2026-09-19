import { createHmac, timingSafeEqual } from 'crypto'
import {
  ProviderRefundError,
  isSafeProviderRefundId,
  isSafeRefundIdempotencyKey,
  providerIdMatchesSensitiveValue,
} from './provider'
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
 * Billplz (FPX) provider.
 *
 * To go live (day 2): set in the environment
 *   BILLPLZ_API_KEY          — secret API key
 *   BILLPLZ_COLLECTION_ID    — the collection bills are created under
 *   BILLPLZ_WEBHOOK_SECRET   — the collection's "X Signature" key
 *   PAYMENTS_PROVIDER=billplz — flips getPaymentProvider() to this
 *   BILLPLZ_API_BASE         — optional; defaults to production. Use
 *                              https://www.billplz-sandbox.com for testing.
 *
 * Docs: https://www.billplz.com/api — v3 Bills + X Signature verification.
 */

const API_BASE = process.env.BILLPLZ_API_BASE || 'https://www.billplz.com'

function authHeader(): string {
  // Basic auth: base64(`${API_KEY}:`) — key as username, blank password.
  return 'Basic ' + Buffer.from(`${process.env.BILLPLZ_API_KEY}:`).toString('base64')
}

export function buildBillplzChecksum(values: Array<string | number>, secret: string): string {
  return createHmac('sha512', secret).update(values.join('')).digest('hex')
}

export function maskBankAccount(accountNumber: string): string {
  if (accountNumber.length <= 4) return '*'.repeat(accountNumber.length)
  return `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
}

function safeChecksumEqual(expected: string, supplied: string): boolean {
  if (!/^[a-f0-9]{128}$/i.test(supplied)) return false
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(supplied, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

function paymentOrderStatus(status: string): RefundStatusResult['status'] {
  if (status === 'completed') return 'confirmed'
  if (['refunded', 'cancelled', 'failed'].includes(status)) return 'exception'
  return 'pending'
}

function paymentOrderConfig(): { collectionId: string; signatureKey: string } {
  const collectionId = process.env.BILLPLZ_PAYMENT_ORDER_COLLECTION_ID
  const signatureKey = process.env.BILLPLZ_PAYMENT_ORDER_SIGNATURE_KEY
  if (!process.env.BILLPLZ_API_KEY || !collectionId || !signatureKey) {
    throw new ProviderRefundError('definitive')
  }
  return { collectionId, signatureKey }
}

export const billplzProvider: PaymentProvider = {
  name: 'billplz',

  async createBill(args: CreateBillArgs): Promise<CreateBillResult> {
    // Customers sometimes put an email in the phone field (or vice versa).
    // Billplz hard-rejects the whole bill on an invalid mobile/email, so only
    // forward values that actually look right — both are optional extras.
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email ?? '') ? args.email : 'no-reply@ayurvedawellness.com.my'
    const mobile = (args.phone ?? '').replace(/[\s()-]/g, '')
    const body = new URLSearchParams({
      collection_id: process.env.BILLPLZ_COLLECTION_ID ?? '',
      email,
      name: args.name || 'Guest',
      amount: String(Math.round(args.amountRm * 100)), // sen
      callback_url: args.callbackUrl,
      redirect_url: args.redirectUrl,
      description: args.description.slice(0, 200),
      reference_1_label: 'Appointment',
      reference_1: args.appointmentId,
    })
    if (/^\+?\d{7,15}$/.test(mobile)) body.set('mobile', mobile)

    const res = await fetch(`${API_BASE}/api/v3/bills`, {
      method: 'POST',
      headers: { Authorization: authHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Billplz createBill failed (${res.status}): ${text}`)
    }
    const json = (await res.json()) as { id: string; url: string }
    return { billId: json.id, url: json.url }
  },

  async deleteBill(billId: string): Promise<void> {
    if (!billId) return
    const res = await fetch(`${API_BASE}/api/v3/bills/${billId}`, {
      method: 'DELETE',
      headers: { Authorization: authHeader() },
    })
    // Billplz refuses to delete a paid bill — that's the caller's signal to reconcile.
    if (!res.ok) throw new Error(`Billplz deleteBill failed (${res.status})`)
  },

  async fetchBillStatus(billId: string): Promise<{ paid: boolean } | null> {
    if (!billId) return null
    try {
      const res = await fetch(`${API_BASE}/api/v3/bills/${billId}`, {
        headers: { Authorization: authHeader() },
      })
      if (!res.ok) return null
      const json = (await res.json()) as { paid?: boolean }
      return { paid: json.paid === true }
    } catch {
      return null
    }
  },

  async createRefund(args: RefundArgs): Promise<ProviderRefundResult> {
    const bank = args.bank
    if (!bank?.bankCode || !bank.accountNumber || !bank.accountHolderName) {
      throw new ProviderRefundError('definitive')
    }
    if (!/^(?=.*[A-Z])[A-Z0-9]{8}(?:[A-Z0-9]{3})?$/.test(bank.bankCode) || !/^\d{5,32}$/.test(bank.accountNumber)) {
      throw new ProviderRefundError('definitive')
    }
    const { collectionId, signatureKey } = paymentOrderConfig()
    const amountSen = Math.round(args.amountRm * 100)
    if (!Number.isSafeInteger(amountSen) || amountSen <= 0 || !args.idempotencyKey) {
      throw new ProviderRefundError('definitive')
    }
    const total = String(amountSen)
    const epoch = String(Math.floor(Date.now() / 1000))
    const body = new URLSearchParams({
      payment_order_collection_id: collectionId,
      bank_code: bank.bankCode,
      bank_account_number: bank.accountNumber,
      name: bank.accountHolderName,
      description: 'Booking refund',
      total,
      email: args.customerEmail,
      recipient_notification: 'true',
      reference_id: args.idempotencyKey,
      epoch,
      checksum: buildBillplzChecksum([collectionId, bank.accountNumber, total, epoch], signatureKey),
    })

    let res: Response
    try {
      res = await fetch(`${API_BASE}/api/v5/payment_orders`, {
        method: 'POST',
        headers: { Authorization: authHeader(), 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
    } catch {
      throw new ProviderRefundError('ambiguous')
    }
    if (!res.ok) {
      const ambiguous = res.status >= 500 || [408, 409, 422, 425, 429].includes(res.status)
      throw new ProviderRefundError(ambiguous ? 'ambiguous' : 'definitive')
    }

    let json: { id?: unknown; status?: unknown }
    try {
      json = (await res.json()) as { id?: unknown; status?: unknown }
    } catch {
      throw new ProviderRefundError('ambiguous')
    }
    if (
      !isSafeProviderRefundId('billplz', json.id)
      || providerIdMatchesSensitiveValue(json.id, bank.accountNumber, bank.accountHolderName)
      || typeof json.status !== 'string'
    ) {
      throw new ProviderRefundError('ambiguous')
    }
    const status = paymentOrderStatus(json.status)
    if (status === 'exception') throw new ProviderRefundError('definitive')
    return {
      providerRefundId: json.id,
      status,
      bankCode: bank.bankCode,
      bankAccountLast4: bank.accountNumber.slice(-4),
    }
  },

  async fetchRefundStatus(providerRefundId: string): Promise<RefundStatusResult | null> {
    if (!isSafeProviderRefundId('billplz', providerRefundId)) return null
    try {
      const { signatureKey } = paymentOrderConfig()
      const epoch = String(Math.floor(Date.now() / 1000))
      const query = new URLSearchParams({
        epoch,
        checksum: buildBillplzChecksum([providerRefundId, epoch], signatureKey),
      })
      const res = await fetch(`${API_BASE}/api/v5/payment_orders/${encodeURIComponent(providerRefundId)}?${query}`, {
        headers: { Authorization: authHeader() },
      })
      if (!res.ok) return null
      const json = (await res.json()) as { status?: unknown }
      if (typeof json.status !== 'string') return null
      return { status: paymentOrderStatus(json.status) }
    } catch {
      return null
    }
  },

  async verifyRefundCallback(req: Request): Promise<RefundCallbackResult | null> {
    const signatureKey = process.env.BILLPLZ_PAYMENT_ORDER_SIGNATURE_KEY
    if (!signatureKey) return null
    const form = await req.formData()
    const value = (key: string): string => {
      const item = form.get(key)
      return typeof item === 'string' ? item : ''
    }
    const providerRefundId = value('id')
    const accountNumber = value('bank_account_number')
    const status = value('status')
    const supplied = value('checksum')
    const expected = buildBillplzChecksum([
      providerRefundId,
      accountNumber,
      status,
      value('total'),
      value('reference_id'),
      value('epoch'),
    ], signatureKey)
    if (
      !safeChecksumEqual(expected, supplied)
      || !isSafeProviderRefundId('billplz', providerRefundId)
      || providerIdMatchesSensitiveValue(
        providerRefundId,
        accountNumber,
        value('name'),
        value('display_name'),
      )
    ) return null
    const idempotencyKey = value('reference_id')
    return {
      providerRefundId,
      status: paymentOrderStatus(status),
      provider: 'billplz',
      ...(isSafeRefundIdempotencyKey(idempotencyKey) ? { idempotencyKey } : {}),
    }
  },

  async verifyCallback(req: Request): Promise<CallbackResult> {
    // Server-to-server callback is an x-www-form-urlencoded POST.
    const form = await req.formData()
    const params: Record<string, string> = {}
    form.forEach((v, k) => {
      params[k] = typeof v === 'string' ? v : ''
    })

    const signature = params['x_signature'] ?? ''
    delete params['x_signature']

    // X Signature source: `key`+`value` for each param, sorted by key, joined by '|'.
    const source = Object.keys(params)
      .sort()
      .map((k) => `${k}${params[k]}`)
      .join('|')
    const expected = createHmac('sha256', process.env.BILLPLZ_WEBHOOK_SECRET ?? '')
      .update(source)
      .digest('hex')

    const a = Buffer.from(expected)
    const b = Buffer.from(signature)
    const valid = a.length === b.length && timingSafeEqual(a, b)
    if (!valid) {
      return { billId: params['id'] ?? '', paid: false }
    }
    return { billId: params['id'] ?? '', paid: params['paid'] === 'true' }
  },
}
