import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { groupBillTotals } from '../group-management'

const paymentSource = readFileSync(resolve(process.cwd(), 'src/lib/booking/payment.ts'), 'utf8')
const cancellationMigration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260718c_atomic_booking_cancellation.sql'),
  'utf8',
)

describe('group bill totals', () => {
  it('sums amount and count from active members only, excluding detached rows', () => {
    const members = [
      { payable_amount_rm: 180, group_management_active: true },
      { payable_amount_rm: 220, group_management_active: true },
      { payable_amount_rm: 150, group_management_active: false },
    ]
    expect(groupBillTotals(members)).toEqual({ count: 2, amountRm: 400 })
  })

  it('treats a missing management flag as active for legacy rows', () => {
    expect(groupBillTotals([{ payable_amount_rm: 90 }, { payable_amount_rm: 60 }]))
      .toEqual({ count: 2, amountRm: 150 })
  })
})

describe('startPaymentForAppointment group scoping', () => {
  it('restricts the group member lookup to active management rows', () => {
    expect(paymentSource).toMatch(/\.eq\('group_id', groupId\)[\s\S]*\.eq\('group_management_active', true\)/)
  })

  it('restricts the bill-association update to active management rows', () => {
    const associate = paymentSource.slice(paymentSource.indexOf('associate: async'))
    expect(associate).toContain(".eq('group_management_active', true)")
  })

  it('derives group amount and count from the active-member helper', () => {
    expect(paymentSource).toContain('groupBillTotals')
  })
})

describe('confirm_appointment_payment active-group scoping', () => {
  it('replaces the RPC and scopes every group query to active management members', () => {
    expect(cancellationMigration).toContain('create or replace function public.confirm_appointment_payment')
    const confirm = cancellationMigration.slice(
      cancellationMigration.indexOf('create or replace function public.confirm_appointment_payment'),
    )
    // "lock every member", "already_confirmed", "mixed status", and the final
    // atomic UPDATE must all ignore detached historical members.
    const scoped = confirm.match(/group_id\s*=\s*v_lead\.group_id\s+and\s+group_management_active\s*=\s*true/gi) ?? []
    expect(scoped.length).toBeGreaterThanOrEqual(4)
  })

  it('keeps the final confirmation update from touching detached members', () => {
    const confirm = cancellationMigration.slice(
      cancellationMigration.indexOf('create or replace function public.confirm_appointment_payment'),
    )
    const finalUpdate = confirm.slice(confirm.lastIndexOf('update public.appointments'))
    expect(finalUpdate).toMatch(/group_management_active\s*=\s*true/i)
  })
})
