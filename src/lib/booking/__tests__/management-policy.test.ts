import { describe, expect, it } from 'vitest'
import { managementEligibility, refundEligibility } from '../management-policy'

const appointmentAt = '2026-07-20T09:30:00+08:00'
const createdAt = '2026-07-18T09:00:00+08:00'
const base = { appointmentAt, createdAt, status: 'confirmed', paymentStatus: 'paid' }

describe('managementEligibility', () => {
  it('allows rescheduling at exactly 24h and closes it one millisecond later', () => {
    expect(managementEligibility({ ...base, nowMs: new Date('2026-07-19T09:30:00+08:00').getTime() }).canReschedule).toBe(true)
    expect(managementEligibility({ ...base, nowMs: new Date('2026-07-19T09:30:00.001+08:00').getTime() }).canReschedule).toBe(false)
  })
  it('refunds a mistake within one hour even for a near-term appointment', () => {
    expect(managementEligibility({
      ...base,
      createdAt: '2026-07-20T07:45:00+08:00',
      nowMs: new Date('2026-07-20T08:30:00+08:00').getTime(),
    })).toMatchObject({ canCancel: true, refundEligibility: 'mistake_window' })
  })
  it('does not refund or cancel a started paid booking inside the mistake window', () => {
    const input = {
      ...base,
      appointmentAt: '2026-07-20T08:00:00+08:00',
      createdAt: '2026-07-20T07:45:00+08:00',
      nowMs: new Date('2026-07-20T08:00:00+08:00').getTime(),
    }
    expect(refundEligibility(input)).toBe('not_eligible')
    expect(managementEligibility(input)).toMatchObject({ canCancel: false, refundEligibility: 'not_eligible' })
  })
  it('does not refund or cancel a closed paid booking inside the mistake window', () => {
    const input = {
      ...base,
      status: 'cancelled',
      createdAt: '2026-07-20T07:45:00+08:00',
      nowMs: new Date('2026-07-20T08:30:00+08:00').getTime(),
    }
    expect(refundEligibility(input)).toBe('not_eligible')
    expect(managementEligibility(input)).toMatchObject({ canCancel: false, refundEligibility: 'not_eligible' })
  })
  it('refunds at 48h but not inside 48h', () => {
    const outsideMistakeWindow = { ...base, createdAt: '2026-07-18T07:00:00+08:00' }
    expect(managementEligibility({ ...outsideMistakeWindow, nowMs: new Date('2026-07-18T09:30:00+08:00').getTime() }).refundEligibility).toBe('advance_window')
    expect(managementEligibility({ ...outsideMistakeWindow, nowMs: new Date('2026-07-18T09:30:00.001+08:00').getTime() }).refundEligibility).toBe('not_eligible')
  })
  it('allows a near-term unpaid hold cancellation without a refund', () => {
    expect(managementEligibility({
      ...base,
      appointmentAt: '2026-07-20T09:30:00+08:00',
      createdAt: '2026-07-20T08:00:00+08:00',
      status: 'awaiting_payment',
      paymentStatus: 'pending',
      nowMs: new Date('2026-07-20T08:30:00+08:00').getTime(),
    })).toMatchObject({ canCancel: true, refundEligibility: 'not_paid' })
  })
})
