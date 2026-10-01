import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createSb: vi.fn(),
  createServerClient: vi.fn(),
}))

// If a guard failed to short-circuit, these would be the first thing touched —
// so asserting they were never called proves nothing was reserved or created.
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createSb }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createServerClient }))
vi.mock('@/lib/auth/getCurrentUser', () => ({ getCurrentUser: vi.fn() }))
vi.mock('@/lib/booking/notify', () => ({ notifyConfirmed: vi.fn(), BOOKING_SITE_URL: 'http://x' }))
vi.mock('@/lib/booking/actions', () => ({ effectiveGenderCapacity: vi.fn(), findFreeVaidya: vi.fn() }))

import {
  onlinePaymentsAvailable,
  PAYMENTS_CLOSED_MESSAGE,
  SHOP_PAYMENTS_CLOSED_MESSAGE,
} from '../availability'
import { createInstantGroupBooking, createInstantTreatmentBooking } from '@/lib/booking/instant'
import { createProductOrder } from '@/lib/checkout/actions'

const ENV_KEYS = [
  'PAYMENTS_PROVIDER',
  'HITPAY_API_KEY',
  'HITPAY_SIGNATURE_SALT',
  'PAYMENTS_ALLOW_STUB',
  'NODE_ENV',
] as const
const saved: Record<string, string | undefined> = {}

function setEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>) {
  for (const k of ENV_KEYS) delete (process.env as Record<string, string | undefined>)[k]
  for (const [k, v] of Object.entries(values)) {
    if (v !== undefined) (process.env as Record<string, string | undefined>)[k] = v
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  for (const k of ENV_KEYS) saved[k] = process.env[k]
})
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete (process.env as Record<string, string | undefined>)[k]
    else (process.env as Record<string, string | undefined>)[k] = saved[k]
  }
})

describe('onlinePaymentsAvailable', () => {
  it('is closed on hitpay with no key', () => {
    setEnv({ PAYMENTS_PROVIDER: 'hitpay', NODE_ENV: 'production' })
    expect(onlinePaymentsAvailable()).toBe(false)
  })

  it('is closed on hitpay with a key but no webhook salt (bills could never be confirmed)', () => {
    setEnv({ PAYMENTS_PROVIDER: 'hitpay', HITPAY_API_KEY: 'k', NODE_ENV: 'production' })
    expect(onlinePaymentsAvailable()).toBe(false)
  })

  it('treats blank / whitespace values as unset', () => {
    setEnv({ PAYMENTS_PROVIDER: 'hitpay', HITPAY_API_KEY: '   ', HITPAY_SIGNATURE_SALT: '', NODE_ENV: 'production' })
    expect(onlinePaymentsAvailable()).toBe(false)
  })

  it('opens by itself once both the key and the salt are set', () => {
    setEnv({ PAYMENTS_PROVIDER: 'hitpay', HITPAY_API_KEY: 'k', HITPAY_SIGNATURE_SALT: 's', NODE_ENV: 'production' })
    expect(onlinePaymentsAvailable()).toBe(true)
  })

  it('is closed in production on the test stub — it must never take payments there', () => {
    setEnv({ PAYMENTS_PROVIDER: 'stub', NODE_ENV: 'production' })
    expect(onlinePaymentsAvailable()).toBe(false)
  })

  it('stays open outside production on the stub, so local development is unchanged', () => {
    setEnv({ PAYMENTS_PROVIDER: 'stub', NODE_ENV: 'development' })
    expect(onlinePaymentsAvailable()).toBe(true)
  })
})

describe('paid paths refuse cleanly while payment is closed', () => {
  beforeEach(() => setEnv({ PAYMENTS_PROVIDER: 'hitpay', NODE_ENV: 'production' }))

  it('treatment booking returns the WhatsApp message and reserves nothing', async () => {
    const res = await createInstantTreatmentBooking({
      bookingKind: 'treatment',
      treatmentId: 't1',
      acceptedPolicies: true,
      patientName: 'A',
      patientPhone: '+60123456789',
      patientEmail: 'a@example.com',
      patientGender: 'female',
      preferredAt: new Date(Date.now() + 5 * 864e5).toISOString(),
      isGuest: true,
    } as never)
    expect(res).toEqual({ error: PAYMENTS_CLOSED_MESSAGE })
    expect(mocks.createSb).not.toHaveBeenCalled()
  })

  it('group booking returns the same message and reserves nothing', async () => {
    const res = await createInstantGroupBooking({
      treatmentId: 't1',
      patientPhone: '+60123456789',
      patientEmail: 'a@example.com',
      isGuest: true,
      acceptedPolicies: true,
      guests: [],
    })
    expect(res).toEqual({ error: PAYMENTS_CLOSED_MESSAGE })
    expect(mocks.createSb).not.toHaveBeenCalled()
  })

  it('shop checkout refuses before creating an order or reserving stock', async () => {
    const res = await createProductOrder({})
    expect(res).toEqual({ ok: false, error: SHOP_PAYMENTS_CLOSED_MESSAGE })
    expect(mocks.createSb).not.toHaveBeenCalled()
  })

  it('the message points the customer at WhatsApp rather than at an error', () => {
    expect(PAYMENTS_CLOSED_MESSAGE).toMatch(/WhatsApp/)
    expect(SHOP_PAYMENTS_CLOSED_MESSAGE).toMatch(/WhatsApp/)
  })
})

describe('paid paths proceed once payment is open', () => {
  it('treatment booking gets past the guard (and then fails later on the stubbed database, not on the guard)', async () => {
    setEnv({ PAYMENTS_PROVIDER: 'hitpay', HITPAY_API_KEY: 'k', HITPAY_SIGNATURE_SALT: 's', NODE_ENV: 'production' })
    mocks.createSb.mockReturnValue({
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
    })
    const res = await createInstantTreatmentBooking({
      bookingKind: 'treatment',
      treatmentId: 't1',
      acceptedPolicies: true,
      patientName: 'A',
      patientPhone: '+60123456789',
      patientEmail: 'a@example.com',
      patientGender: 'female',
      preferredAt: new Date(Date.now() + 5 * 864e5).toISOString(),
      isGuest: true,
    } as never)
    expect(res).toEqual({ error: 'Treatment not found.' })
    expect(mocks.createSb).toHaveBeenCalled()
  })
})
