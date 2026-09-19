import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getOperationalTransitionOffer,
  mapOperationalTransitionWriteFailure,
  validateOperationalTransition,
} from '../operations'

// Real behavioral tests for setStatus/moveAppointmentStatus (below) stub the
// Supabase client each function receives, following this codebase's
// established Supabase-mocking pattern (see src/lib/email/__tests__/send.test.ts
// and src/actions/account/__tests__/requestAccountDeletion.test.ts). The spies
// are declared via vi.hoisted() so they're initialized before the (also
// hoisted) vi.mock factories below reference them directly, then each is
// configured per test with .mockResolvedValue(...).
const { mockRequireStaff, mockGetCurrentUser, mockCreateClient } = vi.hoisted(() => ({
  mockRequireStaff: vi.fn(),
  mockGetCurrentUser: vi.fn(),
  mockCreateClient: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@/lib/staff/guard', () => ({ requireStaff: mockRequireStaff }))
vi.mock('@/lib/auth/getCurrentUser', () => ({ getCurrentUser: mockGetCurrentUser }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }))
vi.mock('@/lib/notifications/create', () => ({ createNotification: vi.fn() }))

import { setStatus } from '@/lib/staff/actions'
import { moveAppointmentStatus } from '@/lib/admin/appointments/actions'

describe('validateOperationalTransition', () => {
  it.each(['checked_in', 'in_progress'] as const)('blocks unassigned treatments moving to %s', (to) => {
    expect(validateOperationalTransition({ bookingKind: 'treatment', assignedTherapistCode: null, to })).toEqual({
      error: 'Assign a therapist before checking in or starting this treatment.',
    })
  })

  it.each(['   ', '\t', '\n', ' \t\n '])('treats all-whitespace therapist code %j as unassigned', (assignedTherapistCode) => {
    expect(validateOperationalTransition({
      bookingKind: 'treatment',
      assignedTherapistCode,
      to: 'checked_in',
    })).toEqual({
      error: 'Assign a therapist before checking in or starting this treatment.',
    })
  })

  it('preserves a valid therapist code surrounded by whitespace', () => {
    expect(validateOperationalTransition({
      bookingKind: 'treatment',
      assignedTherapistCode: ' NT02 ',
      to: 'checked_in',
    })).toEqual({ ok: true })
  })

  it('allows an assigned treatment to check in', () => {
    expect(validateOperationalTransition({
      bookingKind: 'treatment',
      assignedTherapistCode: 'NT02',
      to: 'checked_in',
    })).toEqual({ ok: true })
  })

  it('allows a consultation to check in without a therapist', () => {
    expect(validateOperationalTransition({
      bookingKind: 'consultation',
      assignedTherapistCode: null,
      to: 'checked_in',
    })).toEqual({ ok: true })
  })

  it('does not require a therapist for non-operational transitions', () => {
    expect(validateOperationalTransition({
      bookingKind: 'treatment',
      assignedTherapistCode: null,
      to: 'cancelled',
    })).toEqual({ ok: true })
  })
})

describe('getOperationalTransitionOffer', () => {
  it.each(['checked_in', 'in_progress'] as const)('does not offer %s for an unassigned treatment', (to) => {
    expect(getOperationalTransitionOffer({
      bookingKind: 'treatment',
      assignedTherapistCode: null,
      to,
    })).toEqual({ offered: false, message: 'Assign a therapist first' })
  })

  it('offers check-in for an assigned treatment', () => {
    expect(getOperationalTransitionOffer({
      bookingKind: 'treatment',
      assignedTherapistCode: 'NT02',
      to: 'checked_in',
    })).toEqual({ offered: true, message: null })
  })

  it('offers check-in for an unassigned consultation', () => {
    expect(getOperationalTransitionOffer({
      bookingKind: 'consultation',
      assignedTherapistCode: null,
      to: 'checked_in',
    })).toEqual({ offered: true, message: null })
  })
})

describe('mapOperationalTransitionWriteFailure', () => {
  it('maps the database assignment invariant to the stable operational error', () => {
    expect(mapOperationalTransitionWriteFailure({
      error: { code: '23514', message: 'treatment_operational_assignment_required' },
      updated: false,
    })).toBe('Assign a therapist before checking in or starting this treatment.')
  })

  it('maps a zero-row compare-and-set to a stable status conflict', () => {
    expect(mapOperationalTransitionWriteFailure({ error: null, updated: false }))
      .toBe('Appointment status changed. Refresh and try again.')
  })

  it('preserves unrelated database errors and accepts a successful write', () => {
    expect(mapOperationalTransitionWriteFailure({
      error: { code: '42501', message: 'permission denied' },
      updated: false,
    })).toBe('permission denied')
    expect(mapOperationalTransitionWriteFailure({ error: null, updated: true })).toBeNull()
  })
})

/**
 * Minimal chainable Supabase query-builder stubs, shaped to exactly match the
 * call chains `setStatus` / `moveAppointmentStatus` make (verified against
 * their source): a read (`.select().eq()...`) followed — only when the
 * operational guard doesn't block the transition — by a write
 * (`.update().eq()...`). Returning a fresh builder per `.from()` call keeps
 * the two calls independent instead of relying on invocation order.
 */
function makeStaffDb(opts: {
  selectResult: Record<string, unknown> | null
  updateResult?: { data: { id: string } | null; error: { code?: string; message: string } | null }
}) {
  const updateFn = vi.fn()
  let fromCalls = 0
  const from = vi.fn(() => {
    fromCalls += 1
    if (fromCalls === 1) {
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: opts.selectResult, error: null }) }) }) }
    }
    return {
      update: (patch: unknown) => {
        updateFn(patch)
        return {
          eq: () => ({
            eq: () => ({
              select: () => ({ maybeSingle: async () => opts.updateResult ?? { data: { id: 'appt-1' }, error: null } }),
            }),
          }),
        }
      },
    }
  })
  return { from, updateFn }
}

function makeAdminDb(opts: {
  selectResult: Record<string, unknown> | null
  updateResult?: { data: { id: string } | null; error: { code?: string; message: string } | null }
}) {
  const updateFn = vi.fn()
  let fromCalls = 0
  const from = vi.fn(() => {
    fromCalls += 1
    if (fromCalls === 1) {
      return { select: () => ({ eq: () => ({ single: async () => ({ data: opts.selectResult, error: null }) }) }) }
    }
    return {
      update: (patch: unknown) => {
        updateFn(patch)
        return {
          eq: () => ({
            eq: () => ({
              select: () => ({ maybeSingle: async () => opts.updateResult ?? { data: { id: 'appt-1' }, error: null } }),
            }),
          }),
        }
      },
    }
  })
  return { from, updateFn }
}

describe('setStatus operational integration', () => {
  beforeEach(() => {
    mockRequireStaff.mockReset()
  })

  it.each([
    ['checked_in', 'confirmed'],
    ['in_progress', 'checked_in'],
  ] as const)('blocks moving an unassigned treatment to %s and never writes', async (to, fromStatus) => {
    const { from, updateFn } = makeStaffDb({
      selectResult: {
        status: fromStatus,
        booking_kind: 'treatment',
        assigned_therapist_code: null,
        group_id: null,
        payment_bill_id: null,
        payment_status: null,
        payment_provider: null,
      },
    })
    mockRequireStaff.mockResolvedValue({ userId: 'staff-1', role: 'front_desk', db: { from } })

    const res = await setStatus('appt-1', to)

    expect(res).toEqual({ error: 'Assign a therapist before checking in or starting this treatment.' })
    expect(updateFn).not.toHaveBeenCalled()
  })

  it('allows an assigned treatment to check in and writes only the status patch', async () => {
    const { from, updateFn } = makeStaffDb({
      selectResult: {
        status: 'confirmed',
        booking_kind: 'treatment',
        assigned_therapist_code: 'NT02',
        group_id: null,
        payment_bill_id: null,
        payment_status: null,
        payment_provider: null,
      },
      updateResult: { data: { id: 'appt-1' }, error: null },
    })
    mockRequireStaff.mockResolvedValue({ userId: 'staff-1', role: 'front_desk', db: { from } })

    const res = await setStatus('appt-1', 'checked_in')

    expect(res).toEqual({ ok: true })
    expect(updateFn).toHaveBeenCalledTimes(1)
    expect(updateFn.mock.calls[0][0]).toMatchObject({ status: 'checked_in' })
    expect(updateFn.mock.calls[0][0]).not.toHaveProperty('assigned_therapist_code')
  })

  it('allows a consultation to check in without a therapist', async () => {
    const { from, updateFn } = makeStaffDb({
      selectResult: {
        status: 'confirmed',
        booking_kind: 'consultation',
        assigned_therapist_code: null,
        group_id: null,
        payment_bill_id: null,
        payment_status: null,
        payment_provider: null,
      },
      updateResult: { data: { id: 'appt-1' }, error: null },
    })
    mockRequireStaff.mockResolvedValue({ userId: 'staff-1', role: 'front_desk', db: { from } })

    const res = await setStatus('appt-1', 'checked_in')

    expect(res).toEqual({ ok: true })
    expect(updateFn).toHaveBeenCalledTimes(1)
    expect(updateFn.mock.calls[0][0]).not.toHaveProperty('assigned_therapist_code')
  })
})

describe('moveAppointmentStatus operational integration', () => {
  beforeEach(() => {
    mockGetCurrentUser.mockReset()
    mockCreateClient.mockReset()
    mockGetCurrentUser.mockResolvedValue({
      authId: 'admin-1',
      identifier: 'admin@test.com',
      email: 'admin@test.com',
      phone: null,
      profile: {},
      role: 'admin',
    })
  })

  it.each([
    ['checked_in', 'confirmed'],
    ['in_progress', 'checked_in'],
  ] as const)('blocks moving an unassigned treatment to %s and never writes', async (to, fromStatus) => {
    const { from, updateFn } = makeAdminDb({
      selectResult: {
        id: 'appt-1',
        status: fromStatus,
        booking_kind: 'treatment',
        assigned_therapist_code: null,
        customer_id: null,
        treatment_name: 'Abhyanga',
      },
    })
    mockCreateClient.mockResolvedValue({ from })

    const res = await moveAppointmentStatus('appt-1', to)

    expect(res).toEqual({ ok: false, error: 'Assign a therapist before checking in or starting this treatment.' })
    expect(updateFn).not.toHaveBeenCalled()
  })

  it('allows an assigned treatment to check in and writes only the status patch', async () => {
    const { from, updateFn } = makeAdminDb({
      selectResult: {
        id: 'appt-1',
        status: 'confirmed',
        booking_kind: 'treatment',
        assigned_therapist_code: 'NT02',
        customer_id: null,
        treatment_name: 'Abhyanga',
      },
      updateResult: { data: { id: 'appt-1' }, error: null },
    })
    mockCreateClient.mockResolvedValue({ from })

    const res = await moveAppointmentStatus('appt-1', 'checked_in')

    expect(res).toEqual({ ok: true })
    expect(updateFn).toHaveBeenCalledTimes(1)
    expect(updateFn.mock.calls[0][0]).toMatchObject({ status: 'checked_in' })
    expect(updateFn.mock.calls[0][0]).not.toHaveProperty('assigned_therapist_code')
  })

  it('allows a consultation to check in without a therapist', async () => {
    const { from, updateFn } = makeAdminDb({
      selectResult: {
        id: 'appt-1',
        status: 'confirmed',
        booking_kind: 'consultation',
        assigned_therapist_code: null,
        customer_id: null,
        treatment_name: 'Consultation',
      },
      updateResult: { data: { id: 'appt-1' }, error: null },
    })
    mockCreateClient.mockResolvedValue({ from })

    const res = await moveAppointmentStatus('appt-1', 'checked_in')

    expect(res).toEqual({ ok: true })
    expect(updateFn).toHaveBeenCalledTimes(1)
    expect(updateFn.mock.calls[0][0]).not.toHaveProperty('assigned_therapist_code')
  })
})
