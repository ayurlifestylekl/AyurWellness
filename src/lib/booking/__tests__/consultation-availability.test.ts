import { describe, it, expect } from 'vitest'
import { freeVaidyaIn, type ConsultationAvailabilityContext } from '../consultation-availability'
import type { Slot } from '../scheduling'
import type { BlockedInterval } from '../blocks'

const VAIDYA = { code: 'VAIDYA', name: 'our Vaidya' }
const LYMAT = { code: 'LYMAT', name: 'Vaidya LYMAT' }

function ctx(busyByVaidya: Record<string, Slot[]> = {}, intervals: BlockedInterval[] = []): ConsultationAvailabilityContext {
  return {
    vaidyas: [VAIDYA, LYMAT],
    busyByVaidya: new Map(Object.entries(busyByVaidya)),
    intervals,
  }
}

describe('freeVaidyaIn', () => {
  const iso = '2026-08-10T14:00:00+08:00'

  it('picks the first (preferred) Vaidya when everyone is free', () => {
    expect(freeVaidyaIn(ctx(), iso, 30)).toBe('VAIDYA')
  })

  it('falls through to the next Vaidya when the first is busy', () => {
    const c = ctx({ VAIDYA: [{ startISO: iso, durationMins: 30 }] })
    expect(freeVaidyaIn(c, iso, 30)).toBe('LYMAT')
  })

  it('returns null when every Vaidya is busy', () => {
    const c = ctx({
      VAIDYA: [{ startISO: iso, durationMins: 30 }],
      LYMAT: [{ startISO: iso, durationMins: 30 }],
    })
    expect(freeVaidyaIn(c, iso, 30)).toBeNull()
  })

  it('a busy VAIDYA does not block LYMAT (the whole point of this feature)', () => {
    const c = ctx({ VAIDYA: [{ startISO: iso, durationMins: 30 }] })
    expect(freeVaidyaIn(c, iso, 30)).not.toBeNull()
  })

  it('skips a Vaidya blocked (on leave) at this time even with no appointment clash', () => {
    const c = ctx({}, [{ id: 'b1', therapistCode: 'VAIDYA', startMs: new Date(iso).getTime() - 3_600_000, endMs: new Date(iso).getTime() + 3_600_000, reason: 'Leave' }])
    expect(freeVaidyaIn(c, iso, 30)).toBe('LYMAT')
  })

  it('a centre-wide block (therapistCode null) blocks every Vaidya', () => {
    const c = ctx({}, [{ id: 'b1', therapistCode: null, startMs: new Date(iso).getTime() - 3_600_000, endMs: new Date(iso).getTime() + 3_600_000, reason: 'Closed' }])
    expect(freeVaidyaIn(c, iso, 30)).toBeNull()
  })

  it('returns null when there are no bookable Vaidyas at all', () => {
    expect(freeVaidyaIn({ vaidyas: [], busyByVaidya: new Map(), intervals: [] }, iso, 30)).toBeNull()
  })

  it('respects vaidyas preference order, not just VAIDYA-first', () => {
    // If VAIDYA were filtered out upstream (e.g. inactive), LYMAT alone should still work.
    const c: ConsultationAvailabilityContext = { vaidyas: [LYMAT], busyByVaidya: new Map(), intervals: [] }
    expect(freeVaidyaIn(c, iso, 30)).toBe('LYMAT')
  })
})
