import type { Database } from '@/lib/database.types'

export type PromoRow = Database['public']['Tables']['promos']['Row']
export type CustomerPromoRow = Database['public']['Tables']['customer_promos']['Row']

/** A grant joined to its promo row (the shape we render). */
export interface WalletItem {
  grant: CustomerPromoRow
  promo: PromoRow
}

export type EffectiveStatus = 'active' | 'used' | 'expired' | 'revoked'

/**
 * Collapse the persisted grant status with promo expiry to derive the
 * status the customer should actually see. We don't need a cron job —
 * expired-but-active rows are computed on read.
 */
export function effectiveStatus(
  grant: CustomerPromoRow,
  promo: PromoRow,
  nowMs: number = Date.now()
): EffectiveStatus {
  if (grant.status === 'used') return 'used'
  if (grant.status === 'revoked') return 'revoked'
  if (grant.status === 'expired') return 'expired'
  if (promo.is_active === false) return 'expired'
  if (promo.expires_at && new Date(promo.expires_at).getTime() < nowMs) {
    return 'expired'
  }
  return 'active'
}

/** Render the promo value as a short human label. */
export function formatValue(promo: PromoRow): string {
  switch (promo.kind) {
    case 'fixed':
      return `RM ${Number(promo.value_amount ?? 0).toFixed(0)} off`
    case 'percentage':
      return `${Number(promo.value_amount ?? 0).toFixed(0)}% off`
    case 'free-shipping':
      return 'Free shipping'
    default:
      return '—'
  }
}

/** Short applies-to chip label. */
export function formatAppliesTo(promo: PromoRow): string {
  switch (promo.applies_to) {
    case 'products':
      return 'Products'
    case 'treatments':
      return 'Treatments'
    case 'consultation':
      return 'Consultation'
    case 'all':
    default:
      return 'All bookings'
  }
}

/**
 * Sum the fixed-RM value of active vouchers — used in the wallet hero.
 * Percentage offers can't be totalled (depend on basket), so they're
 * surfaced as a separate count.
 */
export function walletTotal(active: WalletItem[]): {
  totalRm: number
  fixedCount: number
  percentageCount: number
  freeShippingCount: number
} {
  let totalRm = 0
  let fixedCount = 0
  let percentageCount = 0
  let freeShippingCount = 0
  for (const item of active) {
    if (item.promo.kind === 'fixed') {
      totalRm += Number(item.promo.value_amount ?? 0)
      fixedCount += 1
    } else if (item.promo.kind === 'percentage') {
      percentageCount += 1
    } else if (item.promo.kind === 'free-shipping') {
      freeShippingCount += 1
    }
  }
  return { totalRm, fixedCount, percentageCount, freeShippingCount }
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Human countdown for expiry; null if no expiry or already past. */
export function expiryLabel(promo: PromoRow, nowMs: number = Date.now()): string | null {
  if (!promo.expires_at) return null
  const expiresMs = new Date(promo.expires_at).getTime()
  const diff = expiresMs - nowMs
  if (diff <= 0) return 'Expired'
  const days = Math.ceil(diff / DAY_MS)
  if (days === 1) return 'Expires tomorrow'
  if (days <= 7) return `Expires in ${days} days`
  if (days <= 30) {
    const weeks = Math.round(days / 7)
    return `Expires in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
  }
  return `Expires ${new Intl.DateTimeFormat('en-MY', { day: 'numeric', month: 'short' }).format(new Date(promo.expires_at))}`
}

/**
 * Split wallet items into three buckets by effective status. Stable order
 * within each bucket — active sorted by soonest expiry, used + expired
 * sorted by most recent first.
 */
export function bucketWallet(items: WalletItem[], nowMs: number = Date.now()): {
  active: WalletItem[]
  used: WalletItem[]
  expired: WalletItem[]
} {
  const active: WalletItem[] = []
  const used: WalletItem[] = []
  const expired: WalletItem[] = []
  for (const item of items) {
    const status = effectiveStatus(item.grant, item.promo, nowMs)
    if (status === 'active') active.push(item)
    else if (status === 'used') used.push(item)
    else expired.push(item) // expired + revoked share the history bucket
  }
  active.sort((a, b) => {
    const aExp = a.promo.expires_at ? new Date(a.promo.expires_at).getTime() : Infinity
    const bExp = b.promo.expires_at ? new Date(b.promo.expires_at).getTime() : Infinity
    return aExp - bExp
  })
  used.sort(
    (a, b) =>
      new Date(b.grant.used_at ?? b.grant.granted_at).getTime() -
      new Date(a.grant.used_at ?? a.grant.granted_at).getTime()
  )
  expired.sort(
    (a, b) =>
      new Date(b.grant.granted_at).getTime() - new Date(a.grant.granted_at).getTime()
  )
  return { active, used, expired }
}
