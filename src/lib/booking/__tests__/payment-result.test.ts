import { describe, expect, it } from 'vitest'
import {
  classifyPaymentConfirmation,
  paymentCallbackResponse,
  paymentProblemAlertInput,
  persistBillAssociation,
  parsePaymentConfirmation,
} from '../payment-result'

const row = {
  id: 'a',
  patient_name: 'Asha',
  guest_age: null,
  treatment_name: 'Abhyanga',
  appointment_date_time: '2026-07-20T02:00:00.000Z',
  patient_email: 'asha@example.com',
}

describe('parsePaymentConfirmation', () => {
  it('maps one confirmed booking', () => {
    const r = parsePaymentConfirmation({
      state: 'confirmed', lead_id: 'a', group_id: null, booking_status: 'confirmed', should_alert: false, rows: [row],
    })
    expect(r).toMatchObject({ state: 'confirmed', leadId: 'a', groupId: null })
    expect(r.rows).toHaveLength(1)
  })

  it('maps every member of a shared-bill group', () => {
    const r = parsePaymentConfirmation({
      state: 'confirmed', lead_id: 'a', group_id: 'g', booking_status: 'confirmed', should_alert: false,
      rows: [row, { ...row, id: 'b', patient_name: 'Bala' }],
    })
    expect(r.rows.map((x) => x.id)).toEqual(['a', 'b'])
  })

  it('preserves already-confirmed idempotent results', () => {
    expect(parsePaymentConfirmation({
      state: 'already_confirmed', lead_id: 'a', group_id: null, booking_status: 'confirmed', should_alert: false, rows: [],
    }).state).toBe('already_confirmed')
  })

  it('preserves once-only late-payment alert eligibility and booking context', () => {
    const first = parsePaymentConfirmation({
      state: 'not_payable', lead_id: 'a', group_id: null, booking_status: 'cancelled', should_alert: true, rows: [row],
    })
    const duplicate = parsePaymentConfirmation({
      state: 'not_payable', lead_id: 'a', group_id: null, booking_status: 'cancelled', should_alert: false, rows: [row],
    })
    expect(first).toMatchObject({ state: 'not_payable', bookingStatus: 'cancelled', shouldAlert: true })
    expect(first.rows[0]).toMatchObject({ id: 'a', patient_name: 'Asha', treatment_name: 'Abhyanga' })
    expect(duplicate.shouldAlert).toBe(false)
  })

  it.each([
    null,
    7,
    [],
    {},
    { state: 'wat', lead_id: null, group_id: null, booking_status: null, should_alert: false, rows: [] },
    { state: { toString: (): string => 'not_payable' }, lead_id: 'a', group_id: null, booking_status: 'cancelled', should_alert: true, rows: [row] },
    { state: 'confirmed', lead_id: ' ', group_id: null, booking_status: 'confirmed', should_alert: false, rows: [{ ...row, id: ' ' }] },
    { state: 'confirmed', lead_id: 'a', group_id: ' ', booking_status: 'confirmed', should_alert: false, rows: [row] },
    { state: 'confirmed', lead_id: 'a', group_id: null, booking_status: 'confirmed', should_alert: false, rows: [{}] },
    { state: 'confirmed', lead_id: 'a', group_id: null, booking_status: 'confirmed', should_alert: false, rows: [7] },
    { state: 'confirmed', lead_id: 'a', group_id: null, booking_status: 'confirmed', should_alert: false, rows: [{ ...row, guest_age: '30' }] },
    { state: 'confirmed', lead_id: 'missing', group_id: null, booking_status: 'confirmed', should_alert: false, rows: [row] },
    { state: 'already_confirmed', lead_id: 'a', group_id: null, booking_status: 'confirmed', should_alert: false, rows: [row] },
    { state: 'not_found', lead_id: 'a', group_id: null, booking_status: null, should_alert: false, rows: [] },
    { state: 'not_payable', lead_id: 'a', group_id: null, booking_status: null, should_alert: true, rows: [row] },
    { state: 'not_payable', lead_id: 'a', group_id: null, booking_status: 'cancelled', should_alert: true, rows: [] },
  ])('rejects malformed RPC payload %#', (payload) => {
    expect(() => parsePaymentConfirmation(payload)).toThrow('Invalid payment confirmation result.')
  })
})

describe('payment state routing', () => {
  it('classifies confirmed and already-confirmed as terminal success', () => {
    const confirmed = parsePaymentConfirmation({
      state: 'confirmed', lead_id: 'a', group_id: null, booking_status: 'confirmed', should_alert: false, rows: [row],
    })
    const already = parsePaymentConfirmation({
      state: 'already_confirmed', lead_id: 'a', group_id: null, booking_status: 'confirmed', should_alert: false, rows: [],
    })
    expect(classifyPaymentConfirmation(confirmed)).toEqual({ disposition: 'terminal', state: 'confirmed', appointmentId: 'a' })
    expect(classifyPaymentConfirmation(already)).toEqual({ disposition: 'terminal', state: 'already_confirmed', appointmentId: 'a' })
  })

  it('classifies not-payable as handled terminal and not-found as transient', () => {
    const late = parsePaymentConfirmation({
      state: 'not_payable', lead_id: 'a', group_id: null, booking_status: 'cancelled', should_alert: false, rows: [row],
    })
    const missing = parsePaymentConfirmation({
      state: 'not_found', lead_id: null, group_id: null, booking_status: null, should_alert: false, rows: [],
    })
    expect(classifyPaymentConfirmation(late)).toEqual({ disposition: 'terminal', state: 'not_payable', bookingId: 'a' })
    expect(classifyPaymentConfirmation(missing)).toEqual({ disposition: 'transient', state: 'not_found' })
  })

  it('acknowledges an all-confirmed group idempotently', () => {
    const allConfirmed = parsePaymentConfirmation({
      state: 'already_confirmed', lead_id: 'a', group_id: 'g', booking_status: 'confirmed', should_alert: false, rows: [],
    })
    expect(classifyPaymentConfirmation(allConfirmed)).toEqual({
      disposition: 'terminal', state: 'already_confirmed', appointmentId: 'a',
    })
    expect(paymentCallbackResponse(classifyPaymentConfirmation(allConfirmed))).toEqual({ status: 200, ok: true })
  })

  it('acknowledges a mixed historical group as a once-only terminal problem', () => {
    const first = parsePaymentConfirmation({
      state: 'not_payable', lead_id: 'a', group_id: 'g', booking_status: 'mixed_group', should_alert: true, rows: [row],
    })
    const duplicate = parsePaymentConfirmation({
      state: 'not_payable', lead_id: 'a', group_id: 'g', booking_status: 'mixed_group', should_alert: false, rows: [row],
    })
    expect(classifyPaymentConfirmation(first)).toEqual({ disposition: 'terminal', state: 'not_payable', bookingId: 'a' })
    expect(paymentCallbackResponse(classifyPaymentConfirmation(first))).toEqual({ status: 200, ok: true })
    expect(paymentProblemAlertInput(first)).toMatchObject({ bookingStatus: 'mixed_group', name: 'Asha' })
    expect(paymentProblemAlertInput(duplicate)).toBeNull()
  })

  it('routes actual late-payment context only for the durable alert claimant', () => {
    const first = parsePaymentConfirmation({
      state: 'not_payable', lead_id: 'a', group_id: null, booking_status: 'expired', should_alert: true, rows: [row],
    })
    const duplicate = parsePaymentConfirmation({
      state: 'not_payable', lead_id: 'a', group_id: null, booking_status: 'expired', should_alert: false, rows: [row],
    })
    expect(paymentProblemAlertInput(first)).toEqual({ name: 'Asha', treatmentName: 'Abhyanga', bookingStatus: 'expired' })
    expect(paymentProblemAlertInput(duplicate)).toBeNull()
  })

  it('maps terminal results to acknowledgement and transient results to provider retry', () => {
    expect(paymentCallbackResponse({ disposition: 'terminal', state: 'confirmed', appointmentId: 'a' })).toEqual({ status: 200, ok: true })
    expect(paymentCallbackResponse({ disposition: 'terminal', state: 'already_confirmed', appointmentId: 'a' })).toEqual({ status: 200, ok: true })
    expect(paymentCallbackResponse({ disposition: 'terminal', state: 'not_payable', bookingId: 'a' })).toEqual({ status: 200, ok: true })
    expect(paymentCallbackResponse({ disposition: 'transient', state: 'not_found' })).toEqual({ status: 503, ok: false })
    expect(paymentCallbackResponse({ disposition: 'transient', state: 'rpc_error' })).toEqual({ status: 503, ok: false })
    expect(paymentCallbackResponse({ disposition: 'transient', state: 'invalid_result' })).toEqual({ status: 503, ok: false })
    // Provider unreachable/unqueryable is inconclusive — retry so a later
    // attempt can still resolve it.
    expect(paymentCallbackResponse({ disposition: 'transient', state: 'provider_unconfirmed' })).toEqual({ status: 503, ok: false })
  })

  it('acknowledges a provider-confirmed negative instead of retrying forever', () => {
    // The provider was reachable and definitively said "not paid" — that's a
    // settled outcome, not a glitch. Retrying it forever (503) would make the
    // gateway hammer the callback for a bill that will never confirm this way.
    expect(paymentCallbackResponse({ disposition: 'final', state: 'provider_not_paid' })).toEqual({ status: 200, ok: true })
  })
})

describe('persistBillAssociation', () => {
  it('exposes an associated bill only when the exact expected row count is written', async () => {
    let deactivations = 0
    let alerts = 0
    const result = await persistBillAssociation({
      billId: 'bill_ok',
      expectedCount: 2,
      associate: async () => ({ count: 2, error: null }),
      deactivate: async () => { deactivations += 1 },
      alert: async () => { alerts += 1 },
    })
    expect(result).toBe('associated')
    expect({ deactivations, alerts }).toEqual({ deactivations: 0, alerts: 0 })
  })

  it.each([
    { count: 1, error: null },
    { count: null, error: null },
    { count: 2, error: new Error('database unavailable') },
  ])('deactivates and alerts without exposing an ambiguous association: %o', async (association) => {
    const deactivated: string[] = []
    const alerted: string[] = []
    const result = await persistBillAssociation({
      billId: 'bill_unsafe',
      expectedCount: 2,
      associate: async () => association,
      deactivate: async (billId) => { deactivated.push(billId) },
      alert: async (billId) => { alerted.push(billId) },
    })
    expect(result).toBe('failed')
    expect(deactivated).toEqual(['bill_unsafe'])
    expect(alerted).toEqual(['bill_unsafe'])
  })
})
