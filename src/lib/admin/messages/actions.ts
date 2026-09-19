'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications/create'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

async function requireAdminSession() {
  const me = await getCurrentUser()
  if (!me || me.role !== 'admin') throw new Error('Not authorised.')
  return me
}

// ---------------------------------------------------------------------------
// Reply to a ticket
// ---------------------------------------------------------------------------

const ReplySchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().min(1).max(8000),
  markResolved: z.boolean().optional(),
})

export async function replyToTicket(raw: unknown): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const input = ReplySchema.parse(raw)
    const supabase = await createClient()

    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, customer_id, subject, status')
      .eq('id', input.ticketId)
      .single()
    if (!ticket) return { ok: false, error: 'Ticket not found.' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t: any = ticket

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: msgErr } = await (supabase.from('support_messages') as any).insert({
      ticket_id: input.ticketId,
      sender_kind: 'clinic',
      body: input.body,
    })
    if (msgErr) return { ok: false, error: msgErr.message }

    const nowIso = new Date().toISOString()
    const nextStatus = input.markResolved
      ? 'resolved'
      : t.status === 'closed' || t.status === 'resolved'
        ? t.status
        : 'awaiting-customer'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: tErr } = await (supabase.from('support_tickets') as any)
      .update({
        last_message_at: nowIso,
        unread_by_clinic: false,
        unread_by_customer: true,
        status: nextStatus,
      })
      .eq('id', input.ticketId)
    if (tErr) return { ok: false, error: tErr.message }

    await createNotification({
      userId: t.customer_id,
      kind: 'ticket_reply',
      title: `New reply on "${t.subject}"`,
      body: input.body.slice(0, 140),
      href: `/account/messages/${input.ticketId}`,
    })

    revalidatePath(`/admin/messages/${input.ticketId}`)
    revalidatePath('/admin/messages')
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

// ---------------------------------------------------------------------------
// Change status
// ---------------------------------------------------------------------------

export async function setTicketStatus(
  ticketId: string,
  to: 'open' | 'awaiting-customer' | 'resolved' | 'closed',
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('support_tickets') as any)
      .update({ status: to })
      .eq('id', ticketId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/messages/${ticketId}`)
    revalidatePath('/admin/messages')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Mark unread / read (for staff)
// ---------------------------------------------------------------------------

export async function setTicketReadByClinic(
  ticketId: string,
  read: boolean,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('support_tickets') as any)
      .update({ unread_by_clinic: !read })
      .eq('id', ticketId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/messages/${ticketId}`)
    revalidatePath('/admin/messages')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Assign to self / clear assignment
// ---------------------------------------------------------------------------

export async function assignTicketToMe(ticketId: string): Promise<ActionResult> {
  try {
    const me = await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('support_tickets') as any)
      .update({ assigned_to_admin_id: me.authId })
      .eq('id', ticketId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/messages/${ticketId}`)
    revalidatePath('/admin/messages')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function clearTicketAssignment(ticketId: string): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('support_tickets') as any)
      .update({ assigned_to_admin_id: null })
      .eq('id', ticketId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/messages/${ticketId}`)
    revalidatePath('/admin/messages')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Change topic
// ---------------------------------------------------------------------------

export async function setTicketTopic(
  ticketId: string,
  topic: 'treatment' | 'prescription' | 'appointment' | 'order' | 'billing' | 'welcome' | 'other',
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('support_tickets') as any)
      .update({ topic })
      .eq('id', ticketId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/messages/${ticketId}`)
    revalidatePath('/admin/messages')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Internal notes (staff-only)
// ---------------------------------------------------------------------------

export async function setTicketInternalNotes(
  ticketId: string,
  notes: string,
): Promise<ActionResult> {
  try {
    await requireAdminSession()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('support_tickets') as any)
      .update({ internal_notes: notes })
      .eq('id', ticketId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/admin/messages/${ticketId}`)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
