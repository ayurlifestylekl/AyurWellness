import type { SupabaseClient } from '@supabase/supabase-js'
import type { PromoRow, CustomerPromoRow, WalletItem } from './format'

/**
 * Fetch every grant the customer has, joined to its promo definition.
 * RLS auto-filters to auth.uid() — the explicit `customer_id` filter is
 * defensive and makes intent obvious.
 */
export async function getWallet(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string
): Promise<WalletItem[]> {
  const { data, error } = await supabase
    .from('customer_promos')
    .select('*, promo:promos(*)')
    .eq('customer_id', customerId)
    .order('granted_at', { ascending: false })

  if (error) {
    console.error('[promos/getWallet] failed:', error.message)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any): WalletItem => {
    const promo: PromoRow = Array.isArray(row.promo) ? row.promo[0] : row.promo
    const grant: CustomerPromoRow = {
      id: row.id,
      customer_id: row.customer_id,
      promo_id: row.promo_id,
      status: row.status,
      source: row.source,
      granted_at: row.granted_at,
      used_at: row.used_at,
      used_on_order_id: row.used_on_order_id,
    }
    return { grant, promo }
  })
}

/**
 * Look up a promo by its public code. Returns null when not found,
 * inactive, or not flagged is_public. The RLS policy on `promos` is
 * `is_active = TRUE`; we additionally require `is_public = TRUE` for
 * the claim flow.
 */
export async function getPublicPromoByCode(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  code: string
): Promise<PromoRow | null> {
  const normalised = code.trim().toUpperCase()
  if (!normalised) return null

  const { data, error } = await supabase
    .from('promos')
    .select('*')
    .eq('code', normalised)
    .eq('is_public', true)
    .maybeSingle()

  if (error) {
    console.error('[promos/getPublicPromoByCode] failed:', error.message)
    return null
  }
  return (data as PromoRow | null) ?? null
}

/** True when the customer already has a grant for this promo. */
export async function hasGrant(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string,
  promoId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('customer_promos')
    .select('id')
    .eq('customer_id', customerId)
    .eq('promo_id', promoId)
    .maybeSingle()

  if (error) {
    console.error('[promos/hasGrant] failed:', error.message)
    return false
  }
  return Boolean(data)
}
