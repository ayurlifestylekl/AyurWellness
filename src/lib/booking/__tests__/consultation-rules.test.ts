import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  canClearConsultation,
  canLinkTreatmentToConsultation,
  hasActiveLinkedTreatment,
  validateLegacyParentConsultationLink,
} from '../consultation-rules'

const past = '2026-07-15T02:00:00.000Z'
const future = '2026-07-18T02:00:00.000Z'
const nowMs = new Date('2026-07-16T02:00:00.000Z').getTime()

describe('canClearConsultation', () => {
  it.each(['checked_in', 'in_progress', 'completed'] as const)('allows an attended past consultation in %s', (status) => {
    expect(canClearConsultation({ bookingKind: 'consultation', status, appointmentISO: past, nowMs })).toBe(true)
  })

  it('rejects future consultations', () => {
    expect(canClearConsultation({ bookingKind: 'consultation', status: 'checked_in', appointmentISO: future, nowMs })).toBe(false)
  })

  it('rejects a past consultation that has not been attended', () => {
    expect(canClearConsultation({ bookingKind: 'consultation', status: 'confirmed', appointmentISO: past, nowMs })).toBe(false)
  })

  it('rejects treatments', () => {
    expect(canClearConsultation({ bookingKind: 'treatment', status: 'completed', appointmentISO: past, nowMs })).toBe(false)
  })
})

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

function exportedFunction(path: string, name: string): string {
  const contents = source(path)
  const start = contents.indexOf(`export async function ${name}`)
  expect(start, `${name} should be exported from ${path}`).toBeGreaterThanOrEqual(0)
  const nextExport = contents.indexOf('\nexport ', start + 1)
  return contents.slice(start, nextExport < 0 ? undefined : nextExport)
}

describe('consultation clearance integration contracts', () => {
  it('limits the unlock action to clinical staff and validates the selected consultation before updating it', () => {
    const action = exportedFunction('src/lib/staff/actions.ts', 'unlockTreatment')

    expect(action).toContain("requireStaff(['admin', 'doctor'])")
    expect(action).not.toContain('front_desk')
    expect(action).toContain('note.trim()')
    expect(action).toContain("select('booking_kind, status, appointment_date_time')")
    expect(action).toContain('canClearConsultation')
    expect(action.match(/\.eq\('id', consultationId\)/g)).toHaveLength(2)
    expect(action).toContain(".eq('booking_kind', 'consultation')")
    expect(action).toContain(".in('status', CLEARABLE_CONSULTATION_STATUSES)")
    expect(action).toContain(".lte('appointment_date_time'")
  })

  it('restricts the doctor clearance query at the database and pure-rule layers', () => {
    const query = exportedFunction('src/lib/staff/appointments.ts', 'getConsultationsToClear')

    expect(query).toContain(".eq('booking_kind', 'consultation')")
    expect(query).toContain(".in('status', CLEARABLE_CONSULTATION_STATUSES)")
    expect(query).toContain(".lte('appointment_date_time'")
    expect(query).toContain('canClearConsultation')
  })

  it('keeps clearance controls out of front desk and gates the doctor control by eligibility', () => {
    const frontDesk = source('src/app/(staff)/console/[id]/page.tsx')
    const doctor = source('src/app/(staff)/doctor/[id]/page.tsx')

    expect(frontDesk).not.toContain('UnlockTreatment')
    expect(doctor).toContain('canClearConsultation')
    expect(doctor).toContain('a.treatmentUnlocked ||')
    expect(doctor).toContain('Clearance becomes available after this consultation is attended')
  })

  it('wires the form through the behaviorally tested instant submission seam', () => {
    const statusPage = source('src/app/(public)/book/request/[id]/page.tsx')
    const orchestrator = source('src/components/booking/BookingTreatmentOrchestrator.tsx')
    const form = source('src/components/booking/BookingRequestForm.tsx')

    expect(statusPage).toContain('ct=${token ?? \'\'}')
    expect(orchestrator).toContain("searchParams.get('ct')")
    expect(orchestrator).toContain('parentConsultationToken={consultationToken}')
    expect(form).toContain('parentConsultationToken?: string | null')
    expect(form).toContain('parentConsultationToken: parentConsultationToken ?? null')
    expect(form).toContain('submitInstantSingleBooking')
    expect(form).not.toContain('createBookingRequest')
    expect(form).toContain("bookingKind === 'consultation'")
    expect(form).toContain('/checkout?t=${res.token}')
  })

  it('authorizes and validates the parent consultation before claiming a treatment hold', () => {
    const action = exportedFunction('src/lib/booking/instant.ts', 'createInstantTreatmentBooking')
    const accessCheck = action.indexOf('await canAccessBooking(')
    const holdClaim = action.indexOf('await runClaims(')

    const duplicateCheck = action.indexOf('hasActiveLinkedTreatment(')

    expect(action).toContain("select('id, customer_id, patient_email, booking_kind, treatment_id, treatment_unlocked')")
    expect(accessCheck).toBeGreaterThanOrEqual(0)
    expect(duplicateCheck).toBeGreaterThan(accessCheck)
    expect(holdClaim).toBeGreaterThan(accessCheck)
    expect(holdClaim).toBeGreaterThan(duplicateCheck)
  })

  it('gates the legacy request action and rejects parent linkage before inserting', () => {
    const action = exportedFunction('src/lib/booking/actions.ts', 'createBookingRequest')
    const staffGate = action.indexOf('await requireStaff()')
    const parentCheck = action.indexOf('validateLegacyParentConsultationLink(')
    const insert = action.indexOf('.insert({')

    expect(staffGate).toBeGreaterThanOrEqual(0)
    expect(parentCheck).toBeGreaterThan(staffGate)
    expect(insert).toBeGreaterThan(parentCheck)
    expect(action).not.toContain('parent_consultation_id')
  })
})

describe('canLinkTreatmentToConsultation', () => {
  const cleared = {
    bookingKind: 'consultation' as const,
    treatmentUnlocked: true,
    consultationTreatmentId: null,
    requestedTreatmentId: 'therapy-a',
  }

  it('accepts a cleared consultation only when access was proved', () => {
    expect(canLinkTreatmentToConsultation({ ...cleared, accessGranted: true })).toBe(true)
  })

  it('rejects reuse by a customer without owner or signed-token access', () => {
    expect(canLinkTreatmentToConsultation({ ...cleared, accessGranted: false })).toBe(false)
  })

  it('rejects an accessible but uncleared or non-consultation appointment', () => {
    expect(canLinkTreatmentToConsultation({ ...cleared, treatmentUnlocked: false, accessGranted: true })).toBe(false)
    expect(canLinkTreatmentToConsultation({ bookingKind: 'treatment', treatmentUnlocked: true, accessGranted: true })).toBe(false)
  })

  it('requires a treatment-specific consultation to match the requested treatment', () => {
    expect(canLinkTreatmentToConsultation({
      ...cleared,
      consultationTreatmentId: 'therapy-a',
      requestedTreatmentId: 'therapy-a',
      accessGranted: true,
    })).toBe(true)
    expect(canLinkTreatmentToConsultation({
      ...cleared,
      consultationTreatmentId: 'therapy-a',
      requestedTreatmentId: 'therapy-b',
      accessGranted: true,
    })).toBe(false)
  })

  it('allows a standalone cleared consultation to select a recommended treatment', () => {
    expect(canLinkTreatmentToConsultation({ ...cleared, accessGranted: true })).toBe(true)
  })
})

describe('hasActiveLinkedTreatment', () => {
  it('blocks active and unexpired linked treatment rows', () => {
    expect(hasActiveLinkedTreatment([{ status: 'confirmed', paymentExpiresAt: null }], nowMs)).toBe(true)
    expect(hasActiveLinkedTreatment([{ status: 'awaiting_payment', paymentExpiresAt: future }], nowMs)).toBe(true)
  })

  it('allows retry after an expired hold or inactive child', () => {
    expect(hasActiveLinkedTreatment([{ status: 'awaiting_payment', paymentExpiresAt: past }], nowMs)).toBe(false)
    expect(hasActiveLinkedTreatment([
      { status: 'cancelled', paymentExpiresAt: null },
      { status: 'completed', paymentExpiresAt: null },
    ], nowMs)).toBe(false)
  })
})

describe('validateLegacyParentConsultationLink', () => {
  it('preserves ordinary unlinked staff-created bookings', () => {
    expect(validateLegacyParentConsultationLink(null)).toEqual({ ok: true })
    expect(validateLegacyParentConsultationLink(undefined)).toEqual({ ok: true })
  })

  it('rejects legacy parent linkage with a stable secured-flow message', () => {
    expect(validateLegacyParentConsultationLink('consultation-a')).toEqual({
      error: 'Linked treatments must be booked through the secured consultation treatment flow.',
    })
  })
})
