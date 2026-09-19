/** Format a short, human-readable booking reference from a full UUID.
 *  This is deterministic and does not depend on a stored column. When the
 *  `receipt_code` column is added to the `appointments` table, this helper can
 *  be updated to prefer that stored value and fall back to the UUID prefix.
 */
export function bookingRef(id: string): string {
  return id.slice(0, 8).toUpperCase()
}
