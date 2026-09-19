'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createNotification } from '@/lib/notifications/create'
import { sendEmail } from '@/lib/email/send'

type Result = { ok: true } | { ok: false; error: string }

export async function cancelOrder(orderId: string, reason: string): Promise<Result> {
  if (!orderId) return { ok: false, error: 'Missing order ID.' }
  const trimmed = reason.trim()
  if (trimmed.length < 5) return { ok: false, error: 'Please give a short reason (5+ characters).' }
  if (trimmed.length > 500) return { ok: false, error: 'Reason is too long.' }

  const me = await getCurrentUser()
  if (!me || me.role !== 'customer') return { ok: false, error: 'Not authorised.' }

  const supabase = await createClient()

  const { data, error: readErr } = await supabase
    .from('orders')
    .select('id, customer_id, payment_status, fulfillment_status, cancelled_at')
    .eq('id', orderId)
    .single()

  if (readErr || !data) return { ok: false, error: 'Order not found.' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = data as any
  if (order.cancelled_at) return { ok: false, error: 'Already cancelled.' }
  if (order.payment_status !== 'pending' || order.fulfillment_status !== 'processing') {
    return { ok: false, error: 'This order can no longer be cancelled. Please contact support.' }
  }

  // Cast — Supabase v2's `.update()` resolves to `never` against the hand-maintained Database type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updErr } = await (supabase.from('orders') as any)
    .update({
      cancelled_at: new Date().toISOString(),
      cancel_reason: trimmed,
      fulfillment_status: 'cancelled',
    })
    .eq('id', orderId)

  if (updErr) return { ok: false, error: 'Could not cancel right now. Please try again.' }

  const shortId = orderId.slice(-6).toUpperCase()
  await createNotification({
    userId: me.authId,
    kind: 'order_cancelled',
    title: `Order #${shortId} cancelled`,
    body: `Reason: ${trimmed}. If this was a mistake, contact us within 24 hours.`,
    href: `/account/orders/${orderId}`,
  })

  // Fire-and-forget email. Don't block the action on it.
  if (me.email) {
    const firstName = me.profile.full_name?.split(' ')[0] ?? 'there'
    void sendEmail({
      to: me.email,
      category: 'transactional',
      subject: `Your order #${shortId} was cancelled`,
      html: `<p>Hi ${firstName},</p><p>We've cancelled order #${shortId} per your request. Reason: ${trimmed}.</p>`,
      text: `Hi ${firstName},\n\nWe've cancelled order #${shortId} per your request. Reason: ${trimmed}.`,
      userId: me.authId,
    })
  }

  revalidatePath(`/account/orders/${orderId}`)
  revalidatePath('/account/orders')
  revalidatePath('/account/dashboard')
  return { ok: true }
}
