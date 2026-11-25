import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { vipRoomProblem } from '../vip'
import { VIP_FULL_ERROR, resolveExtras } from '../extras'

const hairVip = resolveExtras('cat-massage__head-neck-shoulder-massage', ['vip_room'])
const facialVip = resolveExtras('cat-face-care__mukha-abhyangam', ['vip_room'])

function db(rows: unknown[]) {
  const q = { select: () => q, in: () => q, gte: () => q, lt: () => Promise.resolve({ data: rows, error: null }) }
  return { from: () => q }
}
const booked = (start: string, extras: unknown, mins = 60, status = 'confirmed') => ({ appointment_date_time: start, duration_mins: mins, status, payment_expires_at: null, extras })
const AT = '2026-12-01T02:00:00.000Z'

describe('VIP rooms for front-desk bookings', () => {
  it('no VIP, no check', async () => {
    expect(await vipRoomProblem(db([]), [{ startISO: AT, durationMins: 60, extras: [] }])).toBeNull()
  })
  it('the second hair room is free; a third overlapping one is not', async () => {
    expect(await vipRoomProblem(db([booked(AT, hairVip)]), [{ startISO: AT, durationMins: 60, extras: hairVip }])).toBeNull()
    expect(await vipRoomProblem(db([booked(AT, hairVip), booked(AT, hairVip)]), [{ startISO: AT, durationMins: 60, extras: hairVip }])).toBe(VIP_FULL_ERROR)
  })
  it('one facial room: a group of two facial VIPs at once is refused', async () => {
    const v = { startISO: AT, durationMins: 60, extras: facialVip }
    expect(await vipRoomProblem(db([]), [v, v])).toBe(VIP_FULL_ERROR)
  })
  it('a booking that ended, or a lapsed unpaid hold, does not count', async () => {
    const lapsed = { ...booked(AT, facialVip, 60, 'awaiting_payment'), payment_expires_at: '2020-01-01T00:00:00Z' }
    expect(await vipRoomProblem(db([booked('2026-12-01T00:30:00.000Z', facialVip), lapsed]), [{ startISO: AT, durationMins: 60, extras: facialVip }])).toBeNull()
  })
})
