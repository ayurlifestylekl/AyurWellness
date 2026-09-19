#!/usr/bin/env node
/**
 * FULL RESET + single real admin account.
 *
 * Wipes ALL business data and ALL auth users, then creates ONE admin account
 * for the client to log into at /admin/login. Customer / sales-agent / affiliate
 * features are not in use yet, so this gives a clean slate with admin-only access.
 *
 * USAGE:
 *   node scripts/reset-and-create-admin.mjs \
 *     --email "admin@keralaayurvedic.com" \
 *     --password "ChosenPassword123!" \
 *     --name "Kerala Ayurvedic Admin" \
 *     --confirm
 *
 * Nothing is deleted unless --confirm is passed.
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local', override: true })

// ---- args ----
const args = process.argv.slice(2)
const getArg = (flag) => {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : undefined
}
const EMAIL = getArg('--email')
const PASSWORD = getArg('--password')
const NAME = getArg('--name') || 'Kerala Ayurvedic Admin'
const CONFIRM = args.includes('--confirm')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey || serviceKey.startsWith('your-')) {
  console.error('❌  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}
if (!EMAIL || !PASSWORD) {
  console.error('❌  --email and --password are required.')
  console.error('    Example: node scripts/reset-and-create-admin.mjs --email "admin@x.com" --password "Pass123!" --confirm')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Business tables, ordered leaf → root so foreign keys never block a delete.
const WIPE_ORDER = [
  'order_events',
  'order_items',
  'refunds',
  'stock_movements',
  'wholesale_order_items',
  'wholesale_orders',
  'marketplace_orders',
  'external_sales',
  'agent_commissions',
  'agent_payouts',
  'agent_invites',
  'sales_agents',
  'orders',
  'customer_promos',
  'promos',
  'reviews',
  'wishlist_items',
  'support_messages',
  'support_tickets',
  'contact_messages',
  'notifications',
  'quiz_results',
  'appointments',
  'addresses',
  'product_bundle_items',
  'bundle_items',
  'products',
]

const ZERO_UUID = '00000000-0000-0000-0000-000000000000'

async function deleteAllRows(table) {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: 'exact' })
    .neq('id', ZERO_UUID)
  if (error) {
    // Table may not exist or lack an `id` column — log and continue.
    console.log(`   ⚠️  ${table}: skipped (${error.message})`)
    return
  }
  console.log(`   ✓  ${table}: removed ${count ?? '?'} row(s)`)
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  FULL RESET — Kerala Ayurvedic')
  console.log(`  Target DB: ${url}`)
  console.log(`  New admin: ${EMAIL}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  if (!CONFIRM) {
    console.log('\n⚠️  DRY RUN — no --confirm flag passed. Nothing was deleted.')
    console.log('   This WOULD delete every row in:')
    console.log('   ' + WIPE_ORDER.join(', '))
    console.log('   …then delete ALL auth users, then create the admin above.')
    console.log('\n   Re-run with --confirm to execute.')
    return
  }

  // 0. Detach admin references that don't cascade (so user deletion can't be blocked).
  console.log('\n[0/3] Detaching admin references…')
  for (const [table, col] of [['site_settings', 'updated_by'], ['reviews', 'approved_by_admin_id']]) {
    const { error } = await supabase.from(table).update({ [col]: null }).neq(col, ZERO_UUID)
    if (error) console.log(`   ⚠️  ${table}.${col}: ${error.message}`)
    else console.log(`   ✓  ${table}.${col} cleared`)
  }

  // 1. Wipe business data.
  console.log('\n[1/3] Wiping business data…')
  for (const table of WIPE_ORDER) {
    await deleteAllRows(table)
  }

  // 2. Delete ALL auth users (cascades to public.users + remaining child rows).
  console.log('\n[2/3] Deleting all auth users…')
  let deleted = 0
  // paginate through all users
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) { console.error('   ❌  listUsers failed:', error.message); break }
    if (!data.users.length) break
    for (const u of data.users) {
      const { error: dErr } = await supabase.auth.admin.deleteUser(u.id)
      if (dErr) console.log(`   ⚠️  ${u.email ?? u.id}: ${dErr.message}`)
      else { deleted++; console.log(`   ✓  deleted ${u.email ?? u.id}`) }
    }
    if (data.users.length < 200) break
  }
  console.log(`   → ${deleted} auth user(s) removed`)

  // 3. Create the single real admin.
  console.log('\n[3/3] Creating admin account…')
  const created = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: NAME },
  })
  if (created.error || !created.data.user) {
    console.error('   ❌  Admin create failed:', created.error?.message)
    process.exit(1)
  }
  const userId = created.data.user.id
  console.log(`   ✓  auth user created: ${userId}`)

  // wait for handle_new_user trigger to insert public.users row
  await new Promise((r) => setTimeout(r, 700))

  const promoted = await supabase
    .from('users')
    .update({ role: 'admin', full_name: NAME, email: EMAIL })
    .eq('id', userId)
    .select('id, role, email')
    .maybeSingle()

  if (promoted.error || !promoted.data) {
    console.error('   ❌  Role promotion failed:', promoted.error?.message)
    console.error('   Run this SQL in Supabase to fix:')
    console.error(`   INSERT INTO public.users (id, email, full_name, role) VALUES ('${userId}', '${EMAIL}', '${NAME}', 'admin') ON CONFLICT (id) DO UPDATE SET role='admin';`)
    process.exit(1)
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅  DONE. Clean slate + one admin account ready.')
  console.log('\n   Sign in at /admin/login')
  console.log(`   Email:    ${EMAIL}`)
  console.log(`   Password: ${PASSWORD}`)
  console.log(`   Role:     ${promoted.data.role}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main().catch((e) => {
  console.error('\n❌  Reset failed:', e.message)
  process.exit(1)
})
