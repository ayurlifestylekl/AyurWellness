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
const SECRET =
  process.env.BOOKING_LINK_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  (process.env.NODE_ENV === 'production'
    ? // Never sign production booking links with a public constant — tokens would
      // be forgeable. Fail loudly instead. (In practice the service-role key is
      // always set in prod, so this never triggers.)
      (() => {
        throw new Error('BOOKING_LINK_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is required in production for booking-link signing.')
      })()
    : 'dev-only-secret')

export function createBookingToken(id: string): string {
  return createHmac('sha256', SECRET).update(id).digest('base64url').slice(0, 24)
}

export function verifyBookingToken(id: string, token: string | null | undefined): boolean {
  if (!token) return false
  const expected = createBookingToken(id)
  const a = Buffer.from(expected)
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}
