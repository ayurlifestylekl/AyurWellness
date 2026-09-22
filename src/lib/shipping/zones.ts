import type { SupabaseClient } from '@supabase/supabase-js'

export interface ShippingZone {
  id: string
  name: string
  countryCode: string
  baseRateRm: number
  perKgRateRm: number
  freeThresholdRm: number | null
}

export interface ShippingQuote {
  zone: ShippingZone
  rateRm: number
  freeThresholdRm: number | null
}

// Fallback grouping for countries that don't have an exact zone row.
const ASEAN_CODES = new Set(['BN', 'KH', 'ID', 'LA', 'MM', 'PH', 'SG', 'TH', 'VN'])
const APAC_CODES = new Set([
  'AU', 'BD', 'BT', 'CN', 'FJ', 'HK', 'IN', 'JP', 'KR', 'LK', 'MN', 'MV', 'MY',
  'NP', 'NZ', 'PK', 'PG', 'TW', 'TL', 'TO', 'VU', 'WS',
])

function groupCodeForCountry(countryCode: string): string {
  const upper = countryCode.toUpperCase()
  if (upper === 'MY') return 'MY'
  if (ASEAN_CODES.has(upper)) return '*-ASEAN'
  if (APAC_CODES.has(upper)) return '*-APAC'
  return '*'
}

export async function getShippingZone(
  sb: SupabaseClient,
  countryCode: string,
): Promise<ShippingZone | null> {
  const code = countryCode.toUpperCase()

  const { data: exact } = await sb
    .from('shipping_zones')
    .select('id, name, country_code, base_rate_rm, per_kg_rate_rm, free_threshold_rm')
    .eq('country_code', code)
    .eq('is_active', true)
    .maybeSingle()

  if (exact) {
    return {
      id: exact.id as string,
      name: exact.name as string,
      countryCode: exact.country_code as string,
      baseRateRm: Number(exact.base_rate_rm),
      perKgRateRm: Number(exact.per_kg_rate_rm),
      freeThresholdRm: exact.free_threshold_rm ? Number(exact.free_threshold_rm) : null,
    }
  }

  // Try grouped region code (ASEAN, APAC, Rest of World).
  const group = groupCodeForCountry(code)
  const { data: groupZone } = await sb
    .from('shipping_zones')
    .select('id, name, country_code, base_rate_rm, per_kg_rate_rm, free_threshold_rm')
    .eq('country_code', group)
    .eq('is_active', true)
    .maybeSingle()

  if (groupZone) {
    return {
      id: groupZone.id as string,
      name: groupZone.name as string,
      countryCode: groupZone.country_code as string,
      baseRateRm: Number(groupZone.base_rate_rm),
      perKgRateRm: Number(groupZone.per_kg_rate_rm),
      freeThresholdRm: groupZone.free_threshold_rm ? Number(groupZone.free_threshold_rm) : null,
    }
  }

  return null
}

export function calculateShipping(
  zone: ShippingZone,
  subtotalRm: number,
  totalWeightGrams: number,
): ShippingQuote {
  if (zone.freeThresholdRm && subtotalRm >= zone.freeThresholdRm) {
    return { zone, rateRm: 0, freeThresholdRm: zone.freeThresholdRm }
  }

  const weightKg = Math.max(0, totalWeightGrams / 1000)
  const roundedKg = Math.ceil(weightKg)
  const rate = zone.baseRateRm + roundedKg * zone.perKgRateRm
  return { zone, rateRm: Number(rate.toFixed(2)), freeThresholdRm: zone.freeThresholdRm }
}
