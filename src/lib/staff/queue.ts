/**
 * Waiting room calls: the number shown and what the lobby screen says.
 * Pure, so the screen, the staff view and tests agree.
 */

/** "07" (two digits, more when needed). */
export function queueLabel(n: number | null | undefined): string {
  return n == null ? '—' : String(n).padStart(2, '0')
}

/** "Room 2" for a bare number, otherwise the room as written ("VIP Room"). */
export function roomLabel(room: string | null | undefined): string | null {
  const r = room?.trim()
  if (!r) return null
  return /^\d+[A-Za-z]?$/.test(r) ? `Room ${r}` : r
}

/** "Bilik 2" for a bare number, otherwise the room as written. */
export function roomLabelMs(room: string | null | undefined): string | null {
  const r = room?.trim()
  if (!r) return null
  return /^\d+[A-Za-z]?$/.test(r) ? `Bilik ${r}` : r
}

/** What the lobby screen says: English, then Bahasa Malaysia. Numbers and rooms only, never names. */
export function announcement(queueNo: number, room: string | null | undefined): { en: string; ms: string } {
  const r = room?.trim()
  const numbered = r && /^\d+[A-Za-z]?$/.test(r)
  const en = r ? `please proceed to ${numbered ? `room ${r}` : r}` : 'please come to the front desk'
  const ms = r ? `sila ke ${numbered ? `bilik ${r}` : r}` : 'sila ke kaunter'
  return { en: `Number ${queueNo}, ${en}.`, ms: `Nombor ${queueNo}, ${ms}.` }
}

export interface QueueCall {
  id: string
  queueNo: number
  room: string | null
  calledAt: string
  callCount: number
}

/** Calls the lobby has not announced yet, oldest first: newer than the last one it saw. */
export function newCalls(calls: QueueCall[], lastSeen: string | null): QueueCall[] {
  return calls.filter((c) => !lastSeen || c.calledAt > lastSeen).sort((a, b) => a.calledAt.localeCompare(b.calledAt))
}
