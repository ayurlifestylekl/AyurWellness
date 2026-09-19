import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Stateless access token for a booking's public status/pay/cancel link.
 * Guests have no session, so the request page is protected by an HMAC of the
 * appointment id rather than the (guessable) id alone. Signed-in owners are
 * authorised by ownership instead and don't need the token.
 *
 * No DB column needed — the token is derived, not stored.
 */
/**
 * Resolved per call rather than at module load: evaluating this at module
 * scope crashed `next build` while collecting page data on any deploy without
 * the service-role key set. Failing here instead keeps the security guarantee
 * (a production link is never signed with a guessable constant) while letting
 * the build succeed — nothing can issue a forgeable token either way.
 */
function bookingSecret(): string {
  const secret =
    process.env.BOOKING_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('BOOKING_LINK_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is required in production for booking-link signing.')
  }
  return 'dev-only-secret'
}

export function createBookingToken(id: string): string {
  return createHmac('sha256', bookingSecret()).update(id).digest('base64url').slice(0, 24)
}

export function verifyBookingToken(id: string, token: string | null | undefined): boolean {
  if (!token) return false
  const expected = createBookingToken(id)
  const a = Buffer.from(expected)
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}
