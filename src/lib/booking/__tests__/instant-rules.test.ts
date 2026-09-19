import { describe, expect, it } from 'vitest'
import type { BookingRequestInput } from '@/types/booking'
import {
  GENERIC_INSTANT_ERROR,
  canonicalInstantTiming,
  instantBookingSuccessPath,
  patientGenderError,
  publicInstantFailure,
  resolveRequestedConsultationTreatment,
  submitInstantSingleBooking,
  validateInstantGroupGuests,
} from '../instant-rules'

const validGuest = {
  name: 'Anu',
  gender: 'female' as const,
  preferredAt: '2026-07-18T02:00:00.000Z',
}

describe('validateInstantGroupGuests', () => {
  it('rejects the whole group when any submitted guest is incomplete', () => {
    const result = validateInstantGroupGuests([
      validGuest,
      { ...validGuest, name: '  ' },
    ])
    expect(result).toHaveProperty('error')
  })

  it('rejects a null submitted guest instead of throwing', () => {
    expect(validateInstantGroupGuests([validGuest, null as never])).toHaveProperty('error')
  })

  it('checks the submitted count before validation so filtering cannot evade the limit', () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({
      ...validGuest,
      name: i === 6 ? '' : `Guest ${i + 1}`,
    }))
    expect(validateInstantGroupGuests(seven)).toEqual({ error: 'Up to 6 guests per group booking.' })
  })

  it('rejects invalid gender, time, or age without dropping that guest', () => {
    expect(validateInstantGroupGuests([validGuest, { ...validGuest, gender: 'other' }])).toHaveProperty('error')
    expect(validateInstantGroupGuests([validGuest, { ...validGuest, preferredAt: 'not-a-date' }])).toHaveProperty('error')
    expect(validateInstantGroupGuests([validGuest, { ...validGuest, age: -1 }])).toHaveProperty('error')
  })

  it('rejects a non-string guest treatment before the action can call trim', () => {
    expect(validateInstantGroupGuests([
      validGuest,
      { ...validGuest, treatmentId: 5 },
    ])).toEqual({ error: 'Please choose a valid treatment for every guest.' })
  })

  it('preserves optional, blank, and string guest treatments for shared-treatment fallback', () => {
    expect(validateInstantGroupGuests([
      validGuest,
      { ...validGuest, treatmentId: null },
      { ...validGuest, treatmentId: '' },
      { ...validGuest, treatmentId: 'treatment-id' },
    ])).toEqual({ ok: true })
  })
})

describe('patientGenderError', () => {
  it('uses consultation-specific public copy with no therapist-matching language', () => {
    const message = patientGenderError('consultation')
    expect(message).toBe('Please select the patient’s gender.')
    expect(message).not.toMatch(/therapist|matching/i)
  })

  it('keeps the matching explanation for treatment bookings', () => {
    expect(patientGenderError('treatment')).toBe('Please select a gender for therapist matching.')
  })
})

describe('canonicalInstantTiming', () => {
  it('suppresses alternate times for treatment and group claim rows', () => {
    expect(canonicalInstantTiming({
      kind: 'treatment', preferredAt: validGuest.preferredAt, durationMins: 60,
    })).toEqual({
      appointmentDatetime: validGuest.preferredAt,
      durationMins: 60,
      requestedDatetime: validGuest.preferredAt,
      requestedDatetimeAlt: null,
    })
  })

  it('forces a linked consultation to 30 minutes', () => {
    expect(canonicalInstantTiming({
      kind: 'consultation', preferredAt: validGuest.preferredAt, durationMins: 120,
    }).durationMins).toBe(30)
  })
})

describe('publicInstantFailure', () => {
  it('never exposes raw provider details', () => {
    const message = publicInstantFailure(new Error('relation appointments_secret does not exist'))
    expect(message).toBe(GENERIC_INSTANT_ERROR)
    expect(message).not.toContain('appointments_secret')
  })

  it('preserves the stable just-taken slot response', () => {
    expect(publicInstantFailure(new Error('SLOT_FULL: female'))).toBe('That slot was just taken — please pick another time.')
  })

  it('preserves the stable duplicate linked-treatment response', () => {
    expect(publicInstantFailure(new Error('ACTIVE_LINKED_TREATMENT_EXISTS'))).toBe(
      'A treatment booking is already active for this consultation.',
    )
  })
})

describe('resolveRequestedConsultationTreatment', () => {
  it('returns a stable error when a requested treatment lookup fails', () => {
    expect(resolveRequestedConsultationTreatment({
      requested: true,
      data: null,
      error: new Error('upstream provider credentials'),
    })).toEqual({ error: GENERIC_INSTANT_ERROR })
  })

  it('allows an intentional standalone free consultation', () => {
    expect(resolveRequestedConsultationTreatment({ requested: false, data: null, error: null })).toEqual({ value: null })
  })
})

describe('submitInstantSingleBooking', () => {
  const base: BookingRequestInput = {
    bookingKind: 'treatment',
    treatmentId: 'therapy-a',
    preferredAt: '2026-07-18T02:00:00.000Z',
    patientName: 'Anu',
    patientPhone: '0123456789',
    patientEmail: 'anu@example.com',
    patientGender: 'female',
    isGuest: true,
    healthIntake: {},
    acceptedPolicies: true,
    parentConsultationId: 'consultation-a',
    parentConsultationToken: 'signed-consultation-token',
  }

  it('routes treatment payloads with the signed parent token to the instant treatment action', async () => {
    const received: BookingRequestInput[] = []
    const result = await submitInstantSingleBooking(base, {
      createTreatment: async (input) => { received.push(input); return { id: 'treatment-booking', token: 'treatment-token' } },
      createConsultation: async () => { throw new Error('wrong action') },
    })

    expect(received).toEqual([base])
    expect(received[0]?.parentConsultationToken).toBe('signed-consultation-token')
    expect(result).toEqual({ id: 'treatment-booking', token: 'treatment-token' })
  })

  it('routes consultation payloads to the instant consultation action', async () => {
    const consultation = { ...base, bookingKind: 'consultation' as const, parentConsultationId: null, parentConsultationToken: null }
    const received: BookingRequestInput[] = []
    const result = await submitInstantSingleBooking(consultation, {
      createTreatment: async () => { throw new Error('wrong action') },
      createConsultation: async (input) => { received.push(input); return { id: 'consultation-booking', token: 'consultation-token' } },
    })

    expect(received).toEqual([consultation])
    expect(result).toEqual({ id: 'consultation-booking', token: 'consultation-token' })
  })
})

describe('instantBookingSuccessPath', () => {
  it('returns the existing signed status route for a treatment hold', () => {
    const path = instantBookingSuccessPath({ id: 'treatment-booking', token: 'treatment-token' })
    expect(path).toBe('/book/request/treatment-booking?t=treatment-token')
    expect(path).not.toContain('/checkout')
  })

  it('returns the same signed status route for an instant consultation', () => {
    expect(instantBookingSuccessPath({ id: 'consultation-booking', token: 'consultation-token' })).toBe(
      '/book/request/consultation-booking?t=consultation-token',
    )
  })
})
