/**
 * Commerce (online product shop) feature flag.
 *
 * The clinic runs on bookings, consultations and treatments — not an online
 * store. So the shop side of the admin Overview (product orders, revenue,
 * fulfilment, inventory/low-stock, partner invites, top-selling, promos) is
 * ARCHIVED by default: hidden from the dashboard but kept in the codebase.
 *
 * To bring it all back, either set NEXT_PUBLIC_COMMERCE_ENABLED=true in the
 * environment, or flip the default below to `true`.
 */
export const COMMERCE_ENABLED = process.env.NEXT_PUBLIC_COMMERCE_ENABLED === 'true'
