'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications/create'
import { canTransition, type FulfillmentStatus } from './status-transitions'
import { trackingUrlFor, type Carrier } from './tracking-urls'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

export async function requireAdminSession() {
  const me = await getCurrentUser()
  if (!me || me.role !== 'admin') throw new Error('Not authorised.')
  return me
}

// ---------------------------------------------------------------------------
// Notification helper — maps order events to the existing notification kinds
// ---------------------------------------------------------------------------

type OrderNotifyKind =
  | 'order_placed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'ticket_reply'

async function notifyCustomer(
  customerId: string | null,
  kind: OrderNotifyKind,
  title: string,
  body: string,
  href: string,
): Promise<void> {
  if (!customerId) return
  await createNotification({ userId: customerId, kind, title, body, href })
}

function shortId(id: string): string {
  return id.slice(-6).toUpperCase()
}

// ---------------------------------------------------------------------------
// Stock movement helpers — invoked when an order paid / cancelled / refunded.
// Inserts rows into stock_movements; the apply_stock_movement trigger
// automatically adjusts products.stock_qty.
// ---------------------------------------------------------------------------

async function recordSoldMovementsForOrder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orderId: string,
  actorId: string,
): Promise<void> {
  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)
  if (!items || items.length === 0) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (items as any[])
    .filter((it) => it.product_id && it.quantity > 0)
    .map((it) => ({
      product_id: it.product_id,
      movement_type: 'sold',
      quantity_delta: -Math.abs(Number(it.quantity)),
      reference_order_id: orderId,
      actor_id: actorId,
      reason: 'Order paid',
    }))
  if (rows.length === 0) return
  await supabase.from('stock_movements').insert(rows)
}

async function recordReturnedMovementsForOrder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  orderId: string,
  actorId: string,
  reason: string,
): Promise<void> {
  // Idempotency: skip if we've already restored stock for this order.
  const { data: existing } = await supabase
    .from('stock_movements')
    .select('id')
    .eq('reference_order_id', orderId)
    .eq('movement_type', 'returned')
    .limit(1)
  if (existing && existing.length > 0) return

  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)
  if (!items || items.length === 0) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (items as any[])
    .filter((it) => it.product_id && it.quantity > 0)
    .map((it) => ({
      product_id: it.product_id,
      movement_type: 'returned',
      quantity_delta: Math.abs(Number(it.quantity)),
      reference_order_id: orderId,
      actor_id: actorId,
      reason,
    }))
  if (rows.length === 0) return
  await supabase.from('stock_movements').insert(rows)
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

export async function moveOrderStatus(
  orderId: string,
  to: FulfillmentStatus,
  note?: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()

    const { data: orderRaw, error: e1 } = await supabase
      .from('orders')
      .select('id, fulfillment_status, customer_id')
      .eq('id', orderId)
      .single()
    if (e1 || !orderRaw) return { ok: false, error: 'Order not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order: any = orderRaw

    const from = order.fulfillment_status as FulfillmentStatus
    if (!canTransition(from, to)) {
      return { ok: false, error: `Cannot move from ${from} to ${to}.` }
    }

    const patch: Record<string, unknown> = { fulfillment_status: to }
    if (to === 'shipped') patch.shipped_at = new Date().toISOString()
    if (to === 'delivered') patch.delivered_at = new Date().toISOString()
    if (to === 'completed') patch.completed_at = new Date().toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: e2 } = await (supabase.from('orders') as any).update(patch).eq('id', orderId)
    if (e2) return { ok: false, error: e2.message }

    if (note) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('order_events') as any).insert({
        order_id: orderId,
        event_type: 'note_added',
        payload: { note },
      })
    }

    const kind: OrderNotifyKind =
      to === 'shipped' ? 'order_shipped'
      : to === 'delivered' ? 'order_delivered'
      : to === 'cancelled' ? 'order_cancelled'
      : 'order_placed'

    await notifyCustomer(
      order.customer_id,
      kind,
      `Order #${shortId(orderId)} is now ${to}`,
      note ?? `Status updated.`,
      `/account/orders/${orderId}`,
    )

    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath('/admin/orders')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Mark paid
// ---------------------------------------------------------------------------

export async function markOrderPaid(
  orderId: string,
  paymentMethod: 'billplz' | 'cod' | 'bank_transfer' | 'fpx' | 'cash' | 'card',
  gatewayRef?: string,
): Promise<ActionResult> {
  try {
    const me = await requireAdminSession()
    const supabase = await createClient()

    const { data: orderRaw } = await supabase
      .from('orders')
      .select('id, payment_status, invoice_number, customer_id')
      .eq('id', orderId)
      .single()
    if (!orderRaw) return { ok: false, error: 'Order not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order: any = orderRaw
    if (order.payment_status === 'paid') return { ok: false, error: 'Order already paid.' }

    let invoiceNumber = order.invoice_number
    if (!invoiceNumber) {
      const { data: rpc } = await supabase.rpc('next_invoice_number')
      invoiceNumber = (rpc as string | null) ?? null
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('orders') as any).update({
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
      payment_method: paymentMethod,
      invoice_number: invoiceNumber,
    }).eq('id', orderId)
    if (error) return { ok: false, error: error.message }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('order_events') as any).insert({
      order_id: orderId,
      event_type: 'payment_received',
      payload: { method: paymentMethod, gateway_reference: gatewayRef ?? null },
    })

    // Decrement product stock for each line item. Trigger applies the math.
    await recordSoldMovementsForOrder(supabase, orderId, me.authId)

    await notifyCustomer(
      order.customer_id,
      'order_placed',
      `Payment received`,
      `Your payment of order #${shortId(orderId)} has been confirmed.`,
      `/account/orders/${orderId}`,
    )

    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath('/admin/inventory')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------

export async function assignTracking(
  orderId: string,
  carrier: Carrier,
  trackingNumber: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    if (!trackingNumber.trim()) return { ok: false, error: 'Tracking number required.' }
    const supabase = await createClient()

    const { data: orderRaw } = await supabase
      .from('orders')
      .select('id, customer_id')
      .eq('id', orderId)
      .single()
    if (!orderRaw) return { ok: false, error: 'Order not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order: any = orderRaw

    const url = trackingUrlFor(carrier, trackingNumber)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('orders') as any).update({
      courier_service: carrier,
      tracking_number: trackingNumber,
    }).eq('id', orderId)
    if (error) return { ok: false, error: error.message }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('order_events') as any).insert({
      order_id: orderId,
      event_type: 'tracking_added',
      payload: { carrier, tracking_number: trackingNumber, tracking_url: url },
    })

    await notifyCustomer(
      order.customer_id,
      'order_shipped',
      `Tracking added`,
      `${carrier}: ${trackingNumber}`,
      `/account/orders/${orderId}`,
    )

    revalidatePath(`/admin/orders/${orderId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function markOrderShipped(
  orderId: string,
  carrier: Carrier,
  trackingNumber: string,
): Promise<ActionResult> {
  const t = await assignTracking(orderId, carrier, trackingNumber)
  if (!t.ok) return t
  return moveOrderStatus(orderId, 'shipped')
}

// ---------------------------------------------------------------------------
// Cancel
// ---------------------------------------------------------------------------

export async function cancelOrderAdmin(orderId: string, reason: string): Promise<ActionResult> {
  try {
    const me = await requireAdminSession()
    if (!reason || reason.trim().length < 5) {
      return { ok: false, error: 'Cancellation reason must be at least 5 characters.' }
    }
    const supabase = await createClient()
    const { data: orderRaw } = await supabase
      .from('orders')
      .select('id, customer_id, fulfillment_status, payment_status')
      .eq('id', orderId)
      .single()
    if (!orderRaw) return { ok: false, error: 'Order not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order: any = orderRaw
    if (!canTransition(order.fulfillment_status as FulfillmentStatus, 'cancelled')) {
      return { ok: false, error: `Cannot cancel from ${order.fulfillment_status}.` }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('orders') as any).update({
      fulfillment_status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason,
    }).eq('id', orderId)
    if (error) return { ok: false, error: error.message }

    // If the order had been paid, its stock was decremented. Restore it.
    if (order.payment_status === 'paid' || order.payment_status === 'refunded') {
      await recordReturnedMovementsForOrder(supabase, orderId, me.authId, `Cancelled: ${reason}`)
    }

    await notifyCustomer(
      order.customer_id,
      'order_cancelled',
      `Order #${shortId(orderId)} cancelled`,
      reason,
      `/account/orders/${orderId}`,
    )
    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath('/admin/inventory')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Refund
// ---------------------------------------------------------------------------

const PaymentMethodSchema = z.enum(['billplz', 'cod', 'bank_transfer', 'fpx', 'cash', 'card'])

export async function recordRefund(input: {
  orderId: string
  amountRm: number
  reason: string
  refundMethod: z.infer<typeof PaymentMethodSchema>
  gatewayRef?: string
  notes?: string
}): Promise<ActionResult> {
  try {
    const me = await requireAdminSession()
    PaymentMethodSchema.parse(input.refundMethod)
    const supabase = await createClient()

    const { data: orderRaw } = await supabase
      .from('orders')
      .select('id, total_amount_rm, customer_id')
      .eq('id', input.orderId)
      .single()
    if (!orderRaw) return { ok: false, error: 'Order not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order: any = orderRaw
    if (input.amountRm <= 0) return { ok: false, error: 'Refund amount must be > 0.' }
    if (input.amountRm > Number(order.total_amount_rm))
      return { ok: false, error: 'Refund cannot exceed order total.' }
    if (!input.reason || input.reason.trim().length < 3)
      return { ok: false, error: 'Reason is required.' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: e1 } = await (supabase.from('refunds') as any).insert({
      order_id: input.orderId,
      amount_rm: input.amountRm,
      reason: input.reason,
      refund_method: input.refundMethod,
      gateway_reference: input.gatewayRef ?? null,
      notes: input.notes ?? null,
      created_by_admin_id: me.authId,
    })
    if (e1) return { ok: false, error: e1.message }

    const isFull = Number(input.amountRm) >= Number(order.total_amount_rm)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: e2 } = await (supabase.from('orders') as any).update({
      payment_status: isFull ? 'refunded' : 'paid',
    }).eq('id', input.orderId)
    if (e2) return { ok: false, error: e2.message }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('order_events') as any).insert({
      order_id: input.orderId,
      event_type: 'refund_recorded',
      payload: { amount_rm: input.amountRm, reason: input.reason, full: isFull },
    })

    // Full refund: restore stock. Helper is idempotent so if stock was already
    // returned via a prior cancellation, this is a safe no-op.
    if (isFull) {
      await recordReturnedMovementsForOrder(
        supabase,
        input.orderId,
        me.authId,
        `Refunded: ${input.reason}`,
      )
    }

    await notifyCustomer(
      order.customer_id,
      'order_cancelled',
      isFull ? 'Refund issued' : 'Partial refund issued',
      `RM ${input.amountRm.toFixed(2)} — ${input.reason}`,
      `/account/orders/${input.orderId}`,
    )
    revalidatePath(`/admin/orders/${input.orderId}`)
    revalidatePath('/admin/inventory')
    return { ok: true }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, error: err.issues.map((i) => i.message).join('; ') }
    }
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export async function addPractitionerNote(orderId: string, note: string): Promise<ActionResult> {
  try {
    await requireAdminSession()
    if (!note || note.trim().length < 1) return { ok: false, error: 'Note cannot be empty.' }
    const supabase = await createClient()
    const { data: orderRaw } = await supabase
      .from('orders')
      .select('id, customer_id')
      .eq('id', orderId)
      .single()
    if (!orderRaw) return { ok: false, error: 'Order not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order: any = orderRaw

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('orders') as any).update({
      practitioner_note: note,
    }).eq('id', orderId)
    if (error) return { ok: false, error: error.message }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('order_events') as any).insert({
      order_id: orderId,
      event_type: 'practitioner_note_added',
      payload: { note },
    })
    await notifyCustomer(
      order.customer_id,
      'ticket_reply',
      `Vaidya left a note on your order`,
      note.slice(0, 140),
      `/account/orders/${orderId}`,
    )
    revalidatePath(`/admin/orders/${orderId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function addInternalNote(orderId: string, note: string): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('orders') as any).update({
      internal_notes: note,
    }).eq('id', orderId)
    if (error) return { ok: false, error: error.message }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('order_events') as any).insert({
      order_id: orderId,
      event_type: 'internal_note_added',
      is_customer_visible: false,
      payload: { note },
    })
    revalidatePath(`/admin/orders/${orderId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Resend / re-attempt
// ---------------------------------------------------------------------------

export async function resendOrderConfirmation(orderId: string): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    const { data: orderRaw } = await supabase
      .from('orders')
      .select('id, customer_id')
      .eq('id', orderId)
      .single()
    if (!orderRaw) return { ok: false, error: 'Order not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order: any = orderRaw

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('order_events') as any).insert({
      order_id: orderId,
      event_type: 'confirmation_resent',
      is_customer_visible: false,
      payload: { at: new Date().toISOString() },
    })
    await notifyCustomer(
      order.customer_id,
      'order_placed',
      `Order confirmation resent`,
      `We've re-sent your order confirmation.`,
      `/account/orders/${orderId}`,
    )
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Manual order entry
// ---------------------------------------------------------------------------

const ManualOrderItem = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPriceRm: z.number().positive(),
})

const ManualOrderInput = z.object({
  customerId: z.string().uuid().nullable(),
  walkInName: z.string().min(1).optional(),
  walkInPhone: z.string().min(8).optional(),
  walkInEmail: z.string().email().optional().or(z.literal('')),
  items: z.array(ManualOrderItem).min(1),
  paymentMethod: z.enum(['cod', 'bank_transfer', 'fpx', 'cash', 'card']),
  channel: z.enum(['manual', 'walk_in', 'phone']).default('walk_in'),
  shippingAddressId: z.string().uuid().nullable().optional(),
  agentId: z.string().uuid().nullable().optional(),
  discountCode: z.string().optional(),
  internalNote: z.string().optional(),
})

export async function createManualOrder(
  raw: unknown,
): Promise<ActionResult<{ orderId: string }>> {
  try {
    const me = await requireAdminSession()
    const input = ManualOrderInput.parse(raw)
    const supabase = await createClient()

    let customerId = input.customerId
    if (!customerId) {
      if (!input.walkInName) return { ok: false, error: 'Walk-in name required.' }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: u, error: ue } = await (supabase.from('users') as any).insert({
        full_name: input.walkInName,
        phone_number: input.walkInPhone ?? null,
        email: input.walkInEmail || null,
        role: 'customer',
      }).select('id').single()
      if (ue || !u) return { ok: false, error: ue?.message ?? 'Customer create failed.' }
      customerId = u.id
    }

    const subtotal = input.items.reduce((s, it) => s + it.unitPriceRm * it.quantity, 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: oe } = await (supabase.from('orders') as any).insert({
      customer_id: customerId,
      channel: input.channel,
      payment_method: input.paymentMethod,
      subtotal_rm: subtotal,
      total_amount_rm: subtotal,
      payment_status: 'pending',
      fulfillment_status: 'pending',
      shipping_address_id: input.shippingAddressId ?? null,
      referral_agent_id: input.agentId ?? null,
      discount_code: input.discountCode ?? null,
      internal_notes: input.internalNote ?? null,
      created_by_admin_id: me.authId,
    }).select('id').single()
    if (oe || !order) return { ok: false, error: oe?.message ?? 'Order create failed.' }

    const itemRows = input.items.map((it) => ({
      order_id: order.id,
      product_id: it.productId,
      quantity: it.quantity,
      price_at_purchase_rm: it.unitPriceRm,
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: ie } = await (supabase.from('order_items') as any).insert(itemRows)
    if (ie) return { ok: false, error: ie.message }

    revalidatePath('/admin/orders')
    return { ok: true, data: { orderId: order.id } }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, error: err.issues.map((i) => i.message).join('; ') }
    }
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Bulk
// ---------------------------------------------------------------------------

export async function bulkMarkPaid(
  orderIds: string[],
  paymentMethod: 'billplz' | 'cod' | 'bank_transfer' | 'fpx' | 'cash' | 'card',
): Promise<ActionResult<{ updated: number }>> {
  await requireAdminSession()
  let updated = 0
  for (const id of orderIds) {
    const r = await markOrderPaid(id, paymentMethod)
    if (r.ok) updated++
  }
  revalidatePath('/admin/orders')
  return { ok: true, data: { updated } }
}

export async function bulkMarkShipped(
  rows: { orderId: string; carrier: Carrier; trackingNumber: string }[],
): Promise<ActionResult<{ updated: number }>> {
  await requireAdminSession()
  let updated = 0
  for (const r of rows) {
    const out = await markOrderShipped(r.orderId, r.carrier, r.trackingNumber)
    if (out.ok) updated++
  }
  revalidatePath('/admin/orders')
  return { ok: true, data: { updated } }
}
