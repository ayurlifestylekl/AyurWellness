import { describe, it, expect } from 'vitest'
import {
  requiredTherapistGender,
  payableAmount,
} from '../policy'

describe('booking policy', () => {
  it('enforces same-gender therapist matching', () => {
    expect(requiredTherapistGender('male')).toBe('male')
    expect(requiredTherapistGender('female')).toBe('female')
  })

  it('returns full price as payable, throws when no fixed price', () => {
    expect(payableAmount(155)).toBe(155)
    expect(() => payableAmount(null)).toThrow()
  })
})
