'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

async function requireAdminSession() {
  const me = await getCurrentUser()
  if (!me || me.role !== 'admin') throw new Error('Not authorised.')
  return me
}

const PromoInputSchema = z.object({
  code: z.string().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/),
  title: z.string().min(1).max(80),
  description: z.string().max(280).optional().or(z.literal('')),
  kind: z.enum(['percentage', 'fixed', 'free-shipping']),
  value_amount: z.number().nonnegative().nullable().optional(),
  min_spend_rm: z.number().nonnegative().default(0),
  applies_to: z.enum(['all', 'products', 'treatments', 'consultation']).default('all'),
  starts_at: z.string(),
  expires_at: z.string().nullable().optional(),
  is_public: z.boolean().default(true),
  is_active: z.boolean().default(true),
})

export async function createPromo(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdminSession()
    const input = PromoInputSchema.parse(raw)
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('promos') as any)
      .insert({
        ...input,
        code: input.code.toUpperCase(),
        description: input.description || null,
        expires_at: input.expires_at || null,
      })
      .select('id')
      .single()
    if (error || !data) return { ok: false, error: error?.message ?? 'Create failed.' }
    revalidatePath('/admin/promos')
    return { ok: true, data: { id: data.id } }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        error: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }
    }
    return { ok: false, error: (err as Error).message }
  }
}

export async function updatePromo(
  promoId: string,
  raw: unknown,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const input = PromoInputSchema.partial().parse(raw)
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = { ...input }
    if (typeof input.code === 'string') update.code = input.code.toUpperCase()
    if (input.description === '') update.description = null
    if (input.expires_at === '') update.expires_at = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('promos') as any)
      .update(update)
      .eq('id', promoId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/promos')
    revalidatePath(`/admin/promos/${promoId}`)
    return { ok: true }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        error: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }
    }
    return { ok: false, error: (err as Error).message }
  }
}

export async function setPromoActive(
  promoId: string,
  isActive: boolean,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('promos') as any)
      .update({ is_active: isActive })
      .eq('id', promoId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/promos')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function deletePromo(promoId: string): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    const { count } = await supabase
      .from('customer_promos')
      .select('id', { count: 'exact', head: true })
      .eq('promo_id', promoId)
    if (count && count > 0) {
      return {
        ok: false,
        error: 'Cannot delete: promo already granted to customers. Deactivate instead.',
      }
    }
    const { error } = await supabase.from('promos').delete().eq('id', promoId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/promos')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
