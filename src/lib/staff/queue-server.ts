import 'server-only'
import { NextResponse } from 'next/server'
import type { ServiceDb } from './guard'
import type { QueueCall } from './queue'

/** Today's calls, newest first (the lobby screen asks every few seconds). */
export async function todaysCalls(db: ServiceDb): Promise<QueueCall[]> {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date())
  const { data, error } = await db
    .from('appointments')
    .select('id, queue_no, call_room, room, called_at, call_count')
    .eq('queue_day', today)
    .not('called_at', 'is', null)
    .order('called_at', { ascending: false })
    .limit(10)
  if (error) {
    // Before 20261201_queue_calls.sql there are no calls to show.
    if (!/queue_|called_at|call_/.test(error.message)) console.error('[queue] calls:', error.message)
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    queueNo: Number(r.queue_no),
    room: r.call_room ?? r.room ?? null,
    calledAt: r.called_at,
    callCount: Number(r.call_count ?? 0),
  }))
}

export async function callsResponse(db: ServiceDb) {
  return NextResponse.json({ calls: await todaysCalls(db) }, { headers: { 'Cache-Control': 'no-store' } })
}
