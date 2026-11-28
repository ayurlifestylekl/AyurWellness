import { describe, expect, it } from 'vitest'
import { announcement, newCalls, queueLabel, roomLabel } from '../queue'

describe('waiting room calls', () => {
  it('shows numbers with two digits', () => {
    expect(queueLabel(7)).toBe('07')
    expect(queueLabel(112)).toBe('112')
    expect(queueLabel(null)).toBe('—')
  })
  it('says the number and room in English, then Malay, never a name', () => {
    expect(announcement(7, '2')).toEqual({ en: 'Number 7, please proceed to room 2.', ms: 'Nombor 7, sila ke bilik 2.' })
    expect(announcement(12, 'VIP Facial Room')).toEqual({ en: 'Number 12, please proceed to VIP Facial Room.', ms: 'Nombor 12, sila ke VIP Facial Room.' })
    expect(announcement(3, null)).toEqual({ en: 'Number 3, please come to the front desk.', ms: 'Nombor 3, sila ke kaunter.' })
  })
  it('labels rooms', () => {
    expect(roomLabel('3')).toBe('Room 3')
    expect(roomLabel('2B')).toBe('Room 2B')
    expect(roomLabel('Consultation room')).toBe('Consultation room')
    expect(roomLabel('  ')).toBeNull()
  })
  it('announces only calls newer than the last one seen, oldest first (a repeat call counts as new)', () => {
    const calls = [
      { id: 'b', queueNo: 8, room: '1', calledAt: '2026-11-28T03:05:00Z', callCount: 1 },
      { id: 'a', queueNo: 7, room: '2', calledAt: '2026-11-28T03:04:00Z', callCount: 2 },
      { id: 'c', queueNo: 6, room: '2', calledAt: '2026-11-28T03:00:00Z', callCount: 1 },
    ]
    expect(newCalls(calls, '2026-11-28T03:01:00Z').map((c) => c.queueNo)).toEqual([7, 8])
    expect(newCalls(calls, '2026-11-28T03:05:00Z')).toEqual([])
  })
})
