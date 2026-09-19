import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  canManageBookingTarget: vi.fn(),
  createClient: vi.fn(),
  notifyManagedReschedule: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }))
vi.mock('../management-access', () => ({
  canManageBookingTarget: mocks.canManageBookingTarget,
}))
vi.mock('../notify', () => ({
  notifyManagedReschedule: mocks.notifyManagedReschedule,
  BOOKING_SITE_URL: 'https://example.test',
}))
vi.mock('../token', () => ({
  createBookingToken: (id: string) => `token-${id}`,
}))

import {
  activeManagementMembers,
  buildGroupRescheduleChanges,
} from '../group-management'
import { rescheduleBooking, validateRescheduleScope } from '../reschedule'

const slotA = '2026-07-25T11:30:00+08:00'
const slotB = '2026-07-25T14:30:00+08:00'

const rows = [
  { id: 'guestA', group_management_active: true },
  { id: 'guestB', group_management_active: true },
]

const anchorId = '11111111-1111-4111-8111-111111111111'
const targetId = '22222222-2222-4222-8222-222222222222'

function chain(result: { data: unknown; error: unknown }) {
  const query: Record<string, unknown> = {}
  for (const method of ['select', 'in', 'eq', 'lte']) query[method] = vi.fn(() => query)
  query.then = (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  return query
}

beforeEach(() => {
  mocks.canManageBookingTarget.mockReset()
  mocks.createClient.mockReset()
  mocks.notifyManagedReschedule.mockReset().mockResolvedValue(undefined)
})

afterEach(() => vi.restoreAllMocks())

describe('group management orchestration', () => {
  it('allows one sibling target while rejecting an individual subset', () => {
    expect(validateRescheduleScope({
      anchorId: 'organizer',
      appointmentIds: ['guestA'],
      wholeGroup: false,
    })).toEqual({ ok: true, appointmentIds: ['guestA'] })
    expect(validateRescheduleScope({
      anchorId: 'organizer',
      appointmentIds: ['guestA', 'guestB'],
      wholeGroup: false,
    })).toEqual({ error: 'Choose either this appointment or the whole active group.' })
  })

  it('uses the organizer anchor to authorize one sibling move', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-07-19T09:00:00+08:00'))
    mocks.canManageBookingTarget.mockResolvedValue(true)
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null })
    let appointmentReads = 0
    mocks.createClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'schedule_blocks') return chain({ data: [], error: null })
        if (table === 'appointments') {
          appointmentReads += 1
          return appointmentReads === 1
            ? chain({
              data: [{
                id: targetId,
                customer_id: null,
                created_at: '2026-07-18T09:00:00+08:00',
                appointment_date_time: '2026-07-22T10:00:00+08:00',
                status: 'confirmed',
                payment_status: 'paid',
                payment_expires_at: null,
                booking_kind: 'treatment',
                treatment_id: '33333333-3333-4333-8333-333333333333',
                duration_mins: 60,
                patient_gender: 'male',
                patient_name: 'Sibling guest',
                gender_requirement: 'men_only',
                group_id: '44444444-4444-4444-8444-444444444444',
                group_management_active: true,
              }],
              error: null,
            })
            : chain({ data: [], error: null })
        }
        throw new Error(`unexpected table: ${table}`)
      }),
      rpc,
    })

    await expect(rescheduleBooking({
      anchorId,
      appointmentIds: [targetId],
      token: 'legacy-anchor-token',
      selections: { [targetId]: slotA },
      wholeGroup: false,
    })).resolves.toEqual({ ok: true, data: { appointmentIds: [targetId] } })

    expect(mocks.canManageBookingTarget).toHaveBeenNthCalledWith(
      1,
      anchorId,
      anchorId,
      'legacy-anchor-token',
    )
    expect(mocks.canManageBookingTarget).toHaveBeenNthCalledWith(
      2,
      anchorId,
      targetId,
      'legacy-anchor-token',
    )
    expect(rpc).toHaveBeenCalledWith('reschedule_bookings', expect.objectContaining({
      p_changes: [expect.objectContaining({
        appointment_id: targetId,
        detach_from_group: true,
      })],
    }))
  })

  it('detaches one moved member without changing the others', () => {
    const changes = buildGroupRescheduleChanges(rows, { guestA: slotA })

    expect(changes).toEqual([
      expect.objectContaining({ appointmentId: 'guestA', detachFromGroup: true }),
    ])
    expect(changes.some((change) => change.appointmentId === 'guestB')).toBe(false)
  })

  it('moves the entire active group atomically', () => {
    const changes = buildGroupRescheduleChanges(
      rows,
      { guestA: slotA, guestB: slotB },
      { wholeGroup: true },
    )

    expect(changes).toHaveLength(2)
    expect(changes.every((change) => change.detachFromGroup === false)).toBe(true)
  })

  it('excludes previously detached rows from whole-group operations', () => {
    expect(activeManagementMembers([
      { id: 'a', group_management_active: false },
      { id: 'b', group_management_active: true },
    ]).map((row) => row.id)).toEqual(['b'])
  })
})
