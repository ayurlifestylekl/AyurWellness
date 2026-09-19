import 'server-only'
import { canManageBooking } from './management-access'

/**
 * Authorize access to a booking's status/pay/cancel surface.
 * Allowed when the signed link token matches, OR the requester is the
 * signed-in customer who owns the booking.
 */
export async function canAccessBooking(
  id: string,
  customerId: string | null,
  token: string | null | undefined,
): Promise<boolean> {
  return canManageBooking(id, customerId, token)
}
