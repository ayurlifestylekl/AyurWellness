'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

const PlaceOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(10000),
      }),
    )
    .min(1, 'Add at least one product to the cart.'),
  shippingAddress: z.string().min(5).max(400),
  shippingPostcode: z.string().min(1).max(20),
  shippingState: z.string().min(1).max(60),
  agentNotes: z.string().max(1000).optional().or(z.literal('')),
})

export async function placeWholesaleOrder(
  input: unknown,
): Promise<ActionResult<{ orderId: string; orderNumber: string }>> {
  try {
    const me = await getCurrentUser()
    if (!me || me.role !== 'sales_agent') {
      return { ok: false, error: 'Sign in as a partner to order.' }
    }

    const parsed = PlaceOrderSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    }

    const supabase = await createClient()

    // 1. Resolve agent + capability check
    const { data: agentRow, error: agentErr } = await supabase
      .from('sales_agents')
      .select('id, status, can_wholesale')
      .eq('user_id', me.profile.id)
      .maybeSingle()
    if (agentErr || !agentRow) {
      return { ok: false, error: 'Partner profile not found.' }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agent: any = agentRow
    if (agent.status === 'suspended') {
      return { ok: false, error: 'Account suspended. Contact admin.' }
    }
    if (!agent.can_wholesale) {
      return { ok: false, error: 'Your account is not enabled for wholesale orders.' }
    }

    // 2. Resolve products with live prices & wholesale-enabled check
    const ids = parsed.data.items.map((i) => i.productId)
    const { data: prodRows, error: prodErr } = await supabase
      .from('products')
      .select('id, name, sku, wholesale_price_rm, wholesale_enabled, status')
      .in('id', ids)
    if (prodErr || !prodRows) {
      return { ok: false, error: 'Could not load products.' }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prodMap = new Map<string, any>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prodRows as any[]).map((p) => [p.id, p]),
    )

    let subtotal = 0
    const itemRows: {
      product_id: string
      product_name: string
      product_sku: string | null
      quantity: number
      unit_price_rm: number
      line_total_rm: number
    }[] = []

    for (const it of parsed.data.items) {
      const p = prodMap.get(it.productId)
      if (!p) {
        return { ok: false, error: 'A product in your cart is no longer available.' }
      }
      if (!p.wholesale_enabled || p.status !== 'active') {
        return {
          ok: false,
          error: `"${p.name}" is no longer available for wholesale.`,
        }
      }
      if (p.wholesale_price_rm == null) {
        return { ok: false, error: `"${p.name}" has no wholesale price set.` }
      }
      const unit = Number(p.wholesale_price_rm)
      const line = +(unit * it.quantity).toFixed(2)
      subtotal += line
      itemRows.push({
        product_id: it.productId,
        product_name: p.name,
        product_sku: p.sku ?? null,
        quantity: it.quantity,
        unit_price_rm: unit,
        line_total_rm: line,
      })
    }

    subtotal = +subtotal.toFixed(2)
    const shipping = 0 // wholesale: arranged separately; admin can bill separately if needed
    const total = +(subtotal + shipping).toFixed(2)

    // 3. Generate order_number
    const { data: numData, error: numErr } = await supabase.rpc(
      'next_wholesale_order_number',
    )
    if (numErr || !numData) {
      return { ok: false, error: 'Could not generate order number.' }
    }
    const orderNumber = numData as string

    // 4. Insert the order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderTable = supabase.from('wholesale_orders') as any
    const { data: orderRow, error: orderErr } = await orderTable
      .insert({
        order_number: orderNumber,
        agent_id: agent.id,
        status: 'pending_payment',
        subtotal_rm: subtotal,
        shipping_rm: shipping,
        total_rm: total,
        shipping_address: parsed.data.shippingAddress,
        shipping_postcode: parsed.data.shippingPostcode,
        shipping_state: parsed.data.shippingState,
        agent_notes: parsed.data.agentNotes || null,
      })
      .select('id, order_number')
      .single()

    if (orderErr || !orderRow) {
      return { ok: false, error: orderErr?.message ?? 'Could not place order.' }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order: any = orderRow

    // 5. Insert items
    const itemsPayload = itemRows.map((r) => ({
      ...r,
      wholesale_order_id: order.id,
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemsTable = supabase.from('wholesale_order_items') as any
    const { error: itemsErr } = await itemsTable.insert(itemsPayload)
    if (itemsErr) {
      // Best-effort cleanup so we don't leave an empty order
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('wholesale_orders') as any)
        .delete()
        .eq('id', order.id)
      return { ok: false, error: itemsErr.message }
    }

    revalidatePath('/agent/wholesale-orders')
    revalidatePath('/agent/dashboard')
    revalidatePath('/admin/wholesale-orders')

    return {
      ok: true,
      data: { orderId: order.id, orderNumber: order.order_number },
    }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
