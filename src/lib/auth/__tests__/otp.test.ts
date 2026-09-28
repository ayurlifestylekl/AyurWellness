import { afterEach, describe, expect, it, vi } from 'vitest'
import { customerOtpRequired } from '../otp'

afterEach(() => vi.unstubAllEnvs())

describe('customerOtpRequired', () => {
  it('is always on in production, even if the env flag says false', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_REQUIRE_OTP', 'false')
    expect(customerOtpRequired()).toBe(true)
  })

  it('can only be relaxed outside production', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_REQUIRE_OTP', 'false')
    expect(customerOtpRequired()).toBe(false)
  })

  it('defaults to on when the flag is unset', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_REQUIRE_OTP', '')
    expect(customerOtpRequired()).toBe(true)
  })
})
