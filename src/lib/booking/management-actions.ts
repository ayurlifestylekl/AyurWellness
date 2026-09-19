'use server'

import { randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { notifyGuestManagementOtp } from './notify'
import {
  generateOtp,
  hashManagementValue,
  normalizeBookingEmail,
} from './guest-recovery'

export type ManagementActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      error: string
      code: 'UNAUTHORIZED' | 'POLICY_CLOSED' | 'SLOT_FULL' | 'INVALID_INPUT' | 'PROVIDER_ERROR'
    }

const NEUTRAL_REQUEST_MESSAGE = 'If that email has eligible bookings, a code has been sent.'
type RequestResult = ManagementActionResult<{ message: typeof NEUTRAL_REQUEST_MESSAGE }>
type VerifyResult = ManagementActionResult<{ href: string }>

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function neutralRequestResult(): RequestResult {
  return { ok: true, data: { message: NEUTRAL_REQUEST_MESSAGE } }
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function sourceIpHash(): Promise<string> {
  if (process.env.VERCEL !== '1') return hashManagementValue('unavailable')
  const requestHeaders = await headers()
  return hashManagementValue(
    (requestHeaders.get('x-vercel-forwarded-for') ?? 'unavailable')
      .split(',')[0]
      .trim() || 'unavailable',
  )
}

/**
 * Request a short-lived recovery code without revealing whether a booking exists.
 * Every externally visible outcome is intentionally identical.
 */
export async function requestGuestManagementOtp(email: string): Promise<RequestResult> {
  const normalizedEmail = normalizeBookingEmail(typeof email === 'string' ? email : '')
  if (!validEmail(normalizedEmail)) return neutralRequestResult()

  try {
    const code = generateOtp()
    const emailHash = hashManagementValue(normalizedEmail)
    const ipHash = await sourceIpHash()
    const sb = admin()
    const { data: otpId, error } = await sb.rpc('reserve_booking_management_otp', {
      p_email_hash: emailHash,
      p_code_hash: hashManagementValue(code),
      p_request_ip_hash: ipHash,
    })

    if (error || typeof otpId !== 'string') return neutralRequestResult()

    const delivered = await notifyGuestManagementOtp({ to: normalizedEmail, code })
    if (!delivered) {
      const { error: invalidationError } = await sb
        .from('booking_management_otps')
        .update({ consumed_at: new Date().toISOString() })
        .eq('id', otpId)
      if (invalidationError) console.error('[booking-recovery] OTP invalidation failed')
    }
  } catch {
    // Recovery is deliberately fail-closed and enumeration-neutral.
  }

  return neutralRequestResult()
}

export async function verifyGuestManagementOtp(email: string, code: string): Promise<VerifyResult> {
  const normalizedEmail = normalizeBookingEmail(typeof email === 'string' ? email : '')
  const normalizedCode = typeof code === 'string' ? code.trim() : ''
  if (!validEmail(normalizedEmail) || !/^\d{6}$/.test(normalizedCode)) {
    return { error: 'Enter a valid email and six-digit code.', code: 'INVALID_INPUT' }
  }

  const sb = admin()
  const emailHash = hashManagementValue(normalizedEmail)
  const rawToken = randomBytes(32).toString('base64url')
  const { data, error } = await sb.rpc('verify_booking_management_otp', {
    p_email_hash: emailHash,
    p_code_hash: hashManagementValue(normalizedCode),
    p_normalized_email: normalizedEmail,
    p_token_hash: hashManagementValue(rawToken),
  })

  if (error || (data !== 'granted' && data !== 'unauthorized')) {
    return { error: 'We could not restore access right now. Please try again.', code: 'PROVIDER_ERROR' }
  }

  if (data === 'unauthorized') {
    return {
      error: 'That code is invalid or has expired. Request a new code and try again.',
      code: 'UNAUTHORIZED',
    }
  }

  return { ok: true, data: { href: `/book/manage?t=${encodeURIComponent(rawToken)}` } }
}
