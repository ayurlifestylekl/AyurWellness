import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('environment: FAIL')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const checks = [
  ['instant claim RPC', () => sb.rpc('claim_instant_slots', { p_claims: [] })],
  ['atomic reschedule RPC', () => sb.rpc('reschedule_bookings', { p_changes: [], p_actor_type: 'system', p_now: new Date().toISOString() })],
  ['payment confirm RPC', () => sb.rpc('confirm_appointment_payment', { p_bill_id: '__schema_probe__' })],
  ['atomic cancellation RPC', () => sb.rpc('claim_booking_cancellation', { p_appointment_ids: [], p_now: new Date().toISOString(), p_actor_type: 'system' })],
  ['appointment columns', () => sb.from('appointments').select('id,created_at,payment_expires_at,group_id,assigned_therapist_code,treatment_unlocked,group_management_active,group_detached_at,management_reminder_sent_at').limit(1)],
  ['schedule blocks', () => sb.from('schedule_blocks').select('id').limit(1)],
  ['booking management OTPs', () => sb.from('booking_management_otps').select('id').limit(1)],
  ['booking management grants', () => sb.from('booking_management_grants').select('id').limit(1)],
  ['booking events', () => sb.from('booking_events').select('id').limit(1)],
  ['booking refunds', () => sb.from('booking_refunds').select('id').limit(1)],
  ['booking resource members', () => sb.from('booking_resource_members').select('resource_type,resource_key,member_key,active').limit(1)],
]

let failed = false
for (const [name, run] of checks) {
  try {
    const { error } = await run()
    const expectedEmptyClaim = (name === 'instant claim RPC' || name === 'atomic reschedule RPC' || name === 'atomic cancellation RPC')
      && /non-empty json array|appointment_ids must be non-empty/i.test(error?.message ?? '')
    const missingSchema = /could not find|does not exist|schema cache|column .* not found|function .* not found/i.test(error?.message ?? '')
    const ok = !missingSchema && (!error || expectedEmptyClaim || name === 'payment confirm RPC')
    console.log(`${name}: ${ok ? 'PASS' : 'FAIL'}`)
    failed ||= !ok
  } catch {
    console.log(`${name}: FAIL`)
    failed = true
  }
}
process.exitCode = failed ? 1 : 0
