import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/clinic', () => ({ PATIENT_ID_PREFIX: 'KAL' }))

import { ageGenderText, ageYears, emptySheetData, isSheetEmpty, normalizeSheetData, sheetSummary } from '../case-sheets'
import { formatPatientNo } from '../patient-id'

describe('case sheets', () => {
  it('keeps only the fields each sheet defines, with the paper form’s row counts', () => {
    const primary = normalizeSheetData('primary', {
      chiefComplaints: 'Lower back pain, 3 months',
      nadi: 'Vata-pitta',
      prescriptions: [{ medicine: 'Dhanwantharam kashayam', dose: '15 ml BD before food', duration: '14 days', extra: 'x' }],
      injected: '<script>',
    })
    expect(primary.chiefComplaints).toBe('Lower back pain, 3 months')
    expect(primary.nadi).toBe('Vata-pitta')
    expect(primary).not.toHaveProperty('injected')
    expect(primary.prescriptions).toHaveLength(6)
    expect((primary.prescriptions as { medicine: string }[])[0]).toEqual({ medicine: 'Dhanwantharam kashayam', dose: '15 ml BD before food', duration: '14 days' })
    expect(normalizeSheetData('follow_up', {}).prescriptions).toHaveLength(8)
    expect(Object.keys(normalizeSheetData('follow_up', { chiefComplaints: 'x' }))).toEqual(['progress', 'prescriptions'])
  })

  it('cuts over-long text instead of rejecting the whole sheet', () => {
    const d = normalizeSheetData('primary', { diagnosis: 'a'.repeat(5000), nadi: 'b'.repeat(500), prescriptions: 'not a list' })
    expect((d.diagnosis as string).length).toBe(4000)
    expect((d.nadi as string).length).toBe(200)
    expect(d.prescriptions).toHaveLength(6)
  })

  it('knows an untouched sheet and summarises a written one', () => {
    expect(isSheetEmpty(emptySheetData('primary'))).toBe(true)
    const d = normalizeSheetData('follow_up', { progress: '  Pain reduced.\n\nContinue   Kizhi.  ' })
    expect(isSheetEmpty(d)).toBe(false)
    expect(sheetSummary('follow_up', d)).toBe('Pain reduced. Continue Kizhi.')
  })

  it('works out age on the sheet date and the header text', () => {
    expect(ageYears('1990-11-23', '2026-11-22')).toBe(35)
    expect(ageYears('1990-11-22', '2026-11-22')).toBe(36)
    expect(ageYears(null, '2026-11-22')).toBeNull()
    expect(ageGenderText('1990-01-01', 'female', '2026-11-22')).toBe('36 / Female')
    expect(ageGenderText(null, 'male', '2026-11-22')).toBe('— / Male')
    expect(ageGenderText(null, null, '2026-11-22')).toBe('')
  })

  it('formats the patient ID', () => {
    expect(formatPatientNo(12)).toBe('KAL-00012')
    expect(formatPatientNo(123456)).toBe('KAL-123456')
    expect(formatPatientNo(null)).toBeNull()
  })
})
