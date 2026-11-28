import { describe, expect, it } from 'vitest'
import { publicName, sortBoard, type WaitingGuest } from '../waiting'

const NOW = new Date('2026-11-22T06:00:00Z').getTime() // 2:00 pm in Malaysia
const at = (minsFromNow: number) => new Date(NOW + minsFromNow * 60000).toISOString()
const g = (over: Partial<WaitingGuest>): WaitingGuest => ({
  id: Math.random().toString(36).slice(2),
  patientName: 'Guest',
  treatmentName: 'Abhyangam',
  bookingKind: 'treatment',
  status: 'confirmed',
  startsAt: at(0),
  durationMins: 60,
  therapistCode: 'T1',
  therapistName: 'Nithi',
  room: null,
  checkedInAt: null,
  startedAt: null,
  queueNo: null,
  calledAt: null,
  callCount: 0,
  ...over,
})

describe('waiting room', () => {
  it('sorts today into arriving (next hour), waiting (longest first) and in treatment', () => {
    const board = sortBoard(
      [
        g({ patientName: 'Due in 30', startsAt: at(30) }),
        g({ patientName: 'Due in 90', startsAt: at(90) }),
        g({ patientName: 'Late arrival', startsAt: at(-20) }),
        g({ patientName: 'Waited 5', status: 'checked_in', checkedInAt: at(-5) }),
        g({ patientName: 'Waited 25', status: 'checked_in', checkedInAt: at(-25) }),
        g({ patientName: 'Started', status: 'in_progress', startedAt: at(-10) }),
        g({ patientName: 'Done', status: 'completed' }),
      ],
      NOW,
    )
    expect(board.arriving.map((x) => x.patientName)).toEqual(['Late arrival', 'Due in 30'])
    expect(board.waiting.map((x) => x.patientName)).toEqual(['Waited 25', 'Waited 5'])
    expect(board.inTreatment.map((x) => x.patientName)).toEqual(['Started'])
    expect(board.doneToday).toBe(1)
  })

  it('shows only first name and initial on the lobby screen', () => {
    expect(publicName('Priya Raman')).toBe('Priya R.')
    expect(publicName('  Mohd Farid bin Hakim ')).toBe('Mohd H.')
    expect(publicName('Daniel')).toBe('Daniel')
  })
})
