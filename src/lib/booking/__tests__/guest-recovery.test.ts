import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockFrom,
  mockHeadersGet,
  mockNotifyGuestManagementOtp,
  mockRpc,
  mockSessionClient,
} = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockHeadersGet: vi.fn(),
  mockNotifyGuestManagementOtp: vi.fn(),
  mockRpc: vi.fn(),
  mockSessionClient: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('next/headers', () => ({ headers: vi.fn(async () => ({ get: mockHeadersGet })) }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: mockFrom, rpc: mockRpc }),
}))
vi.mock('../notify', () => ({ notifyGuestManagementOtp: mockNotifyGuestManagementOtp }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mockSessionClient }))

import {
  generateOtp,
  hashManagementValue,
  normalizeBookingEmail,
  verifyOtpHash,
} from '../guest-recovery'
import { requestGuestManagementOtp, verifyGuestManagementOtp } from '../management-actions'
import {
  canManageBooking,
  canManageBookingTarget,
  hasActiveManagementGrant,
} from '../management-access'
import { createBookingToken } from '../token'

const NEUTRAL = {
  ok: true,
  data: { message: 'If that email has eligible bookings, a code has been sent.' },
}

function fluentGrant(result: { data: { id: string } | null; error: unknown }) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    gt: vi.fn(),
    contains: vi.fn(),
    maybeSingle: vi.fn(async () => result),
  }
  builder.select.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.is.mockReturnValue(builder)
  builder.gt.mockReturnValue(builder)
  builder.contains.mockReturnValue(builder)
  return builder
}

function appointmentLookup(rows: Array<{ id: string; customer_id: string | null; group_id: string | null }>) {
  const inQuery = vi.fn(async () => ({ data: rows, error: null }))
  return { select: vi.fn(() => ({ in: inQuery })), inQuery }
}

beforeEach(() => {
  mockFrom.mockReset()
  mockHeadersGet.mockReset()
  mockNotifyGuestManagementOtp.mockReset()
  mockRpc.mockReset()
  mockSessionClient.mockReset()
  process.env.VERCEL = '1'
  mockHeadersGet.mockImplementation((name: string) =>
    name === 'x-vercel-forwarded-for' ? '203.0.113.5, 10.0.0.1' : null,
  )
  mockNotifyGuestManagementOtp.mockResolvedValue(true)
})

afterEach(() => {
  delete process.env.VERCEL
})

describe('guest recovery primitives', () => {
  it('normalizes email without exposing it in a lookup key', () => {
    expect(normalizeBookingEmail(' Guest@Example.COM ')).toBe('guest@example.com')
    expect(hashManagementValue('guest@example.com')).toMatch(/^[a-f0-9]{64}$/)
  })

  it('creates a six-digit code and verifies only its hash', () => {
    const code = generateOtp()
    expect(code).toMatch(/^\d{6}$/)
    expect(verifyOtpHash(code, hashManagementValue(code))).toBe(true)
    expect(verifyOtpHash('000000', hashManagementValue(code))).toBe(code === '000000')
  })
})

describe('guest OTP request behavior', () => {
  it('uses the atomic reservation RPC and sends the same workflow for an unknown email', async () => {
    mockRpc.mockResolvedValue({ data: 'otp-1', error: null })

    const result = await requestGuestManagementOtp(' Unknown@Example.com ')

    expect(result).toEqual(NEUTRAL)
    expect(mockRpc).toHaveBeenCalledWith('reserve_booking_management_otp', expect.objectContaining({
      p_email_hash: hashManagementValue('unknown@example.com'),
      p_request_ip_hash: hashManagementValue('203.0.113.5'),
    }))
    const sent = mockNotifyGuestManagementOtp.mock.calls[0][0]
    expect(sent.to).toBe('unknown@example.com')
    expect(sent.code).toMatch(/^\d{6}$/)
    expect(mockRpc.mock.calls[0][1].p_code_hash).toBe(hashManagementValue(sent.code))
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns the exact neutral response when throttled without sending', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })

    expect(await requestGuestManagementOtp('guest@example.com')).toEqual(NEUTRAL)
    expect(mockNotifyGuestManagementOtp).not.toHaveBeenCalled()
  })

  it('returns the exact neutral response on an internal reservation failure', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'private database failure' } })

    expect(await requestGuestManagementOtp('guest@example.com')).toEqual(NEUTRAL)
    expect(mockNotifyGuestManagementOtp).not.toHaveBeenCalled()
  })

  it('invalidates the exact reserved OTP when delivery fails', async () => {
    const eq = vi.fn(async () => ({ error: null }))
    const update = vi.fn(() => ({ eq }))
    mockRpc.mockResolvedValue({ data: 'otp-delivery-failed', error: null })
    mockNotifyGuestManagementOtp.mockResolvedValue(false)
    mockFrom.mockImplementation((table: string) => {
      expect(table).toBe('booking_management_otps')
      return { update }
    })

    expect(await requestGuestManagementOtp('guest@example.com')).toEqual(NEUTRAL)
    expect(update).toHaveBeenCalledWith({ consumed_at: expect.any(String) })
    expect(eq).toHaveBeenCalledWith('id', 'otp-delivery-failed')
  })

  it('keeps an invalidation write failure neutral and logs no database details', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    const eq = vi.fn(async () => ({ error: { message: 'private-otp-hash-and-database-details' } }))
    const update = vi.fn(() => ({ eq }))
    mockRpc.mockResolvedValue({ data: 'otp-delivery-failed', error: null })
    mockNotifyGuestManagementOtp.mockResolvedValue(false)
    mockFrom.mockReturnValue({ update })

    const result = await requestGuestManagementOtp('guest@example.com')

    expect(result).toEqual(NEUTRAL)
    expect(errorLog).toHaveBeenCalledWith('[booking-recovery] OTP invalidation failed')
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain('private-otp-hash-and-database-details')
    errorLog.mockRestore()
  })

  it('ignores spoofable forwarding headers outside Vercel', async () => {
    delete process.env.VERCEL
    mockHeadersGet.mockImplementation((name: string) => {
      if (name === 'x-forwarded-for') return '198.51.100.44'
      if (name === 'x-real-ip') return '198.51.100.45'
      return null
    })
    mockRpc.mockResolvedValue({ data: null, error: null })

    await requestGuestManagementOtp('guest@example.com')

    expect(mockRpc.mock.calls[0][1].p_request_ip_hash).toBe(hashManagementValue('unavailable'))
    expect(mockHeadersGet).not.toHaveBeenCalledWith('x-forwarded-for')
    expect(mockHeadersGet).not.toHaveBeenCalledWith('x-real-ip')
  })
})

describe('guest OTP verification behavior', () => {
  it('maps an atomic granted result to the opaque management href', async () => {
    mockRpc.mockResolvedValue({ data: 'granted', error: null })

    const result = await verifyGuestManagementOtp(' Guest@Example.com ', '123456')

    expect('ok' in result && result.ok).toBe(true)
    if (!('ok' in result)) throw new Error('expected granted result')
    const rawToken = new URL(result.data.href, 'https://example.test').searchParams.get('t')
    expect(rawToken).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(mockRpc).toHaveBeenCalledWith('verify_booking_management_otp', {
      p_code_hash: hashManagementValue('123456'),
      p_email_hash: hashManagementValue('guest@example.com'),
      p_normalized_email: 'guest@example.com',
      p_token_hash: hashManagementValue(rawToken!),
    })
  })

  it('maps rejected codes and ineligible emails to UNAUTHORIZED', async () => {
    mockRpc.mockResolvedValue({ data: 'unauthorized', error: null })

    const result = await verifyGuestManagementOtp('guest@example.com', '123456')

    expect(result).toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('maps an RPC failure to PROVIDER_ERROR without exposing internals', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'private SQL details' } })

    const result = await verifyGuestManagementOtp('guest@example.com', '123456')

    expect(result).toEqual({
      error: 'We could not restore access right now. Please try again.',
      code: 'PROVIDER_ERROR',
    })
    expect(JSON.stringify(result)).not.toContain('private SQL details')
  })
})

describe('management authorization behavior', () => {
  it('accepts a scoped grant before falling through to signed-in ownership', async () => {
    const grant = fluentGrant({ data: { id: 'grant-1' }, error: null })
    mockFrom.mockReturnValue(grant)

    expect(await canManageBooking('appointment-1', null, 'opaque-token')).toBe(true)
    expect(grant.contains).toHaveBeenCalledWith('appointment_ids', ['appointment-1'])
    expect(mockSessionClient).not.toHaveBeenCalled()
  })

  it('falls through a missing grant to signed-in ownership', async () => {
    mockFrom.mockReturnValue(fluentGrant({ data: null, error: null }))
    mockSessionClient.mockResolvedValue({ auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'owner-1' } } })) } })

    expect(await canManageBooking('appointment-1', 'owner-1', 'not-a-grant')).toBe(true)
  })

  it('scopes opaque target access to the target appointment ID', async () => {
    const grant = fluentGrant({ data: { id: 'grant-1' }, error: null })
    mockFrom.mockReturnValue(grant)

    expect(await canManageBookingTarget('anchor-1', 'target-2', 'opaque-token')).toBe(true)
    expect(grant.contains).toHaveBeenCalledWith('appointment_ids', ['target-2'])
  })

  it('preserves detached legacy group access only for the retained audit group', async () => {
    const grant = fluentGrant({ data: null, error: null })
    const appointments = appointmentLookup([
      { id: 'anchor-1', customer_id: null, group_id: 'audit-group' },
      { id: 'target-2', customer_id: null, group_id: 'audit-group' },
    ])
    mockFrom.mockImplementation((table: string) => table === 'booking_management_grants' ? grant : appointments)

    expect(await canManageBookingTarget('anchor-1', 'target-2', createBookingToken('anchor-1'))).toBe(true)
  })

  it('validates token-only recovered state against an active persisted grant', async () => {
    const grant = fluentGrant({ data: { id: 'grant-1' }, error: null })
    mockFrom.mockReturnValue(grant)

    expect(await hasActiveManagementGrant('opaque-token')).toBe(true)
    expect(grant.contains).not.toHaveBeenCalled()
  })

  it('rejects a random token with no active persisted grant', async () => {
    mockFrom.mockReturnValue(fluentGrant({ data: null, error: null }))

    expect(await hasActiveManagementGrant('random-token')).toBe(false)
  })
})

describe('management recovery page contract', () => {
  it('validates a token server-side instead of trusting query-string presence', () => {
    const source = readFileSync(path.resolve(process.cwd(), 'src/app/(public)/book/manage/page.tsx'), 'utf8')
    expect(source).toContain('await hasActiveManagementGrant(searchParams.t)')
    expect(source).not.toContain('Boolean(searchParams.t)')
  })
})
