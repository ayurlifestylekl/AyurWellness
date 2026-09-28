import { describe, it, expect } from 'vitest'
import { selectBookableVaidyas } from '../consultation-availability'
import type { Vaidya } from '@/lib/staff/therapist-format'

describe('selectBookableVaidyas', () => {
  it('includes all active Vaidyas regardless of public_facing flag', () => {
    const all: Vaidya[] = [
      { code: 'VAIDYA', name: 'Vaidya Akhil', active: true, publicFacing: true },
      { code: 'LYMAT', name: 'Vaidya LYMAT', active: true, publicFacing: false },
      { code: 'NEW01', name: 'New Doctor', active: true },
    ]
    const codes = selectBookableVaidyas(all).map((v) => v.code)
    expect(codes).toEqual(['VAIDYA', 'LYMAT', 'NEW01'])
  })

  it('prefers the primary VAIDYA code first', () => {
    const all: Vaidya[] = [
      { code: 'LYMAT', name: 'Vaidya LYMAT', active: true },
      { code: 'VAIDYA', name: 'Vaidya Akhil', active: true },
    ]
    expect(selectBookableVaidyas(all)[0].code).toBe('VAIDYA')
  })

  it('excludes inactive Vaidyas', () => {
    const all: Vaidya[] = [
      { code: 'VAIDYA', name: 'Vaidya Akhil', active: true },
      { code: 'LYMAT', name: 'Vaidya LYMAT', active: false },
    ]
    const codes = selectBookableVaidyas(all).map((v) => v.code)
    expect(codes).toEqual(['VAIDYA'])
  })

  it('returns an empty array when there are no active Vaidyas', () => {
    expect(selectBookableVaidyas([])).toEqual([])
  })
})
