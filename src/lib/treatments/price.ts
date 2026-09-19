import type { TreatmentPricing } from '@/types/treatments'

/**
 * Human-readable price string for a treatment.
 *
 * Priority:
 *   1. An explicit `priceLabel` override (e.g. "From RM50", "On consultation").
 *   2. The numeric `price` formatted as "RM<price>".
 *   3. A sensible fallback derived from the booking type
 *      ("On consultation" / "Enquiry only" / "On consultation").
 */
export function formatPrice(t: TreatmentPricing): string {
  if (t.priceLabel) return t.priceLabel
  if (typeof t.price === 'number') return `RM${t.price}`
  if (t.bookingType === 'enquiry') return 'Enquiry only'
  return 'On consultation'
}

/**
 * Short advance-notice label, e.g. "Book 2 days ahead", or null when the
 * therapy is same-day bookable.
 */
export function leadTimeLabel(t: TreatmentPricing): string | null {
  const hours = t.bookingLeadTimeHours
  if (!hours || hours <= 0) return null
  const days = Math.round(hours / 24)
  if (days >= 1) return `Book ${days} day${days > 1 ? 's' : ''} ahead`
  return `Book ${hours}h ahead`
}
