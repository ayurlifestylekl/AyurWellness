import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }))

// If a guard failed to short-circuit, the first thing each action does is ask for a
// Supabase client — so "never called" proves no email was attempted.
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
// Actions that build links read the request's host; give them one.
vi.mock('next/headers', () => ({ headers: async () => new Headers({ host: 'localhost:3000' }), cookies: async () => ({ getAll: () => [], get: () => undefined, set: () => {} }) }))

import { ACCOUNTS_CLOSED_MESSAGE, memberAccountsOpen } from '../accounts'
import { requestPasswordReset } from '@/actions/auth/requestPasswordReset'
import { requestSignInOtp } from '@/actions/auth/requestSignInOtp'
import { resendEmailOtp } from '@/actions/auth/resendEmailOtp'
import { signUpCustomer } from '@/actions/auth/signUpCustomer'
import { signUpFromInvite } from '@/actions/auth/signUpFromInvite'

const KEYS = ['NODE_ENV', 'MEMBER_ACCOUNTS_OPEN'] as const
const saved: Record<string, string | undefined> = {}
const env = process.env as Record<string, string | undefined>

function setEnv(v: Partial<Record<(typeof KEYS)[number], string>>) {
  for (const k of KEYS) delete env[k]
  for (const [k, val] of Object.entries(v)) env[k] = val
}

beforeEach(() => {
  vi.clearAllMocks()
  for (const k of KEYS) saved[k] = env[k]
})
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete env[k]
    else env[k] = saved[k]
  }
})

describe('memberAccountsOpen', () => {
  it('is closed in production by default', () => {
    setEnv({ NODE_ENV: 'production' })
    expect(memberAccountsOpen()).toBe(false)
  })

  it('opens only on an explicit "true"', () => {
    setEnv({ NODE_ENV: 'production', MEMBER_ACCOUNTS_OPEN: 'true' })
    expect(memberAccountsOpen()).toBe(true)
    for (const v of ['false', '1', 'yes', 'TRUE', '']) {
      setEnv({ NODE_ENV: 'production', MEMBER_ACCOUNTS_OPEN: v })
      expect(memberAccountsOpen()).toBe(false)
    }
  })

  it('is always open outside production, so local development is unchanged', () => {
    setEnv({ NODE_ENV: 'development' })
    expect(memberAccountsOpen()).toBe(true)
    setEnv({ NODE_ENV: 'test' })
    expect(memberAccountsOpen()).toBe(true)
  })
})

describe('email-sending auth actions refuse while accounts are closed', () => {
  beforeEach(() => setEnv({ NODE_ENV: 'production' }))
  const closed = { ok: false, error: ACCOUNTS_CLOSED_MESSAGE }

  it('password reset', async () => {
    expect(await requestPasswordReset('a@example.com')).toEqual(closed)
    expect(mocks.createClient).not.toHaveBeenCalled()
  })
  it('resend sign-up code', async () => {
    expect(await resendEmailOtp('a@example.com')).toEqual(closed)
    expect(mocks.createClient).not.toHaveBeenCalled()
  })
  it('sign-in code request', async () => {
    expect(await requestSignInOtp('a@example.com', 'whatever123')).toEqual(closed)
    expect(mocks.createClient).not.toHaveBeenCalled()
  })
  it('customer sign-up', async () => {
    expect(
      await signUpCustomer({ email: 'a@example.com', password: 'longenough1', fullName: 'A', phone: '0123456789' }),
    ).toEqual(closed)
    expect(mocks.createClient).not.toHaveBeenCalled()
  })
  it('partner invite sign-up', async () => {
    expect(await signUpFromInvite('some-invite-token', 'longenough1')).toEqual(closed)
    expect(mocks.createClient).not.toHaveBeenCalled()
  })

  it('the message points people to a guest booking / WhatsApp, not a dead end', () => {
    expect(ACCOUNTS_CLOSED_MESSAGE).toMatch(/guest/i)
    expect(ACCOUNTS_CLOSED_MESSAGE).toMatch(/WhatsApp/)
  })
})

describe('the same actions run normally once accounts are open', () => {
  it('get past the guard and on to Supabase', async () => {
    setEnv({ NODE_ENV: 'production', MEMBER_ACCOUNTS_OPEN: 'true' })
    mocks.createClient.mockRejectedValue(new Error('stop here: guard passed'))
    await expect(requestPasswordReset('a@example.com')).rejects.toThrow('guard passed')
    expect(mocks.createClient).toHaveBeenCalled()
  })
})
