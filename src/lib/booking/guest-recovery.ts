import 'server-only'
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

function managementSecret(): string {
  const secret = process.env.BOOKING_LINK_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'test') return 'booking-management-test-secret'
  throw new Error('BOOKING_LINK_SECRET is required for booking management recovery.')
}

export function normalizeBookingEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function hashManagementValue(value: string): string {
  return createHmac('sha256', managementSecret()).update(value).digest('hex')
}

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export function verifyOtpHash(code: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashManagementValue(code), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
