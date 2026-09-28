import type { Slot } from './scheduling'
import { findClash } from './scheduling'
import type { BlockedInterval } from './blocks'
import { isBlocked } from './blocks'
import { VAIDYA_BLOCK_CODE, type Vaidya } from '@/lib/staff/therapists'

/** Everything needed to decide, for any time on a given day, which Vaidya
 * (if any) is free — loaded once per day so a slot list can be scored
 * without a DB round trip per slot. */
export type ConsultationAvailabilityContext = {
  vaidyas: Vaidya[]
  busyByVaidya: Map<string, Slot[]>
  intervals: BlockedInterval[]
}

/** First public-facing Vaidya (in `ctx.vaidyas` preference order) with no
 * clash and no block at this time, or null if every public-facing Vaidya is
 * unavailable. */
export function freeVaidyaIn(ctx: ConsultationAvailabilityContext, iso: string, durationMins: number): string | null {
  for (const v of ctx.vaidyas) {
    const busy = ctx.busyByVaidya.get(v.code) ?? []
    if (findClash({ startISO: iso, durationMins }, busy) === null && !isBlocked(ctx.intervals, v.code, iso, durationMins)) {
      return v.code
    }
  }
  return null
}

/** Every active Vaidya is eligible for public consultation booking. The admin
 * roster UI can deactivate a doctor to hide them; VAIDYA (the primary doctor)
 * is preferred first when both are free. */
export function selectBookableVaidyas(allVaidyas: Vaidya[]): Vaidya[] {
  const candidates = allVaidyas.filter((v) => v.active !== false)
  return candidates.sort((a, b) =>
    a.code === VAIDYA_BLOCK_CODE ? -1 : b.code === VAIDYA_BLOCK_CODE ? 1 : a.code.localeCompare(b.code))
}
