'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient as createSb } from '@supabase/supabase-js'
import { requireProductManagementSession, type ActionResult } from './actions'

function db() {
  return createSb(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export interface ShippingZoneRow {
  id: string
  name: string
  countryCode: string
  baseRateRm: number
  perKgRateRm: number
  freeThresholdRm: number | null
  updatedAt: string
}

export async function listShippingZones(): Promise<ShippingZoneRow[]> {
  await requireProductManagementSession()
  const { data, error } = await db()
    .from('shipping_zones')
    .select('id, name, country_code, base_rate_rm, per_kg_rate_rm, free_threshold_rm, updated_at')
    .eq('is_active', true)
    .order('sort_order')
  if (error) throw error
  return (data ?? []).map((z) => ({
    id: z.id,
    name: z.name,
    countryCode: z.country_code,
    baseRateRm: Number(z.base_rate_rm),
    perKgRateRm: Number(z.per_kg_rate_rm),
    freeThresholdRm: z.free_threshold_rm === null ? null : Number(z.free_threshold_rm),
    updatedAt: z.updated_at,
  }))
}

const money = z.number().finite().min(0, 'Rates cannot be negative.').max(10000, 'That rate looks too high.')

const UpdateZoneSchema = z.object({
  id: z.string().uuid(),
  baseRateRm: money,
  perKgRateRm: money,
  freeThresholdRm: money.positive('Free-shipping threshold must be above RM 0, or left empty.').nullable(),
})

export async function updateShippingZone(raw: unknown): Promise<ActionResult> {
  await requireProductManagementSession()
  const parsed = UpdateZoneSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid rates.' }
  const { id, baseRateRm, perKgRateRm, freeThresholdRm } = parsed.data

  const { error } = await db()
    .from('shipping_zones')
    .update({
      base_rate_rm: Number(baseRateRm.toFixed(2)),
      per_kg_rate_rm: Number(perKgRateRm.toFixed(2)),
      free_threshold_rm: freeThresholdRm === null ? null : Number(freeThresholdRm.toFixed(2)),
    })
    .eq('id', id)
  if (error) {
    console.error('[product-management] updateShippingZone failed', error)
    return { ok: false, error: 'Could not save shipping rates.' }
  }
  revalidatePath('/product-management/shipping')
  return { ok: true }
}
