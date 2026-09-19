import { describe, it, expect } from 'vitest'
import { canTransition, STATUS_LABEL } from '../status'

describe('booking status machine', () => {
  it('approves a request into awaiting_payment (treatment path)', () => {
    expect(canTransition('pending', 'awaiting_payment')).toBe(true)
  })

  it('confirms after payment', () => {
    expect(canTransition('awaiting_payment', 'confirmed')).toBe(true)
  })

  it('confirms a consultation directly (no payment)', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true)
  })

  it('forbids illegal jumps', () => {
    expect(canTransition('pending', 'completed')).toBe(false)
    expect(canTransition('completed', 'confirmed')).toBe(false)
  })

  it('allows cancellation from confirmed', () => {
    expect(canTransition('confirmed', 'cancelled')).toBe(true)
  })

  it('has a human label for every status', () => {
    expect(STATUS_LABEL.awaiting_payment).toBe('Awaiting payment')
    expect(Object.keys(STATUS_LABEL)).toContain('no_show')
  })
})
