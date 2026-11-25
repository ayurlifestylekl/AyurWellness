import 'server-only'
import { VIP_FULL_ERROR, VIP_ROOMS, readExtras, type ChosenExtra, type VipRoomKind } from './extras'

/**
 * VIP room check for bookings the front desk makes directly (the online
 * booking path checks inside claim_instant_slots instead). Counts VIP
 * bookings of the same room kind that overlap each new one, including the
 * new ones made together (a group), against the number of rooms.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = { from: (t: string) => any }

interface NewVisit {
  startISO: string
  durationMins: number
  extras: ChosenExtra[]
}

const ACTIVE = ['scheduled', 'awaiting_payment', 'confirmed', 'checked_in', 'in_progress', 'pending']

const range = (startISO: string, mins: number) => {
  const s = new Date(startISO).getTime()
  return [s, s + mins * 60_000] as const
}
const overlaps = (a: readonly [number, number], b: readonly [number, number]) => a[0] < b[1] && b[0] < a[1]

export function vipRoomOf(extras: ChosenExtra[]): VipRoomKind | null {
  return (extras.find((e) => e.code === 'vip_room')?.room as VipRoomKind | undefined) ?? null
}

/** VIP_FULL_ERROR when any new visit would need more VIP rooms of its kind than exist; otherwise null. */
export async function vipRoomProblem(db: Db, visits: NewVisit[]): Promise<string | null> {
  const wanted = visits.map((v) => ({ ...v, room: vipRoomOf(v.extras), r: range(v.startISO, v.durationMins) })).filter((v) => v.room)
  if (!wanted.length) return null
  const from = new Date(Math.min(...wanted.map((v) => v.r[0])) - 12 * 3600_000).toISOString()
  const to = new Date(Math.max(...wanted.map((v) => v.r[1]))).toISOString()
  const { data, error } = await db
    .from('appointments')
    .select('appointment_date_time, duration_mins, status, payment_expires_at, extras')
    .in('status', ACTIVE)
    .gte('appointment_date_time', from)
    .lt('appointment_date_time', to)
  if (error) {
    // Before 20261126_booking_extras.sql there is no extras column, so no VIP bookings exist yet.
    if (/extras/.test(error.message)) return null
    console.error('[vip] lookup failed:', error.message)
    return 'Could not check the VIP rooms. Please try again.'
  }
  const now = Date.now()
  const existing = (data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((a: any) => a.appointment_date_time && !(a.status === 'awaiting_payment' && a.payment_expires_at && new Date(a.payment_expires_at).getTime() <= now))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: any) => ({ room: vipRoomOf(readExtras(a.extras)), r: range(a.appointment_date_time, a.duration_mins ?? 60) }))
    .filter((a: { room: VipRoomKind | null }) => a.room)
  const taken: { room: VipRoomKind | null; r: readonly [number, number] }[] = [...existing]
  for (const v of wanted) {
    const busy = taken.filter((t) => t.room === v.room && overlaps(t.r, v.r)).length
    if (busy >= VIP_ROOMS[v.room as VipRoomKind].count) return VIP_FULL_ERROR
    taken.push({ room: v.room, r: v.r })
  }
  return null
}
