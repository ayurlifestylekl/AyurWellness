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
// Mark one agent's pending commissions as PAID — creates a payout row
// ---------------------------------------------------------------------------

const MarkPaidSchema = z.object({
  agentId: z.string().uuid(),
  paymentMethod: z.enum(['bank_transfer', 'cash', 'fpx', 'cheque']).default('bank_transfer'),
  bankReference: z.string().optional(),
  notes: z.string().optional(),
})

export async function markAgentCommissionsPaid(
  raw: unknown,
): Promise<ActionResult<{ payoutId: string; amountRm: number; count: number }>> {
  try {
    const me = await requireAdminSession()
    const input = MarkPaidSchema.parse(raw)
    const supabase = await createClient()

    // Fetch all pending commissions for this agent
    const { data: pending, error: pe } = await supabase
      .from('agent_commissions')
      .select('id, commission_rm, created_at')
      .eq('agent_id', input.agentId)
      .eq('status', 'pending')
    if (pe) return { ok: false, error: pe.message }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (pending ?? []) as any[]
    if (rows.length === 0)
      return { ok: false, error: 'No pending commissions for this agent.' }

    const amount = rows.reduce((s, r) => s + Number(r.commission_rm), 0)
    const dates = rows.map((r) => new Date(r.created_at).getTime())
    const periodStart = new Date(Math.min(...dates)).toISOString().slice(0, 10)
    const periodEnd = new Date(Math.max(...dates)).toISOString().slice(0, 10)

    // Insert the payout row first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: payout, error: poe } = await (supabase.from('agent_payouts') as any)
      .insert({
        agent_id: input.agentId,
        amount_rm: amount,
        commission_count: rows.length,
        period_start: periodStart,
        period_end: periodEnd,
        payment_method: input.paymentMethod,
        bank_reference: input.bankReference ?? null,
        notes: input.notes ?? null,
        created_by_admin_id: me.authId,
      })
      .select('id')
      .single()
    if (poe || !payout) return { ok: false, error: poe?.message ?? 'Payout insert failed.' }

    // Flip commissions to paid + link to payout
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: ue } = await (supabase.from('agent_commissions') as any)
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payout_id: payout.id,
      })
      .in(
        'id',
        rows.map((r) => r.id),
      )
    if (ue) return { ok: false, error: ue.message }

    revalidatePath('/admin/partners')
    revalidatePath('/admin/partners/payouts')
    revalidatePath(`/admin/partners/${input.agentId}`)
    return {
      ok: true,
      data: { payoutId: payout.id, amountRm: amount, count: rows.length },
    }
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
// Bulk mark-paid for many agents
// ---------------------------------------------------------------------------

export async function bulkMarkAgentsPaid(input: {
  agentIds: string[]
  paymentMethod: 'bank_transfer' | 'cash' | 'fpx' | 'cheque'
}): Promise<ActionResult<{ updated: number; totalRm: number }>> {
  await requireAdminSession()
  let totalRm = 0
  let updated = 0
  for (const id of input.agentIds) {
    // eslint-disable-next-line no-await-in-loop
    const r = await markAgentCommissionsPaid({
      agentId: id,
      paymentMethod: input.paymentMethod,
    })
    if (r.ok) {
      updated += 1
      totalRm += (r as { ok: true; data?: { amountRm: number } }).data?.amountRm ?? 0
    }
  }
  revalidatePath('/admin/partners/payouts')
  return { ok: true, data: { updated, totalRm } }
}

// ---------------------------------------------------------------------------
// Manually reverse a single commission (for disputes)
// ---------------------------------------------------------------------------

export async function reverseCommission(
  commissionId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    if (!reason || reason.trim().length < 3) {
      return { ok: false, error: 'Reason required.' }
    }
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('agent_commissions') as any)
      .update({
        status: 'reversed',
        reversed_at: new Date().toISOString(),
        reversal_reason: reason,
      })
      .eq('id', commissionId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/partners')
    revalidatePath('/admin/partners/payouts')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
