import { describe, it, expect } from 'vitest'
import { isLive, pickActive, type Announcement } from '../announcements'

const mk = (over: Partial<Announcement>): Announcement => ({
  id: over.id ?? 'x',
  kind: over.kind ?? 'message',
  message: over.message ?? 'hi',
  startDate: over.startDate ?? null,
  endDate: over.endDate ?? null,
  blockId: null,
  createdAt: over.createdAt ?? '2026-07-01',
})

const TODAY = '2026-07-05'

describe('isLive', () => {
  it('shows a closure on/until its last day, hides it once past', () => {
    expect(isLive(mk({ kind: 'closure', startDate: '2026-07-05' }), TODAY)).toBe(true) // today
    expect(isLive(mk({ kind: 'closure', startDate: '2026-07-10' }), TODAY)).toBe(true) // upcoming
    expect(isLive(mk({ kind: 'closure', startDate: '2026-07-01' }), TODAY)).toBe(false) // past
    expect(isLive(mk({ kind: 'closure', startDate: '2026-07-01', endDate: '2026-07-06' }), TODAY)).toBe(true) // range spans today
  })

  it('never shows a closure with no date', () => {
    expect(isLive(mk({ kind: 'closure', startDate: null }), TODAY)).toBe(false)
  })

  it('shows a message until its optional end date passes', () => {
    expect(isLive(mk({ kind: 'message' }), TODAY)).toBe(true) // no dates → always
    expect(isLive(mk({ kind: 'message', endDate: '2026-07-10' }), TODAY)).toBe(true)
    expect(isLive(mk({ kind: 'message', endDate: '2026-07-01' }), TODAY)).toBe(false)
  })
})

describe('pickActive', () => {
  it('prefers the nearest upcoming closure over any message', () => {
    const list = [
      mk({ id: 'm', kind: 'message', createdAt: '2026-07-05' }),
      mk({ id: 'far', kind: 'closure', startDate: '2026-07-20' }),
      mk({ id: 'near', kind: 'closure', startDate: '2026-07-08' }),
    ]
    expect(pickActive(list, TODAY)?.id).toBe('near')
  })

  it('falls back to the newest message when no closures are live', () => {
    const list = [
      mk({ id: 'old', kind: 'message', createdAt: '2026-07-01' }),
      mk({ id: 'new', kind: 'message', createdAt: '2026-07-04' }),
    ]
    expect(pickActive(list, TODAY)?.id).toBe('new')
  })

  it('returns null when everything has expired', () => {
    const list = [
      mk({ id: 'past', kind: 'closure', startDate: '2026-07-01' }),
      mk({ id: 'gone', kind: 'message', endDate: '2026-07-01' }),
    ]
    expect(pickActive(list, TODAY)).toBeNull()
  })
})
