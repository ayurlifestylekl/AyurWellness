import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const path = resolve(process.cwd(), 'supabase/migrations/20260717_linked_treatment_guard.sql')
const migration = existsSync(path) ? readFileSync(path, 'utf8') : ''

describe('linked treatment concurrency guard migration', () => {
  it('serializes inserts by parent consultation and rejects a second active child', () => {
    expect(migration).toContain('pg_advisory_xact_lock')
    expect(migration).toContain('ACTIVE_LINKED_TREATMENT_EXISTS')
    expect(migration).toMatch(/BEFORE INSERT OR UPDATE[\s\S]*ON public\.appointments/)
  })

  it('allows an expired or cancelled child to be retried', () => {
    expect(migration).toContain("status <> 'awaiting_payment'")
    expect(migration).toContain('payment_expires_at > now()')
    expect(migration).not.toMatch(/status IN \([^)]*'cancelled'/)
  })
})
