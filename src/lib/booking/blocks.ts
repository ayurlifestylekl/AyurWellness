import { mytDayKey, mytTimeOfDay } from '@/lib/datetime'
import { slotIso } from './slots'

/** A schedule block row (therapist leave / centre closure / manual block). */
export interface ScheduleBlock {
  id: string
  therapist_code: string | null // null = all therapists
  start_at: string
  end_at: string
  all_day: boolean
  recurrence: 'none' | 'weekly' | 'monthly'
  until_date: string | null
  reason: string | null
}

export interface BlockedInterval {
  /** Source block id — lets the schedule delete an occurrence directly. */
  id: string | null
  therapistCode: string | null
  startMs: number
  endMs: number
  reason: string | null
}

const weekday = (ymd: string) => new Date(`${ymd}T00:00:00Z`).getUTCDay()
const dayOfMonth = (ymd: string) => Number(ymd.slice(8, 10))

/**
 * Expand the blocks that produce an occurrence on the given Malaysia date into
 * concrete time intervals (ms). Handles one-off, weekly and monthly recurrence.
 */
export function blockedIntervalsForDate(blocks: ScheduleBlock[], dateYMD: string): BlockedInterval[] {
  const dayStartMs = new Date(`${dateYMD}T00:00:00+08:00`).getTime()
  const dayEndMs = dayStartMs + 86_400_000
  const out: BlockedInterval[] = []

  for (const b of blocks) {
    const anchorYMD = mytDayKey(b.start_at)
    let applies = false
    if (b.recurrence === 'none') {
      applies = dateYMD >= anchorYMD && dateYMD <= mytDayKey(b.end_at)
    } else if (dateYMD >= anchorYMD && (!b.until_date || dateYMD <= b.until_date)) {
      applies =
        b.recurrence === 'weekly'
          ? weekday(dateYMD) === weekday(anchorYMD)
          : dayOfMonth(dateYMD) === dayOfMonth(anchorYMD)
    }
    if (!applies) continue

    let startMs: number
    let endMs: number
    if (b.all_day) {
      startMs = dayStartMs
      endMs = dayEndMs
    } else {
      startMs = new Date(slotIso(dateYMD, mytTimeOfDay(b.start_at))).getTime()
      endMs = new Date(slotIso(dateYMD, mytTimeOfDay(b.end_at))).getTime()
    }
    out.push({ id: b.id, therapistCode: b.therapist_code, startMs, endMs, reason: b.reason })
  }
  return out
}

/** Is a therapy window blocked for this therapist (or by an all-therapist block)? */
export function isBlocked(
  intervals: BlockedInterval[],
  therapistCode: string,
  startISO: string,
  durationMins: number,
): boolean {
  const s = new Date(startISO).getTime()
  const e = s + durationMins * 60_000
  return intervals.some(
    (iv) => (iv.therapistCode === null || iv.therapistCode === therapistCode) && s < iv.endMs && iv.startMs < e,
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = { from: (t: string) => any }

/** Fetch blocks that could apply on/after a given Malaysia date. */
export async function fetchBlocksOnOrAfter(sb: SB, dateYMD: string): Promise<ScheduleBlock[]> {
  const dayEndISO = new Date(`${dateYMD}T00:00:00+08:00`).toISOString()
  const { data } = await sb
    .from('schedule_blocks')
    .select('id, therapist_code, start_at, end_at, all_day, recurrence, until_date, reason')
    .lte('start_at', new Date(new Date(dayEndISO).getTime() + 86_400_000).toISOString())
  return (data ?? []) as ScheduleBlock[]
}
