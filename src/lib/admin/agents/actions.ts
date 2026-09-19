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

// ---------------------------------------------------------------------------
// Adjust commission rate / type
// ---------------------------------------------------------------------------

const RateSchema = z.object({
  agentId: z.string().uuid(),
  newRate: z.number().nonnegative().max(100),
  reason: z.string().min(3).max(500),
})

export async function updateAgentCommissionRate(
  raw: unknown,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const input = RateSchema.parse(raw)
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('sales_agents') as any)
      .update({
        commission_rate: input.newRate,
        internal_notes: null, // intentionally NOT clearing — we append in a separate action
      })
      .eq('id', input.agentId)
    if (error) return { ok: false, error: error.message }

    // Append rate-change to internal notes for audit
    const { data: agent } = await supabase
      .from('sales_agents')
      .select('internal_notes')
      .eq('id', input.agentId)
      .single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = ((agent as any)?.internal_notes ?? '') as string
    const stamp = `[${new Date().toISOString().slice(0, 10)}] Rate set to ${input.newRate}% — ${input.reason}`
    const next = existing ? `${existing}\n${stamp}` : stamp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('sales_agents') as any)
      .update({ internal_notes: next })
      .eq('id', input.agentId)

    revalidatePath(`/admin/partners/${input.agentId}`)
    revalidatePath('/admin/partners')
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

export async function updateAgentCommissionType(
  agentId: string,
  to: 'affiliate' | 'reseller',
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('sales_agents') as any)
      .update({ commission_type: to })
      .eq('id', agentId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/partners/${agentId}`)
    revalidatePath('/admin/partners')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function updateAgentCapabilities(
  agentId: string,
  caps: { canAffiliate: boolean; canWholesale: boolean },
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    if (!caps.canAffiliate && !caps.canWholesale) {
      return { ok: false, error: 'Pick at least one capability.' }
    }
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('sales_agents') as any)
      .update({
        can_affiliate: caps.canAffiliate,
        can_wholesale: caps.canWholesale,
      })
      .eq('id', agentId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/partners/${agentId}`)
    revalidatePath('/admin/partners')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Suspend / reactivate
// ---------------------------------------------------------------------------

export async function suspendAgent(
  agentId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    if (!reason || reason.trim().length < 3) {
      return { ok: false, error: 'Reason required.' }
    }
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('sales_agents') as any)
      .update({
        status: 'suspended',
        suspended_at: new Date().toISOString(),
        suspended_reason: reason,
      })
      .eq('id', agentId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/partners/${agentId}`)
    revalidatePath('/admin/partners')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function reactivateAgent(agentId: string): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('sales_agents') as any)
      .update({
        status: 'active',
        suspended_at: null,
        suspended_reason: null,
      })
      .eq('id', agentId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/partners/${agentId}`)
    revalidatePath('/admin/partners')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Internal notes
// ---------------------------------------------------------------------------

export async function setAgentInternalNotes(
  agentId: string,
  notes: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('sales_agents') as any)
      .update({ internal_notes: notes })
      .eq('id', agentId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/partners/${agentId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Manual order attribution — assign an order to an agent
// ---------------------------------------------------------------------------

export async function attributeOrderToAgent(input: {
  orderId: string
  agentId: string | null // null = remove attribution
}): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('orders') as any)
      .update({ referral_agent_id: input.agentId })
      .eq('id', input.orderId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/orders/${input.orderId}`)
    if (input.agentId) revalidatePath(`/admin/partners/${input.agentId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
