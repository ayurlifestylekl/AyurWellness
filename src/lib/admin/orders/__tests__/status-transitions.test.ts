import { describe, it, expect } from 'vitest'
import { canTransition, nextStatuses } from '../status-transitions'

describe('canTransition', () => {
  it('allows pending → processing', () => {
    expect(canTransition('pending', 'processing')).toBe(true)
  })

  it('allows the full happy path processing → packing → shipped → delivered → completed', () => {
    expect(canTransition('processing', 'packing')).toBe(true)
    expect(canTransition('packing', 'shipped')).toBe(true)
    expect(canTransition('shipped', 'delivered')).toBe(true)
    expect(canTransition('delivered', 'completed')).toBe(true)
  })

  it('forbids going backwards', () => {
    expect(canTransition('shipped', 'processing')).toBe(false)
    expect(canTransition('delivered', 'shipped')).toBe(false)
    expect(canTransition('completed', 'delivered')).toBe(false)
  })

  it('allows cancel from any non-terminal pre-shipped status', () => {
    expect(canTransition('pending', 'cancelled')).toBe(true)
    expect(canTransition('processing', 'cancelled')).toBe(true)
    expect(canTransition('packing', 'cancelled')).toBe(true)
  })

  it('forbids cancel from shipped/delivered/completed', () => {
    expect(canTransition('shipped', 'cancelled')).toBe(false)
    expect(canTransition('delivered', 'cancelled')).toBe(false)
    expect(canTransition('completed', 'cancelled')).toBe(false)
  })

  it('forbids transitions out of terminal states', () => {
    expect(canTransition('completed', 'shipped')).toBe(false)
    expect(canTransition('cancelled', 'processing')).toBe(false)
  })
})

describe('nextStatuses', () => {
  it('returns the set of allowed targets from pending', () => {
    expect(nextStatuses('pending')).toEqual(expect.arrayContaining(['processing', 'cancelled']))
  })

  it('returns empty array for terminal states', () => {
    expect(nextStatuses('completed')).toEqual([])
    expect(nextStatuses('cancelled')).toEqual([])
  })

  it('returns only delivered from shipped', () => {
    expect(nextStatuses('shipped')).toEqual(['delivered'])
  })
})
