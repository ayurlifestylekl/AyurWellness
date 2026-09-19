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

const MarkPaidSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: z.string().min(1).max(60),
  paymentProofUrl: z.string().url().optional().or(z.literal('')),
})

export async function markWholesalePaid(input: unknown): Promise<ActionResult> {
  try {
    const me = await requireAdminSession()
    const parsed = MarkPaidSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    }
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('wholesale_orders') as any)
      .update({
        status: 'paid',
        payment_method: parsed.data.paymentMethod,
        payment_proof_url: parsed.data.paymentProofUrl || null,
        paid_at: new Date().toISOString(),
        paid_by_admin_id: me.profile.id,
      })
      .eq('id', parsed.data.orderId)
      .eq('status', 'pending_payment')
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/wholesale-orders')
    revalidatePath(`/admin/wholesale-orders/${parsed.data.orderId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function markWholesaleFulfilling(orderId: string): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('wholesale_orders') as any)
      .update({ status: 'fulfilling' })
      .eq('id', orderId)
      .eq('status', 'paid')
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/wholesale-orders')
    revalidatePath(`/admin/wholesale-orders/${orderId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

const ShipSchema = z.object({
  orderId: z.string().uuid(),
  courier: z.string().min(1).max(80),
  trackingNumber: z.string().min(1).max(120),
})

export async function markWholesaleShipped(input: unknown): Promise<ActionResult> {
  try {
    const me = await requireAdminSession()
    const parsed = ShipSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    }
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('wholesale_orders') as any)
      .update({
        status: 'shipped',
        courier: parsed.data.courier,
        tracking_number: parsed.data.trackingNumber,
        shipped_at: new Date().toISOString(),
        shipped_by_admin_id: me.profile.id,
      })
      .eq('id', parsed.data.orderId)
      .in('status', ['paid', 'fulfilling'])
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/wholesale-orders')
    revalidatePath(`/admin/wholesale-orders/${parsed.data.orderId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function markWholesaleDelivered(orderId: string): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('wholesale_orders') as any)
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('status', 'shipped')
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/wholesale-orders')
    revalidatePath(`/admin/wholesale-orders/${orderId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function cancelWholesaleOrder(
  orderId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    if (!reason || reason.trim().length < 3) {
      return { ok: false, error: 'Reason is required (min 3 chars).' }
    }
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('wholesale_orders') as any)
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason,
      })
      .eq('id', orderId)
      .not('status', 'in', '(delivered,cancelled)')
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/wholesale-orders')
    revalidatePath(`/admin/wholesale-orders/${orderId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function setWholesaleAdminNotes(
  orderId: string,
  notes: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('wholesale_orders') as any)
      .update({ admin_notes: notes })
      .eq('id', orderId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/wholesale-orders/${orderId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
