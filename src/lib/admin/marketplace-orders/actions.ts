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

const ItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  sku: z.string().nullable(),
  quantity: z.number().int().positive(),
  unit_price_rm: z.number().nonnegative(),
})

const CreateSchema = z.object({
  channel: z.enum(['tiktok_shop', 'shopee', 'lazada', 'instagram', 'whatsapp', 'other']),
  marketplaceOrderRef: z.string().optional().or(z.literal('')),
  customerName: z.string().min(1),
  customerPhone: z.string().optional().or(z.literal('')),
  customerEmail: z.string().email().optional().or(z.literal('')),
  items: z.array(ItemSchema).min(1),
  shippingRm: z.number().nonnegative().default(0),
  referralAgentId: z.string().uuid().nullable().optional(),
  notes: z.string().optional().or(z.literal('')),
})

export async function createMarketplaceOrder(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const me = await requireAdminSession()
    const input = CreateSchema.parse(raw)
    const supabase = await createClient()

    const subtotal = input.items.reduce(
      (s, it) => s + it.unit_price_rm * it.quantity,
      0,
    )
    const total = subtotal + input.shippingRm

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('marketplace_orders') as any)
      .insert({
        channel: input.channel,
        marketplace_order_ref: input.marketplaceOrderRef || null,
        customer_name: input.customerName,
        customer_phone: input.customerPhone || null,
        customer_email: input.customerEmail || null,
        items: input.items,
        subtotal_rm: subtotal,
        shipping_rm: input.shippingRm,
        total_amount_rm: total,
        referral_agent_id: input.referralAgentId ?? null,
        notes: input.notes || null,
        status: 'pending',
        entered_by_admin_id: me.authId,
      })
      .select('id')
      .single()
    if (error || !data) return { ok: false, error: error?.message ?? 'Insert failed.' }

    revalidatePath('/admin/marketplace-orders')
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

/**
 * Approves a pending marketplace order:
 *   1. Creates a real `users` row if needed (walk-in style)
 *   2. Creates a real `orders` row with channel matching marketplace
 *   3. Inserts order_items
 *   4. Marks payment_status='paid' (money already cleared on the marketplace)
 *   5. Triggers fire: stock deducts, commission auto-creates if attributed
 *   6. Updates the marketplace_orders row with created_order_id + status='approved'
 */
export async function approveMarketplaceOrder(
  marketplaceOrderId: string,
): Promise<ActionResult<{ orderId: string }>> {
  try {
    const me = await requireAdminSession()
    const supabase = await createClient()

    const { data: mp, error: getErr } = await supabase
      .from('marketplace_orders')
      .select('*')
      .eq('id', marketplaceOrderId)
      .single()
    if (getErr || !mp) return { ok: false, error: 'Marketplace order not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m: any = mp
    if (m.status !== 'pending') {
      return { ok: false, error: `Already ${m.status}.` }
    }

    // 1. Find or create customer
    let customerId: string | null = null
    if (m.customer_phone || m.customer_email) {
      const phoneNorm = m.customer_phone
      const emailNorm = m.customer_email
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .or(
          [
            phoneNorm ? `phone_number.eq.${phoneNorm}` : null,
            emailNorm ? `email.eq.${emailNorm}` : null,
          ]
            .filter(Boolean)
            .join(','),
        )
        .maybeSingle()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((existing as any)?.id) customerId = (existing as any).id
    }
    if (!customerId) {
      // Marketplace customer has no account yet. Use service-role to create
      // a real auth.users row — the handle_new_user trigger then inserts
      // the matching public.users row (satisfying the users.id FK).
      const { createClient: createServiceClient } = await import('@supabase/supabase-js')
      const admin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      )

      // Synthesise a unique email if the customer didn't give one
      const placeholderEmail =
        m.customer_email ||
        `marketplace-${m.id.split('-')[0]}@kerala-ayurvedic.local`

      const { data: created, error: authErr } = await admin.auth.admin.createUser({
        email: placeholderEmail,
        email_confirm: true,
        password: undefined,
        user_metadata: {
          full_name: m.customer_name,
          phone_number: m.customer_phone ?? null,
          source: 'marketplace',
        },
      })
      if (authErr || !created?.user) {
        return {
          ok: false,
          error: `Customer create failed: ${authErr?.message ?? 'unknown'}`,
        }
      }
      customerId = created.user.id

      // Patch the public.users row (created by the trigger) with phone +
      // role + any details the trigger didn't pick up.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('users') as any)
        .update({
          full_name: m.customer_name,
          phone_number: m.customer_phone ?? null,
          role: 'customer',
        })
        .eq('id', customerId)
    }

    // 1b. Create a shipping address record if the agent supplied one
    let shippingAddressId: string | null = null
    if (m.customer_address && m.customer_postcode && m.customer_state) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: addr } = await (supabase.from('addresses') as any)
        .insert({
          customer_id: customerId,
          label: `${String(m.channel).replace('_', ' ')} order`,
          recipient: m.customer_name,
          phone: m.customer_phone ?? '—',
          line1: m.customer_address,
          city: m.customer_city ?? '',
          state: m.customer_state,
          postcode: m.customer_postcode,
          country: 'Malaysia',
          is_default: false,
        })
        .select('id')
        .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (addr) shippingAddressId = (addr as any).id
    }

    // 2. Create the real order — paid immediately (marketplace already collected)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: oe } = await (supabase.from('orders') as any)
      .insert({
        customer_id: customerId,
        channel: m.channel, // 'shopee' / 'tiktok_shop' / etc.
        payment_method: m.channel === 'whatsapp' ? 'bank_transfer' : 'fpx',
        subtotal_rm: m.subtotal_rm,
        shipping_amount_rm: m.shipping_rm,
        tax_amount_rm: 0,
        total_amount_rm: m.total_amount_rm,
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        fulfillment_status: 'processing',
        referral_agent_id: m.referral_agent_id,
        shipping_address_id: shippingAddressId,
        billing_address_id: shippingAddressId,
        internal_notes:
          (m.notes ? m.notes + '\n\n' : '') +
          `Imported from marketplace: ${m.channel}` +
          (m.marketplace_order_ref ? ` · ref ${m.marketplace_order_ref}` : '') +
          (m.payment_proof_url ? `\nProof: ${m.payment_proof_url}` : ''),
        created_by_admin_id: me.authId,
      })
      .select('id')
      .single()
    if (oe || !order) {
      return { ok: false, error: oe?.message ?? 'Order create failed.' }
    }

    // 3. Insert order_items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (Array.isArray(m.items) ? m.items : []) as any[]
    const itemRows = items.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      quantity: it.quantity,
      price_at_purchase_rm: it.unit_price_rm,
    }))
    if (itemRows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: ie } = await (supabase.from('order_items') as any).insert(itemRows)
      if (ie) return { ok: false, error: ie.message }
    }

    // 4. Manually insert sold movements for each line item (existing stock trigger
    //    fires on stock_movements insert, decrementing stock)
    const movements = items
      .filter((it) => it.product_id && it.quantity > 0)
      .map((it) => ({
        product_id: it.product_id,
        movement_type: 'sold',
        quantity_delta: -Math.abs(Number(it.quantity)),
        reference_order_id: order.id,
        actor_id: me.authId,
        reason: `Marketplace order paid (${m.channel})`,
      }))
    if (movements.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('stock_movements') as any).insert(movements)
    }

    // 5. Flip marketplace_orders row to approved + link
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('marketplace_orders') as any)
      .update({
        status: 'approved',
        approved_by_admin_id: me.authId,
        approved_at: new Date().toISOString(),
        created_order_id: order.id,
      })
      .eq('id', marketplaceOrderId)

    revalidatePath('/admin/marketplace-orders')
    revalidatePath(`/admin/marketplace-orders/${marketplaceOrderId}`)
    revalidatePath('/admin/orders')
    revalidatePath('/admin/inventory')
    return { ok: true, data: { orderId: order.id } }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function rejectMarketplaceOrder(
  marketplaceOrderId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    const me = await requireAdminSession()
    if (!reason || reason.trim().length < 3) {
      return { ok: false, error: 'Reason required.' }
    }
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('marketplace_orders') as any)
      .update({
        status: 'rejected',
        approved_by_admin_id: me.authId,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', marketplaceOrderId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/marketplace-orders')
    revalidatePath(`/admin/marketplace-orders/${marketplaceOrderId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
