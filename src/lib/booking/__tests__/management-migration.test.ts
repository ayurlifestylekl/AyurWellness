import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260718_self_service_booking_management.sql'), 'utf8')

describe('self-service booking management migration', () => {
  it('creates private recovery, grant, audit, and refund records', () => {
    for (const table of ['booking_management_otps', 'booking_management_grants', 'booking_events', 'booking_refunds']) {
      expect(sql).toContain(`create table if not exists public.${table}`)
    }
    expect(sql).toContain('revoke all on public.booking_management_otps from anon, authenticated')
    expect(sql).toContain('unique (idempotency_key)')
  })

  it('supports safe group detachment', () => {
    expect(sql).toContain('group_management_active boolean not null default true')
  })

  it('atomically reserves rate-limited OTP sends under email and IP advisory locks', () => {
    expect(sql).toContain('create or replace function public.reserve_booking_management_otp')
    expect(sql.match(/pg_advisory_xact_lock/g)?.length).toBeGreaterThanOrEqual(3)
    expect(sql).toContain("interval '60 seconds'")
    expect(sql).toContain("interval '1 hour'")
    expect(sql).toMatch(/count\(\*\)[\s\S]*>= 5/)
    expect(sql).toMatch(/count\(\*\)[\s\S]*>= 20/)
    expect(sql).toContain('on public.booking_management_otps(request_ip_hash, created_at desc)')
  })

  it('captures reservation time only after acquiring both advisory locks', () => {
    const reserve = sql.slice(
      sql.indexOf('create or replace function public.reserve_booking_management_otp'),
      sql.indexOf('create or replace function public.verify_booking_management_otp'),
    )
    expect(reserve.indexOf('v_now := clock_timestamp()')).toBeGreaterThan(
      reserve.lastIndexOf('pg_advisory_xact_lock'),
    )
  })

  it('locks and consumes only the latest OTP while issuing grants and events transactionally', () => {
    expect(sql).toContain('create or replace function public.verify_booking_management_otp')
    expect(sql).toMatch(/order by created_at desc, id desc[\s\S]*limit 1[\s\S]*for update/)
    expect(sql).toContain('attempts = least(6, attempts + 1)')
    expect(sql).toContain('consumed_at = v_now')
    expect(sql).toContain('update public.booking_management_grants')
    expect(sql).toContain('insert into public.booking_management_grants')
    expect(sql).toContain("'management_link_recovered'")
    expect(sql).toContain('lower(btrim(patient_email)) = p_normalized_email')
    expect(sql).toContain('customer_id is null')
    expect(sql).toContain('is_guest = true')
  })

  it('captures verification time only after the latest OTP row is locked', () => {
    const verify = sql.slice(sql.indexOf('create or replace function public.verify_booking_management_otp'))
    expect(verify.indexOf('v_now := clock_timestamp()')).toBeGreaterThan(verify.indexOf('for update'))
  })

  it('exposes both recovery RPCs only to the service role with fixed search paths', () => {
    for (const fn of ['reserve_booking_management_otp', 'verify_booking_management_otp']) {
      expect(sql).toMatch(new RegExp(`function public\\.${fn}[\\s\\S]*security definer[\\s\\S]*set search_path = public, pg_temp`))
      expect(sql).toContain(`revoke all on function public.${fn}`)
      expect(sql).toContain(`grant execute on function public.${fn}`)
    }
    expect(sql).toContain('from public, anon, authenticated')
    expect(sql).toContain('to service_role')
  })
})
