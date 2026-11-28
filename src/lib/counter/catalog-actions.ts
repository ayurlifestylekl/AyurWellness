'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/staff/guard'
import { toSen } from './rules'

/** Billing items: front desk, doctors and admin can all add, hide and remove them. */

type Result = { ok: true; note?: string } | { ok: false; error: string }

const uuid = z.string().uuid()
const NOT_SET_UP = 'Billing items aren’t set up yet. Please ask your developer to finish the setup.'

function refresh() {
  revalidatePath('/console/items')
  revalidatePath('/doctor/items')
}

const ItemInput = z
  .object({
    id: uuid.optional(),
    kind: z.enum(['service', 'product', 'package']),
    name: z.string().trim().min(1, 'Enter a name.').max(120, 'Keep the name under 120 characters.'),
    priceRm: z.number({ invalid_type_error: 'Enter a price.' }).min(0, 'Enter a price.').max(1_000_000),
    durationMins: z.number().int().min(5).max(600).nullable().optional(),
    sessions: z.number().int().min(1).max(100).nullable().optional(),
    validDays: z.number().int().min(1).max(3650).nullable().optional(),
    validMonths: z.number().int().min(1).max(120).nullable().optional(),
  })
  .refine((v) => v.kind !== 'package' || (v.sessions != null && (v.validDays != null || v.validMonths != null)), { message: 'A package needs the number of sessions and how long it lasts.' })

export async function saveCounterItem(raw: unknown): Promise<Result> {
  const { db, userId } = await requireStaff(['admin', 'doctor', 'front_desk'])
  const parsed = ItemInput.safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Please check the details.' }
  const v = parsed.data
  const row = {
    kind: v.kind,
    name: v.name,
    price_rm: toSen(v.priceRm) / 100,
    duration_mins: v.kind === 'service' ? v.durationMins ?? null : null,
    sessions: v.kind === 'package' ? v.sessions ?? null : null,
    // A package lasts either days or months, never both.
    valid_days: v.kind === 'package' && !v.validMonths ? v.validDays ?? null : null,
    valid_months: v.kind === 'package' ? v.validMonths ?? null : null,
    updated_at: new Date().toISOString(),
  }
  const { error } = v.id
    ? await db.from('counter_items').update(row).eq('id', v.id)
    : await db.from('counter_items').insert({ ...row, created_by_staff_id: userId })
  if (error) {
    console.error('[billing items] save:', error.message)
    return { ok: false, error: /does not exist|Could not find the table/.test(error.message) ? NOT_SET_UP : 'Could not save. Please try again.' }
  }
  refresh()
  return { ok: true }
}

export async function setCounterItemHidden(id: string, hidden: boolean): Promise<Result> {
  const { db } = await requireStaff(['admin', 'doctor', 'front_desk'])
  if (!uuid.safeParse(id).success) return { ok: false, error: 'Item not found.' }
  const { error } = await db.from('counter_items').update({ is_hidden: hidden, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { ok: false, error: 'Could not save. Please try again.' }
  refresh()
  return { ok: true }
}

/** Remove an item. One already on a bill or sold as a package is kept for the records and hidden instead. */
export async function deleteCounterItem(id: string): Promise<Result> {
  const { db } = await requireStaff(['admin', 'doctor', 'front_desk'])
  if (!uuid.safeParse(id).success) return { ok: false, error: 'Item not found.' }
  const [lines, pkgs] = await Promise.all([
    db.from('counter_sale_items').select('id', { count: 'exact', head: true }).eq('counter_item_id', id),
    db.from('package_purchases').select('id', { count: 'exact', head: true }).eq('counter_item_id', id),
  ])
  if ((lines.count ?? 0) > 0 || (pkgs.count ?? 0) > 0) {
    const res = await setCounterItemHidden(id, true)
    return res.ok ? { ok: true, note: 'This item is on past bills, so it was hidden instead of removed.' } : res
  }
  const { error } = await db.from('counter_items').delete().eq('id', id)
  if (error) return { ok: false, error: 'Could not remove. Please try again.' }
  refresh()
  return { ok: true }
}

/** Hide a website therapy or shop product from checkout only (it stays on the website). */
export async function setWebsiteItemHidden(kind: 'treatment' | 'product', refId: string, hidden: boolean): Promise<Result> {
  const { db } = await requireStaff(['admin', 'doctor', 'front_desk'])
  if (!['treatment', 'product'].includes(kind) || !uuid.safeParse(refId).success) return { ok: false, error: 'Item not found.' }
  const { error } = hidden
    ? await db.from('counter_hidden').upsert({ kind, ref_id: refId }, { onConflict: 'kind,ref_id', ignoreDuplicates: true })
    : await db.from('counter_hidden').delete().eq('kind', kind).eq('ref_id', refId)
  if (error) {
    console.error('[billing items] hide:', error.message)
    return { ok: false, error: /does not exist|Could not find the table/.test(error.message) ? NOT_SET_UP : 'Could not save. Please try again.' }
  }
  refresh()
  return { ok: true }
}
