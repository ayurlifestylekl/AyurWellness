import { describe, it, expect, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { normalizePhone, patientKey } from '@/lib/staff/patients'

describe('normalizePhone', () => {
  it('treats the same Malaysian number the same however it was typed', () => {
    expect(normalizePhone('+60 12-345 6789')).toBe('0123456789')
    expect(normalizePhone('012 345 6789')).toBe('0123456789')
    expect(normalizePhone('60123456789')).toBe('0123456789')
  })

  it('ignores blanks and fragments', () => {
    expect(normalizePhone(null)).toBeNull()
    expect(normalizePhone('-')).toBeNull()
    expect(normalizePhone('12345')).toBeNull()
  })
})

describe('patientKey', () => {
  it('matches a returning patient by phone and first name', () => {
    const a = patientKey({ patientPhone: '+60 16-234 5678', customerId: null, patientName: 'Priya Raman' })
    const b = patientKey({ patientPhone: '0162345678', customerId: 'acct-1', patientName: 'priya' })
    expect(a).toBe(b)
  })

  it('keeps different people on a shared number apart', () => {
    const mum = patientKey({ patientPhone: '0162345678', customerId: null, patientName: 'Lakshmi' })
    const son = patientKey({ patientPhone: '0162345678', customerId: null, patientName: 'Arjun' })
    expect(mum).not.toBe(son)
  })

  it('falls back to the account, then the full name', () => {
    expect(patientKey({ patientPhone: null, customerId: 'acct-1', patientName: 'Aisyah' })).toBe('c:acct-1')
    expect(patientKey({ patientPhone: '', customerId: null, patientName: '  Aisyah  Rahman ' })).toBe('n:aisyah rahman')
    expect(patientKey({ patientPhone: null, customerId: null, patientName: null })).toBeNull()
  })
})
