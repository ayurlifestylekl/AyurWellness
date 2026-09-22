/**
 * Commerce (online product shop) feature flag.
 *
 * Enabled by default — the shop side of the admin Overview (product orders,
 * revenue, fulfilment, inventory/low-stock, partner invites, top-selling,
 * promos) is live alongside clinic bookings/consultations/treatments.
 *
 * To hold it back again (e.g. before product pricing is finalized), set
 * NEXT_PUBLIC_COMMERCE_ENABLED=false in the environment.
 */
export const COMMERCE_ENABLED = process.env.NEXT_PUBLIC_COMMERCE_ENABLED !== 'false'
