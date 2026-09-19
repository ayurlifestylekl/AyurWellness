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

const LogSaleSchema = z.object({
  agentId: z.string().uuid(),
  channel: z.enum(['tiktok_shop', 'shopee', 'lazada', 'instagram', 'whatsapp', 'other']),
  grossAmountRm: z.number().positive(),
  customerName: z.string().optional().or(z.literal('')),
  customerContact: z.string().optional().or(z.literal('')),
  marketplaceOrderRef: z.string().optional().or(z.literal('')),
  proofUrl: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export async function logExternalSale(
  raw: unknown,
): Promise<ActionResult<{ id: string; commissionRm: number }>> {
  try {
    const me = await requireAdminSession()
    const input = LogSaleSchema.parse(raw)
    const supabase = await createClient()

    // Look up agent's current commission rate
    const { data: agent } = await supabase
      .from('sales_agents')
      .select('commission_rate, status')
      .eq('id', input.agentId)
      .single()
    if (!agent) return { ok: false, error: 'Agent not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a: any = agent
    if (a.status === 'suspended') {
      return { ok: false, error: 'Agent is suspended.' }
    }
    const rate = Number(a.commission_rate)
    const commission = Math.round(input.grossAmountRm * rate) / 100

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('external_sales') as any)
      .insert({
        agent_id: input.agentId,
        channel: input.channel,
        gross_amount_rm: input.grossAmountRm,
        rate_percent: rate,
        commission_rm: commission,
        customer_name: input.customerName || null,
        customer_contact: input.customerContact || null,
        marketplace_order_ref: input.marketplaceOrderRef || null,
        proof_url: input.proofUrl || null,
        notes: input.notes || null,
        logged_by_admin_id: me.authId,
      })
      .select('id')
      .single()
    if (error || !data) return { ok: false, error: error?.message ?? 'Insert failed.' }

    revalidatePath('/admin/partners')
    revalidatePath('/admin/partners/external-sales')
    revalidatePath(`/admin/partners/${input.agentId}`)
    return { ok: true, data: { id: data.id, commissionRm: commission } }
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

export async function deleteExternalSale(id: string): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    const { error } = await supabase.from('external_sales').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/partners/external-sales')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
