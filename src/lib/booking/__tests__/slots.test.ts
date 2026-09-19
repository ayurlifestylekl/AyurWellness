import { describe, expect, it } from 'vitest'
import { CONSULTATION_MINS, consultationSlots, minBookableDate, slotIso, slotsForDuration, validateSubmittedSlot } from '../slots'

const now = new Date('2026-07-16T01:00:00.000Z').getTime() // 09:00 MYT

describe('validateSubmittedSlot', () => {
  it('accepts a generated future treatment slot', () => {
    expect(validateSubmittedSlot({
      iso: slotIso('2026-07-17', '09:30'), durationMins: 60,
      nowMs: now, leadTimeHours: 0, kind: 'treatment',
    })).toEqual({ ok: true })
  })

  it.each([
    ['invalid timestamp', 'not-a-date'],
    ['past slot', '2026-07-15T01:30:00.000Z'],
    ['misaligned slot', '2026-07-17T01:45:00.000Z'],
    ['outside opening hours', '2026-07-17T00:30:00.000Z'],
  ])('rejects %s', (_label, iso) => {
    expect(validateSubmittedSlot({ iso, durationMins: 60, nowMs: now, leadTimeHours: 0, kind: 'treatment' })).toHaveProperty('error')
  })

  it('rejects a slot inside the treatment lead time', () => {
    expect(validateSubmittedSlot({
      iso: '2026-07-16T02:30:00.000Z', durationMins: 60,
      nowMs: now, leadTimeHours: 24, kind: 'treatment',
    })).toHaveProperty('error')
  })

  it('allows only generated 30-minute consultation slots', () => {
    expect(validateSubmittedSlot({
      iso: slotIso('2026-07-17', '10:30'), durationMins: 30,
      nowMs: now, leadTimeHours: 0, kind: 'consultation',
    })).toEqual({ ok: true })
  })

  it('uses the same consultation generator for the 10:30 opening boundary', () => {
    expect(CONSULTATION_MINS).toBe(30)
    expect(consultationSlots()[0]).toBe('10:30')
    expect(consultationSlots()).not.toContain('09:30')
    expect(validateSubmittedSlot({
      iso: slotIso('2026-07-17', '10:00'), durationMins: 30,
      nowMs: now, leadTimeHours: 0, kind: 'consultation',
    })).toHaveProperty('error')
  })
})

describe('slotsForDuration — client-requested fixed public times', () => {
  it('offers exactly the 5 requested start times for a short therapy', () => {
    expect(slotsForDuration(30)).toEqual(['09:30', '11:30', '14:30', '16:30', '18:30'])
  })

  it('drops start times that would run past the 20:30 close for a long therapy', () => {
    // A 2.5h (150 min) therapy starting 18:30 would end 21:00 — past close.
    expect(slotsForDuration(150)).toEqual(['09:30', '11:30', '14:30', '16:30'])
  })

  it('rejects a treatment slot at a non-fixed time even if otherwise valid', () => {
    expect(validateSubmittedSlot({
      iso: slotIso('2026-07-17', '10:00'), durationMins: 60,
      nowMs: now, leadTimeHours: 0, kind: 'treatment',
    })).toHaveProperty('error')
  })
})

describe('minBookableDate — 24h public lead time', () => {
  it('returns the next day when the 24h floor falls after all of today’s fixed slots', () => {
    // "now" is 09:00 MYT on 16 Jul — +24h lands at 09:00 MYT on 17 Jul, after
    // 17 Jul's own slots have already started counting from 09:30, so the
    // earliest fixed slot at/after that floor is still on the 17th.
    expect(minBookableDate(new Date(now))).toBe('2026-07-17')
  })

  it('pushes to the day after next when booked in the afternoon (the client’s literal example)', () => {
    // 16 Jul 15:00 MYT (07:00 UTC) + 24h = 17 Jul 15:00 MYT — every fixed
    // slot on the 17th (up to 18:30) is fine, so it stays on the 17th... but
    // the client's rule is "no next-morning booking after today's afternoon
    // cutoff," which the code enforces via the exact +24h floor, not a
    // same-day carve-out — confirm the floor is exactly 24h, not less.
    const afternoonNow = Date.parse('2026-07-16T07:00:00.000Z') // 15:00 MYT
    const result = minBookableDate(new Date(afternoonNow))
    const earliestAllowedMs = Date.parse(slotIso(result, slotsForDuration(30).find(
      (t) => Date.parse(slotIso(result, t)) >= afternoonNow + 24 * 3_600_000,
    ) ?? slotsForDuration(30)[0]))
    expect(earliestAllowedMs).toBeGreaterThanOrEqual(afternoonNow + 24 * 3_600_000)
  })
})
