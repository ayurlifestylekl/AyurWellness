import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { buildManagementModel } from '../management'

const nowMs = Date.parse('2026-07-18T08:00:00+08:00')
const paidTreatment = {
  id: 'a',
  created_at: '2026-07-17T09:00:00Z',
  appointment_date_time: '2026-07-21T09:30:00+08:00',
  requested_datetime: '2026-07-21T09:30:00+08:00',
  status: 'confirmed',
  payment_status: 'paid',
  booking_kind: 'treatment',
  treatment_name: 'Abhyanga',
  patient_name: 'Asha',
  assigned_therapist_name: 'Therapist Maya',
  payable_amount_rm: 180,
  calcom_booking_uid: null,
}

describe('buildManagementModel', () => {
  it('builds a paid treatment with policy-derived management actions', () => {
    expect(buildManagementModel(paidTreatment, nowMs)).toMatchObject({
      id: 'a',
      bookingKind: 'treatment',
      treatmentName: 'Abhyanga',
      patientName: 'Asha',
      selectedTime: '2026-07-21T09:30:00+08:00',
      therapist: 'Therapist Maya',
      payment: { display: 'paid', amountRm: 180 },
      refundEligibility: 'advance_window',
      canReschedule: true,
      canCancel: true,
      policyReason: 'eligible',
      groupMembers: [],
    })
  })

  it('identifies a free consultation as not paid without inventing a price', () => {
    expect(buildManagementModel({
      ...paidTreatment,
      booking_kind: 'consultation',
      payment_status: 'unpaid',
      payable_amount_rm: null,
      treatment_name: 'Free Consultation',
      assigned_therapist_name: null,
    }, nowMs)).toMatchObject({
      bookingKind: 'consultation',
      therapist: 'our Vaidya',
      payment: { display: 'free', amountRm: null },
      refundEligibility: 'not_paid',
    })
  })

  it('closes actions when the appointment window has passed', () => {
    expect(buildManagementModel({
      ...paidTreatment,
      created_at: '2026-07-15T09:00:00Z',
      appointment_date_time: '2026-07-18T20:00:00+08:00',
    }, nowMs)).toMatchObject({
      canReschedule: false,
      canCancel: false,
      refundEligibility: 'not_eligible',
      policyReason: 'change_window_closed',
    })
  })

  it('never gates actions or output on a historical Cal.com UID', () => {
    const withoutLegacyProvider = { ...paidTreatment, calcom_booking_uid: null }
    const withLegacyProvider = { ...paidTreatment, calcom_booking_uid: 'legacy' }
    expect(buildManagementModel(withoutLegacyProvider, nowMs))
      .toEqual(buildManagementModel(withLegacyProvider, nowMs))
  })

  it('includes group members and persisted refund display state', () => {
    expect(buildManagementModel({
      ...paidTreatment,
      group_id: 'group-a',
      booking_refunds: [{ id: 'refund-a', status: 'pending', amount_rm: 180, customer_reason: null, staff_reason: null }],
      group_members: [{
        ...paidTreatment,
        id: 'b',
        patient_name: 'Devi',
        treatment_name: 'Shirodhara',
        payable_amount_rm: 220,
      }],
    }, nowMs)).toMatchObject({
      payment: { display: 'refund_pending' },
      refund: { status: 'pending', amountRm: 180 },
      groupMembers: [{
        id: 'b',
        patientName: 'Devi',
        treatmentName: 'Shirodhara',
        canReschedule: true,
        canCancel: true,
      }],
    })
  })
})
