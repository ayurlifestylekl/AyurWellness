'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

async function requireAgentSession() {
  const me = await getCurrentUser()
  if (!me || me.role !== 'sales_agent') throw new Error('Not authorised.')
  const supabase = await createClient()
  const { data: agent, error } = await supabase
    .from('sales_agents')
    .select('id, status')
    .eq('user_id', me.authId)
    .single()
  if (error || !agent) throw new Error('Agent profile not found.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any = agent
  if (a.status === 'suspended') throw new Error('Account suspended.')
  return { me, agentId: a.id as string, supabase }
}

const ItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  sku: z.string().nullable(),
  quantity: z.number().int().positive(),
  unit_price_rm: z.number().nonnegative(),
})

const SubmitSchema = z.object({
  channel: z.enum(['tiktok_shop', 'shopee', 'lazada', 'instagram', 'whatsapp', 'other']),
  marketplaceOrderRef: z.string().optional().or(z.literal('')),
  customerName: z.string().min(1, 'Customer name is required.'),
  customerPhone: z.string().optional().or(z.literal('')),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerAddress: z.string().min(5, 'Shipping address is required.'),
  customerCity: z.string().optional().or(z.literal('')),
  customerPostcode: z.string().min(1, 'Postcode is required.'),
  customerState: z.string().min(1, 'State is required.'),
  items: z.array(ItemSchema).min(1),
  shippingRm: z.number().nonnegative().default(0),
  notes: z.string().optional().or(z.literal('')),
})

/**
 * Agent submits a marketplace order. Auto-attributes to their agent id.
 * Status starts 'pending_payment' — agent must pay the clinic (lump sum,
 * batched with other unpaid orders) before admin reviews.
 */
export async function submitMarketplaceOrder(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { me, agentId, supabase } = await requireAgentSession()
    const input = SubmitSchema.parse(raw)

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
        customer_address: input.customerAddress,
        customer_city: input.customerCity || null,
        customer_postcode: input.customerPostcode,
        customer_state: input.customerState,
        items: input.items,
        subtotal_rm: subtotal,
        shipping_rm: input.shippingRm,
        total_amount_rm: total,
        referral_agent_id: agentId,
        status: 'pending_payment',
        notes: input.notes || null,
        entered_by_user_id: me.authId,
      })
      .select('id')
      .single()
    if (error || !data) return { ok: false, error: error?.message ?? 'Submit failed.' }

    revalidatePath('/agent/marketplace-orders')
    revalidatePath('/admin/marketplace-orders')
    revalidatePath('/admin/agent-submissions')
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

// ---------------------------------------------------------------------------
// Bulk payment: agent pays the clinic in one lump sum for all unpaid orders
// and uploads a single receipt URL. Flips status from 'pending_payment' to
// 'pending' (admin review) on every selected order.
// ---------------------------------------------------------------------------

const PaymentBatchSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1, 'Pick at least one order.'),
  paymentProofUrl: z
    .string()
    .url('Paste a valid URL (Google Drive, Dropbox, etc.).'),
  paymentNote: z.string().max(500).optional().or(z.literal('')),
})

export async function submitMarketplacePaymentBatch(
  raw: unknown,
): Promise<ActionResult<{ updated: number }>> {
  try {
    const { agentId, supabase } = await requireAgentSession()
    const input = PaymentBatchSchema.parse(raw)

    // Only flip orders that are still 'pending_payment' AND belong to this agent.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('marketplace_orders') as any)
      .update({
        status: 'pending',
        payment_proof_url: input.paymentProofUrl,
        notes: input.paymentNote
          ? `[Payment note] ${input.paymentNote}`
          : undefined,
      })
      .in('id', input.orderIds)
      .eq('referral_agent_id', agentId)
      .eq('status', 'pending_payment')
      .select('id')

    if (error) return { ok: false, error: error.message }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = ((data ?? []) as any[]).length

    revalidatePath('/agent/marketplace-orders')
    revalidatePath('/admin/marketplace-orders')
    revalidatePath('/admin/agent-submissions')
    return { ok: true, data: { updated } }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        ok: false,
        error: err.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
      }
    }
    return { ok: false, error: (err as Error).message }
  }
}
