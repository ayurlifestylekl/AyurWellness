import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// Load env from .env.local
const env = readFileSync(
  '/Users/sanjaygunabalan2626gmail.com/Documents/Ayurvedic /Ayurvedic /ayurvedic/.env.local',
  'utf8',
)
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const PASSWORD = 'Demo!Pass#2026'
const ACCOUNTS = [
  { email: 'demo-admin@kerala-ayurvedic.dev',    fullName: 'Demo Admin',    role: 'admin' },
  { email: 'demo-customer@kerala-ayurvedic.dev', fullName: 'Demo Customer', role: 'customer' },
  { email: 'demo-agent@kerala-ayurvedic.dev',    fullName: 'Demo Agent',    role: 'sales_agent' },
]

for (const a of ACCOUNTS) {
  console.log(`\n--- ${a.email} ---`)
  // Create via Admin API
  const { data: created, error: cErr } = await sb.auth.admin.createUser({
    email: a.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: a.fullName },
  })
  if (cErr) {
    if (cErr.message.includes('already')) {
      console.log(`  user exists, fetching...`)
      const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const found = list.users.find((u) => u.email === a.email)
      if (!found) { console.log(`  ERR: not found after exists error`); continue }
      created.user = found
    } else {
      console.log(`  ERR: ${cErr.message}`)
      continue
    }
  }
  const uid = created?.user?.id
  if (!uid) { console.log('  ERR: no uid'); continue }
  console.log(`  auth.users.id = ${uid}`)

  // Upsert public.users with correct role
  const { error: uErr } = await sb.from('users').upsert(
    { id: uid, email: a.email, full_name: a.fullName, role: a.role },
    { onConflict: 'id' },
  )
  if (uErr) { console.log(`  users upsert err: ${uErr.message}`); continue }
  console.log(`  public.users role=${a.role}`)

  // If agent, create sales_agents row
  if (a.role === 'sales_agent') {
    const { error: sErr } = await sb.from('sales_agents').upsert(
      {
        user_id: uid,
        referral_code: 'DEMO2026',
        commission_rate: 10.00,
        commission_type: 'affiliate',
        can_affiliate: true,
        can_wholesale: true,
        status: 'active',
      },
      { onConflict: 'referral_code' },
    )
    if (sErr) console.log(`  sales_agents err: ${sErr.message}`)
    else console.log(`  sales_agents code=DEMO2026 (hybrid)`)
  }
}

console.log('\n=== Verify ===')
const { data: rows } = await sb
  .from('users')
  .select('email, role')
  .like('email', 'demo-%@kerala-ayurvedic.dev')
console.table(rows)
console.log(`\nPassword for all: ${PASSWORD}`)
