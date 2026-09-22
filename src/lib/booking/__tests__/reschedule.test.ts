import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn() }),
}))
vi.mock('@/components/booking/SlotPicker', () => ({ default: () => null }))
vi.mock('@/lib/staff/therapists', () => ({
  therapistsForGender: () => Promise.resolve([{ code: 't1', name: 'Therapist', gender: 'male', active: true }]),
  therapistByCode: () => Promise.resolve(undefined),
  getAllTherapists: () => Promise.resolve([]),
  getAllVaidyas: () => Promise.resolve([]),
  vaidyaByCode: () => Promise.resolve(undefined),
  vaidyaName: () => Promise.resolve(''),
  VAIDYA_BLOCK_CODE: 'VAIDYA',
  therapistLabel: (t: { name: string }) => t.name,
  vaidyaLabel: (v: { name: string }) => v.name,
}))

import {
  buildRescheduleClaim,
  prepareReschedule,
  rescheduleBooking,
  validateRescheduleScope,
} from '../reschedule'
import { runRescheduleAction } from '@/components/booking/RescheduleBookingForm'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260718b_atomic_booking_reschedule.sql',
)
const ANCHOR_ID = '11111111-1111-4111-8111-111111111111'
const TARGET_ID = '22222222-2222-4222-8222-222222222222'
const NOW_MS = Date.parse('2026-07-19T09:30:00+08:00')
const NEW_START = '2026-07-23T09:30:00+08:00'

type QueryResult = { data: unknown; error: unknown }

function chain(result: QueryResult) {
  const query: Record<string, unknown> = {}
  for (const method of ['select', 'in', 'eq', 'lte', 'gte', 'lt', 'not']) {
    query[method] = vi.fn(() => query)
  }
  query.then = (resolveResult: (value: QueryResult) => unknown) => Promise.resolve(result).then(resolveResult)
  return query
}

function treatmentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ANCHOR_ID,
    customer_id: null,
    created_at: '2026-07-18T09:30:00+08:00',
    appointment_date_time: '2026-07-22T09:30:00+08:00',
    status: 'confirmed',
    payment_status: 'paid',
    payment_expires_at: null,
    booking_kind: 'treatment',
    treatment_id: '33333333-3333-4333-8333-333333333333',
    duration_mins: 60,
    patient_gender: 'male',
    patient_name: 'Arun',
    gender_requirement: 'men_only',
    group_id: null,
    group_management_active: true,
    ...overrides,
  }
}

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    anchorId: ANCHOR_ID,
    appointmentIds: [ANCHOR_ID],
    token: null,
    selections: { [ANCHOR_ID]: NEW_START },
    wholeGroup: false,
    ...overrides,
  }
}

function actionDb(
  rowOrRows: ReturnType<typeof treatmentRow> | ReturnType<typeof treatmentRow>[] = treatmentRow(),
  rpcError: unknown = null,
  groupRows?: { id: string }[],
) {
  const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows]
  let appointmentQueries = 0
  const rpc = vi.fn().mockResolvedValue({ data: null, error: rpcError })
  const from = vi.fn((table: string) => {
    if (table === 'schedule_blocks') return chain({ data: [], error: null })
    if (table === 'appointments') {
      appointmentQueries += 1
      if (appointmentQueries === 1) return chain({ data: rows, error: null })
      if (appointmentQueries === 2 && groupRows) return chain({ data: groupRows, error: null })
      return chain({ data: [], error: null })
    }
    throw new Error(`unexpected table: ${table}`)
  })
  return { client: { from, rpc }, rpc }
}

beforeEach(() => {
  vi.restoreAllMocks()
  mocks.createClient.mockReset()
  mocks.canManageBookingTarget.mockReset()
})

describe('reschedule validation', () => {
  it('keeps a treatment appointment persisted duration and resource semantics', () => {
    expect(buildRescheduleClaim({
      bookingKind: 'treatment',
      requestedDurationMins: 90,
      genderRequirement: 'ladies_only',
    })).toMatchObject({
      durationMins: 90,
      resourceType: 'gender',
      resourceKey: 'ladies_only',
    })
  })

  it('canonicalizes consultation moves to 30 minutes', () => {
    expect(buildRescheduleClaim({ bookingKind: 'consultation', requestedDurationMins: 90 }))
      .toMatchObject({ durationMins: 30, resourceType: 'consultation', resourceKey: 'vaidya' })
  })

  it('rejects a move inside the 24-hour cutoff before calling the RPC', async () => {
    const result = await prepareReschedule({
      appointmentAt: '2026-07-20T09:30:00+08:00',
      newStart: '2026-07-21T09:30:00+08:00',
      nowMs: Date.parse('2026-07-19T10:00:00+08:00'),
    })
    expect(result).toEqual({ error: 'The online rescheduling window has closed.' })
  })

  it('allows the exact 24-hour cutoff and rejects a new start at server time', async () => {
    const nowMs = Date.parse('2026-07-19T09:30:00+08:00')
    await expect(prepareReschedule({
      appointmentAt: '2026-07-20T09:30:00+08:00',
      newStart: '2026-07-21T09:30:00+08:00',
      nowMs,
    })).resolves.toEqual({ ok: true, newStart: '2026-07-21T01:30:00.000Z' })
    await expect(prepareReschedule({
      appointmentAt: '2026-07-20T09:30:00+08:00',
      newStart: new Date(nowMs).toISOString(),
      nowMs,
    })).resolves.toEqual({ error: 'Please choose a future appointment time.' })
  })

  it('requires an individual move to contain the anchor and no other target', () => {
    expect(validateRescheduleScope({
      anchorId: ANCHOR_ID,
      appointmentIds: [ANCHOR_ID],
      wholeGroup: false,
    })).toEqual({ ok: true, appointmentIds: [ANCHOR_ID] })
    expect(validateRescheduleScope({
      anchorId: ANCHOR_ID,
      appointmentIds: [ANCHOR_ID, TARGET_ID],
      wholeGroup: false,
    })).toEqual({ error: 'Choose either this appointment or the whole active group.' })
  })

  it('rejects duplicate target IDs instead of silently deduplicating them', () => {
    expect(validateRescheduleScope({
      anchorId: ANCHOR_ID,
      appointmentIds: [ANCHOR_ID, ANCHOR_ID],
      wholeGroup: true,
    })).toEqual({ error: 'Duplicate appointments cannot be rescheduled.' })
  })
})

describe('reschedule action', () => {
  it.each([
    ['malformed ID', validInput({ anchorId: 'not-a-uuid' })],
    ['duplicate IDs', validInput({ appointmentIds: [ANCHOR_ID, ANCHOR_ID] })],
    ['individual extra target', validInput({
      appointmentIds: [ANCHOR_ID, TARGET_ID],
      selections: { [ANCHOR_ID]: NEW_START, [TARGET_ID]: NEW_START },
    })],
    ['non-string token', validInput({ token: { forged: true } })],
    ['malformed selections', validInput({ selections: 'not-an-object' })],
  ])('rejects %s before token authorization', async (_label, input) => {
    const result = await rescheduleBooking(input as never)
    expect(result).toMatchObject({ code: 'INVALID_INPUT' })
    expect(mocks.canManageBookingTarget).not.toHaveBeenCalled()
    expect(mocks.createClient).not.toHaveBeenCalled()
  })

  it('returns UNAUTHORIZED and never creates an RPC client when anchor access fails', async () => {
    mocks.canManageBookingTarget.mockResolvedValue(false)
    const result = await rescheduleBooking(validInput())
    expect(result).toMatchObject({ code: 'UNAUTHORIZED' })
    expect(mocks.canManageBookingTarget).toHaveBeenCalledWith(ANCHOR_ID, ANCHOR_ID, null)
    expect(mocks.createClient).not.toHaveBeenCalled()
  })

  it('authorizes every target and stops before the RPC when one group member fails', async () => {
    mocks.canManageBookingTarget
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
    const rows = [
      treatmentRow({ group_id: '44444444-4444-4444-8444-444444444444' }),
      treatmentRow({ id: TARGET_ID, group_id: '44444444-4444-4444-8444-444444444444' }),
    ]
    const db = actionDb(rows)
    mocks.createClient.mockReturnValue(db.client)
    const result = await rescheduleBooking(validInput({
      appointmentIds: [ANCHOR_ID, TARGET_ID],
      selections: { [ANCHOR_ID]: NEW_START, [TARGET_ID]: NEW_START },
      wholeGroup: true,
    }))
    expect(result).toMatchObject({ code: 'UNAUTHORIZED' })
    expect(mocks.canManageBookingTarget).toHaveBeenLastCalledWith(ANCHOR_ID, TARGET_ID, null)
    expect(db.rpc).not.toHaveBeenCalled()
  })

  it('requires whole-group scope to equal the active database membership', async () => {
    mocks.canManageBookingTarget.mockResolvedValue(true)
    const groupId = '44444444-4444-4444-8444-444444444444'
    const rows = [
      treatmentRow({ group_id: groupId }),
      treatmentRow({ id: TARGET_ID, group_id: groupId }),
    ]
    const db = actionDb(rows, null, [{ id: ANCHOR_ID }])
    mocks.createClient.mockReturnValue(db.client)
    const result = await rescheduleBooking(validInput({
      appointmentIds: [ANCHOR_ID, TARGET_ID],
      selections: { [ANCHOR_ID]: NEW_START, [TARGET_ID]: NEW_START },
      wholeGroup: true,
    }))
    expect(result).toEqual({
      code: 'INVALID_INPUT',
      error: 'Select every active group member to move the whole group.',
    })
    expect(db.rpc).not.toHaveBeenCalled()
  })

  it('does not call the RPC when server policy preflight closes the move', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW_MS)
    mocks.canManageBookingTarget.mockResolvedValue(true)
    const db = actionDb(treatmentRow({ appointment_date_time: '2026-07-20T08:30:00+08:00' }))
    mocks.createClient.mockReturnValue(db.client)
    const result = await rescheduleBooking(validInput())
    expect(result).toEqual({ code: 'POLICY_CLOSED', error: 'The online rescheduling window has closed.' })
    expect(db.rpc).not.toHaveBeenCalled()
  })

  it.each([
    ['SLOT_FULL: no room', 'SLOT_FULL'],
    ['POLICY_CLOSED: cutoff elapsed', 'POLICY_CLOSED'],
    ['INVALID_INPUT: stale old_start', 'INVALID_INPUT'],
    ['unexpected database failure', 'PROVIDER_ERROR'],
  ] as const)('maps RPC error %s to stable %s', async (message, code) => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW_MS)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocks.canManageBookingTarget.mockResolvedValue(true)
    const db = actionDb(treatmentRow(), { message, code: 'P0001' })
    mocks.createClient.mockReturnValue(db.client)
    const result = await rescheduleBooking(validInput())
    expect(result).toMatchObject({ code })
    expect(db.rpc).toHaveBeenCalledTimes(1)
  })
})

describe('reschedule form action boundary', () => {
  it('maps a rejected action promise to a stable provider failure', async () => {
    const action = vi.fn().mockRejectedValue(new Error('network down'))
    await expect(runRescheduleAction(action, validInput())).resolves.toEqual({
      code: 'PROVIDER_ERROR',
      error: 'We could not reschedule the booking right now. No changes were made.',
    })
  })
})

describe('atomic reschedule migration', () => {
  it('validates before clearing assignment and preserves confirmed/payment state', () => {
    const sql = readFileSync(migrationPath, 'utf8')
    const firstUpdate = sql.indexOf('update public.appointments')
    expect(sql.indexOf("raise exception 'SLOT_FULL'")).toBeLessThan(firstUpdate)
    expect(sql.indexOf("raise exception 'SLOT_FULL'")).toBeLessThan(
      sql.indexOf('assigned_therapist_code = null'),
    )
    expect(sql).toContain("status = 'confirmed'")
    expect(sql).not.toMatch(/payment_status\s*=/)
    expect(sql).toContain('pg_advisory_xact_lock')
  })

  it('locks and validates the whole batch before updating any appointment', () => {
    const sql = readFileSync(migrationPath, 'utf8')
    const firstUpdate = sql.indexOf('update public.appointments')
    expect(sql).toMatch(/order by a\.id[\s\S]*for update/)
    expect(sql.indexOf("interval '24 hours'")).toBeLessThan(firstUpdate)
    expect(sql.indexOf('v_new_start <= v_now')).toBeLessThan(firstUpdate)
    expect(sql.indexOf('old_start')).toBeLessThan(firstUpdate)
  })

  it('derives canonical capacity from the private database roster', () => {
    const sql = readFileSync(migrationPath, 'utf8')
    expect(sql).toContain('create table if not exists public.booking_resource_members')
    for (const member of ['NT02', 'DP03', 'BN08', 'SM05', 'CR08', 'AS12', 'VAIDYA']) {
      expect(sql).toContain(`'${member}'`)
    }
    expect(sql).toContain('from public.booking_resource_members rm')
    expect(sql).toContain('rm.active = true')
    expect(sql).not.toContain("v_capacity := (v_change->>'capacity')::integer")
    expect(sql).toContain('revoke all on public.booking_resource_members from anon, authenticated')
  })

  it('keeps every canonical member in exactly one capacity bucket', () => {
    const sql = readFileSync(migrationPath, 'utf8')
    expect(sql).toMatch(/unique\s*\(\s*member_key\s*\)/i)
  })

  it('serializes schedule-block writers before taking database time and recounting', () => {
    const sql = readFileSync(migrationPath, 'utf8')
    const advisoryLock = sql.lastIndexOf('pg_advisory_xact_lock')
    const blockLock = sql.indexOf('lock table public.schedule_blocks')
    const rosterLock = sql.indexOf('lock table public.booking_resource_members')
    const clock = sql.indexOf('v_now := clock_timestamp()')
    const cutoff = sql.indexOf("interval '24 hours'", clock)
    const occupancy = sql.indexOf('a.payment_expires_at > v_now')
    expect(advisoryLock).toBeLessThan(blockLock)
    expect(blockLock).toBeLessThan(rosterLock)
    expect(rosterLock).toBeLessThan(clock)
    expect(clock).toBeLessThan(cutoff)
    expect(clock).toBeLessThan(occupancy)
  })

  it('evaluates centre/member blocks with none, weekly, monthly, all-day and timed semantics', () => {
    const sql = readFileSync(migrationPath, 'utf8')
    expect(sql).toContain("b.recurrence = 'none'")
    expect(sql).toContain("b.recurrence = 'weekly'")
    expect(sql).toContain("b.recurrence = 'monthly'")
    expect(sql).toContain('b.all_day')
    expect(sql).toContain('b.therapist_code is null')
    expect(sql).toContain("at time zone 'Asia/Kuala_Lumpur'")
  })

  it('constructs recurring timed block instants with PostgreSQL date-plus-time operators', () => {
    const sql = readFileSync(migrationPath, 'utf8')
    expect(sql).not.toMatch(/v_candidate_day::timestamp\s*\+/i)
    expect(sql.match(/v_candidate_day\s*\+\s*\(b\.(?:start|end)_at at time zone 'Asia\/Kuala_Lumpur'\)::time/gi)).toHaveLength(2)
  })

  it('uses only post-lock database time inside the function body', () => {
    const sql = readFileSync(migrationPath, 'utf8')
    const body = sql.slice(sql.indexOf('as $$'))
    expect(body).not.toMatch(/\bp_now\b/)
    expect(body).toContain('updated_at = v_now')
    expect(body).toContain('group_detached_at = v_now')
  })

  it('orders resource locks and excludes all moving rows from persisted occupancy', () => {
    const sql = readFileSync(migrationPath, 'utf8')
    expect(sql).toMatch(/array_agg\(distinct key order by key\)/i)
    expect(sql).toContain('pg_advisory_xact_lock(hashtextextended(v_resource_key, 0))')
    expect(sql).not.toContain("hashtextextended('booking-reschedule|'")
    expect(sql).toMatch(/not\s*\(a\.id\s*=\s*any\s*\(v_appointment_ids\)\)/i)
    expect(sql).toContain('public.appt_occupied_range')
    expect(sql).toContain("interval '30 minutes'")
    expect(sql).toContain('v_batch_count')
  })

  it('detaches only requested members and writes audit events transactionally', () => {
    const sql = readFileSync(migrationPath, 'utf8')
    expect(sql).toContain("'rescheduled'")
    expect(sql).toContain("'group_detached'")
    expect(sql).toContain('group_management_active = false')
    expect(sql).toContain('group_detached_at = v_now')
    expect(sql).toMatch(/if v_detach_from_group then[\s\S]*group_management_active = false/i)
  })

  it('exposes the fixed-search-path RPC to service role only', () => {
    const sql = readFileSync(migrationPath, 'utf8')
    expect(sql).toMatch(/security definer[\s\S]*set search_path = public, pg_temp/i)
    expect(sql).toContain('revoke all on function public.reschedule_bookings(jsonb, text, timestamptz) from public, anon, authenticated')
    expect(sql).toContain('grant execute on function public.reschedule_bookings(jsonb, text, timestamptz) to service_role')
  })
})
