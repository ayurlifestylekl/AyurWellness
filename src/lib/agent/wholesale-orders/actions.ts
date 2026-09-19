'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

const ProofSchema = z.object({
  orderId: z.string().uuid(),
  paymentProofUrl: z.string().url('Paste a valid URL (Google Drive, Dropbox, etc.)'),
  note: z.string().max(500).optional().or(z.literal('')),
})

export async function submitWholesalePaymentProof(
  input: unknown,
): Promise<ActionResult> {
  try {
    const me = await getCurrentUser()
    if (!me || me.role !== 'sales_agent') {
      return { ok: false, error: 'Not authorised.' }
    }
    const parsed = ProofSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    }
    const supabase = await createClient()
    // Verify the order belongs to this agent and is still pending
    const { data: agent } = await supabase
      .from('sales_agents')
      .select('id')
      .eq('user_id', me.profile.id)
      .maybeSingle()
    if (!agent) return { ok: false, error: 'Partner profile not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agentId = (agent as any).id as string

    const noteSuffix = parsed.data.note?.trim()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order } = await supabase
      .from('wholesale_orders')
      .select('id, agent_notes')
      .eq('id', parsed.data.orderId)
      .eq('agent_id', agentId)
      .eq('status', 'pending_payment')
      .maybeSingle()
    if (!order) {
      return {
        ok: false,
        error: 'Order not found, not yours, or already past payment.',
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any = order

    const combinedNotes = noteSuffix
      ? [existing.agent_notes, `[Payment note] ${noteSuffix}`]
          .filter(Boolean)
          .join('\n\n')
      : existing.agent_notes

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('wholesale_orders') as any)
      .update({
        payment_proof_url: parsed.data.paymentProofUrl,
        agent_notes: combinedNotes,
      })
      .eq('id', parsed.data.orderId)
      .eq('agent_id', agentId)
      .eq('status', 'pending_payment')
    if (error) return { ok: false, error: error.message }

    revalidatePath(`/agent/wholesale-orders/${parsed.data.orderId}`)
    revalidatePath('/agent/wholesale-orders')
    revalidatePath('/admin/wholesale-orders')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
