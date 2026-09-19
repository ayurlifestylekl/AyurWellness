import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260717_atomic_payment_confirmation.sql'), 'utf8')
const expirySource = readFileSync(resolve(process.cwd(), 'src/lib/booking/expiry.ts'), 'utf8')

describe('atomic payment migration contract', () => {
  it('locks and checks the whole group before returning already-confirmed', () => {
    expect(migration).toMatch(
      /IF v_lead\.group_id IS NOT NULL THEN[\s\S]*PERFORM 1[\s\S]*FOR UPDATE;[\s\S]*IF NOT EXISTS \([\s\S]*status <> 'confirmed'/,
    )
  })

  it('routes mixed historical group states to the terminal problem claim', () => {
    expect(migration).toContain('COUNT(DISTINCT status)')
    expect(migration).toContain("v_problem_status := 'mixed_group'")
  })

  it('identifies expiry only from the exact stored expiry cancellation reason', () => {
    const reason = expirySource.match(/const EXPIRED_REASON = '([^']+)'/)?.[1]
    expect(reason).toBeTruthy()
    expect(migration).toContain(`v_problem.cancellation_reason = '${reason}'`)
    expect(migration).not.toContain('v_problem.payment_expires_at <= now()')
  })
})
