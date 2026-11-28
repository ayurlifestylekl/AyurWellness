import { describe, expect, it } from 'vitest'
import { matchMedicine, medicineKey, similarity } from '../prescription'
import { DENOMINATIONS, breakdownTotal, cleanBreakdown } from '../day'
import { validityText } from '../rules'
import { currentAge, ageGenderText } from '@/lib/staff/case-sheets'
import { staffBaseOf } from '@/lib/staff/use-staff-base'

const shop = [
  { id: 'p1', name: 'Balashwagandhaadi Tailam' },
  { id: 'p2', name: 'Lakshadi Kera Tailam' },
  { id: 'p3', name: 'AWC Nalpamaradi Body Lotion' },
  { id: 'p4', name: 'Dandra Care Oil' },
  { id: 'p5', name: 'Rose Water' },
  { id: 'p6', name: 'Himasagara Tailam' },
]

describe('matching a prescription to what the centre sells', () => {
  it('finds the product despite spelling differences', () => {
    expect(matchMedicine('Balashwagandhadi tailam', shop)?.id).toBe('p1')
    expect(matchMedicine('balaswagandhadi thailam', shop)?.id).toBe('p1')
    expect(matchMedicine('Lakshadi Kera', shop)?.id).toBe('p2')
    expect(matchMedicine('Nalpamaradi lotion', shop)?.id).toBe('p3')
    expect(matchMedicine('Himasagara thailam 200ml', shop)?.id).toBe('p6')
  })
  it('does not guess for medicines the centre does not sell', () => {
    expect(matchMedicine('Ashwagandha churna', shop)).toBeNull()
    expect(matchMedicine('Triphala', shop)).toBeNull()
    expect(matchMedicine('', shop)).toBeNull()
  })
  it('compares names without filler words and doubled letters', () => {
    expect(medicineKey('Balashwagandhaadi Tailam')).toBe(medicineKey('Balashwagandhadi taila'))
    expect(similarity('Rose Water', 'rose water')).toBe(1)
  })
})

describe('cash counted by notes and coins', () => {
  it('adds up exactly, in sen', () => {
    expect(breakdownTotal({ RM100: 2, RM50: 1, RM1: 3, '50sen': 1, '5sen': 3 })).toBe(253.65)
    expect(breakdownTotal(null)).toBe(0)
  })
  it('keeps only real notes and coins in whole counts', () => {
    expect(cleanBreakdown({ RM100: 2, RM3: 5, '5sen': -1, RM50: 1.5, RM10: '4' })).toEqual({ RM100: 2, RM10: 4 })
    expect(cleanBreakdown({ RM100: 0 })).toBeNull()
    expect(cleanBreakdown('x')).toBeNull()
  })
  it('lists Malaysian notes and coins, largest first', () => {
    expect(DENOMINATIONS.map((d) => d.sen)).toEqual([10000, 5000, 2000, 1000, 500, 100, 50, 20, 10, 5])
  })
})

describe('patient age', () => {
  it('comes from the date of birth when there is one', () => {
    expect(currentAge('1990-06-15', '2026-11-28', { ageYears: 99, recordedOn: '2020-01-01' })).toBe(36)
  })
  it('otherwise from the age told, growing with the years', () => {
    expect(currentAge(null, '2026-11-28', { ageYears: 40, recordedOn: '2026-11-28' })).toBe(40)
    expect(currentAge(null, '2028-12-01', { ageYears: 40, recordedOn: '2026-11-28' })).toBe(42)
    expect(currentAge(null, '2026-11-28', { ageYears: null, recordedOn: null })).toBeNull()
  })
  it('shows on the case sheet header', () => {
    expect(ageGenderText(null, 'female', '2026-11-28', { ageYears: 52, recordedOn: '2026-11-01' })).toBe('52 / Female')
  })
})

describe('package validity text', () => {
  it('reads in months or days', () => {
    expect(validityText({ validDays: null, validMonths: 6 })).toBe('valid 6 months')
    expect(validityText({ validDays: null, validMonths: 1 })).toBe('valid 1 month')
    expect(validityText({ validDays: 180, validMonths: null })).toBe('valid 180 days')
  })
})

describe('shared screens stay in their portal', () => {
  it('knows the doctor portal from the address', () => {
    expect(staffBaseOf('/doctor/checkout/abc')).toBe('/doctor')
    expect(staffBaseOf('/console/checkout')).toBe('/console')
    expect(staffBaseOf(null)).toBe('/console')
  })
})
