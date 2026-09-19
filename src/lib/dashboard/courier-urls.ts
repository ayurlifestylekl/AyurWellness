import type { Database } from '@/lib/database.types'

export type CourierService = NonNullable<
  Database['public']['Tables']['orders']['Row']['courier_service']
>

/**
 * Maps each supported Malaysian courier to a function that builds the
 * tracking URL for a given tracking number. Self-Pickup has no URL.
 */
const TRACKING_URLS: Record<CourierService, ((n: string) => string) | null> = {
  'Pos Laju': (n) =>
    `https://www.pos.com.my/postal-services/quick-access/?track-trace=${encodeURIComponent(n)}`,
  'J&T Express': (n) =>
    `https://www.jtexpress.my/index/query/gzquery.html?bills=${encodeURIComponent(n)}`,
  'DHL': (n) =>
    `https://www.dhl.com/my-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(n)}`,
  'GDex': (n) =>
    `https://www.gdexpress.com/home/parcel_tracking?tn=${encodeURIComponent(n)}`,
  'Ninja Van': (n) =>
    `https://www.ninjavan.co/en-my/tracking?id=${encodeURIComponent(n)}`,
  'Self-Pickup': null,
}

/**
 * Resolve a tracking URL for a courier + tracking number combo.
 * Returns null when the courier has no public tracking page (e.g.
 * Self-Pickup) or when either input is missing.
 */
export function getCourierTrackingUrl(
  courier: CourierService | null,
  trackingNumber: string | null
): string | null {
  if (!courier || !trackingNumber) return null
  const builder = TRACKING_URLS[courier]
  return builder ? builder(trackingNumber) : null
}

/**
 * Human-friendly label for the external "Track on [Courier]" button.
 * Mirrors the courier name but kept as its own helper in case we want
 * to abbreviate or rebrand any of these later.
 */
export function getCourierLabel(courier: CourierService | null): string {
  if (!courier) return ''
  return courier
}
