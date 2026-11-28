'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireStaff } from './guard'

type Result = { ok: true; queueNo: number } | { ok: false; error: string }

/**
 * Call a guest: the lobby screen shows their number and says it aloud, with
 * the room. Pressing it again calls them again. Front desk and doctors.
 */
export async function callGuest(id: string, room?: string | null): Promise<Result> {
  const { db } = await requireStaff(['admin', 'front_desk', 'doctor'])
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'Guest not found.' }
  const callRoom = z.string().trim().max(40).safeParse(room ?? '').data || null

  const { data: no, error: qErr } = await db.rpc('assign_queue_no', { p_id: id })
  if (qErr || no == null) {
    if (qErr) console.error('[queue] call number:', qErr.message)
    return { ok: false, error: /assign_queue_no|function/i.test(qErr?.message ?? '') ? 'Calling needs a one-time database update. Please ask your developer to run it.' : 'Could not call this guest. Please try again.' }
  }
  const { data: row } = await db.from('appointments').select('call_count').eq('id', id).maybeSingle()
  const { error } = await db
    .from('appointments')
    .update({ called_at: new Date().toISOString(), call_count: Number(row?.call_count ?? 0) + 1, ...(callRoom ? { call_room: callRoom } : {}) })
    .eq('id', id)
  if (error) {
    console.error('[queue] call:', error.message)
    return { ok: false, error: 'Could not call this guest. Please try again.' }
  }
  revalidatePath('/console/waiting')
  revalidatePath('/doctor/waiting')
  return { ok: true, queueNo: Number(no) }
}
