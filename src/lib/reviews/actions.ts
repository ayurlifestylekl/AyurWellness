'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { customerCanReviewProduct } from './queries'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

const SubmitSchema = z.object({
  productId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(2000),
})

export async function submitReview(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const me = await getCurrentUser()
    if (!me) return { ok: false, error: 'Please sign in to leave a review.' }

    const parsed = SubmitSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    }

    const supabase = await createClient()
    const eligibility = await customerCanReviewProduct(supabase, me.profile.id, parsed.data.productId)
    if (!eligibility.canReview) {
      return { ok: false, error: eligibility.reason ?? 'Not eligible.' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('reviews') as any)
      .insert({
        product_id: parsed.data.productId,
        customer_id: me.profile.id,
        order_id: eligibility.orderId,
        rating: parsed.data.rating,
        title: parsed.data.title || null,
        body: parsed.data.body,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = data

    revalidatePath('/products', 'layout')
    revalidatePath('/account/reviews')
    revalidatePath('/admin/reviews')

    return { ok: true, data: { id: row.id } }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

async function requireAdminSession() {
  const me = await getCurrentUser()
  if (!me || me.role !== 'admin') throw new Error('Not authorised.')
  return me
}

export async function approveReview(reviewId: string): Promise<ActionResult> {
  try {
    const me = await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('reviews') as any)
      .update({
        status: 'approved',
        approved_by_admin_id: me.profile.id,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', reviewId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/reviews')
    revalidatePath('/products', 'layout')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function rejectReview(
  reviewId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    if (!reason || reason.trim().length < 3) {
      return { ok: false, error: 'Reason is required (min 3 characters).' }
    }
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('reviews') as any)
      .update({
        status: 'rejected',
        rejection_reason: reason,
      })
      .eq('id', reviewId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/reviews')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
