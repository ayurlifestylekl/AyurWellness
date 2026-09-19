#!/usr/bin/env node
/**
 * Creates a demo admin user for testing the admin portal.
 *
 * Run:  node scripts/create-demo-admin.mjs
 *
 * Deletes:
 *   In Supabase Studio → SQL Editor:
 *     DELETE FROM auth.users WHERE email = 'demo-admin@kerala-ayurvedic.dev';
 *   (cascades to public.users)
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import 'dotenv/config'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load .env.local explicitly (dotenv defaults to .env)
config({ path: '.env.local', override: true })

const DEMO_EMAIL = 'demo-admin@kerala-ayurvedic.dev'
const DEMO_PASSWORD = 'Demo1234!'
const DEMO_NAME = 'Demo Admin'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey || serviceKey.startsWith('your-')) {
  console.error('❌  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// 1. Check if the demo user already exists.
const existing = await supabase
  .from('users')
  .select('id, role')
  .eq('email', DEMO_EMAIL)
  .maybeSingle()

let userId
if (existing.data) {
  userId = existing.data.id
  console.log(`ℹ️   Demo user already exists (${userId}). Updating role to admin…`)
} else {
  // 2. Create the auth user — confirmed so they can sign in immediately.
  const created = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: DEMO_NAME },
  })
  if (created.error || !created.data.user) {
    console.error('❌  Auth user create failed:', created.error?.message)
    process.exit(1)
  }
  userId = created.data.user.id
  console.log(`✅  Auth user created: ${userId}`)
}

// 3. Promote to admin (public.users row is auto-created by the handle_new_user trigger).
//    Wait a beat to make sure the trigger has fired before updating.
await new Promise((r) => setTimeout(r, 500))

const updated = await supabase
  .from('users')
  .update({ role: 'admin', full_name: DEMO_NAME, email: DEMO_EMAIL })
  .eq('id', userId)
  .select('id, role, email')
  .maybeSingle()

if (updated.error || !updated.data) {
  console.error('❌  Role promotion failed:', updated.error?.message)
  console.error('    The public.users row may not have been created by the trigger yet.')
  console.error('    Try running this script again, or insert manually:')
  console.error(`    INSERT INTO public.users (id, email, full_name, role) VALUES ('${userId}', '${DEMO_EMAIL}', '${DEMO_NAME}', 'admin');`)
  process.exit(1)
}

console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅  Demo admin ready. Sign in at /admin/login:')
console.log('')
console.log(`    Email:    ${DEMO_EMAIL}`)
console.log(`    Password: ${DEMO_PASSWORD}`)
console.log('')
console.log('To delete later, in Supabase Studio → SQL Editor:')
console.log(`    DELETE FROM auth.users WHERE email = '${DEMO_EMAIL}';`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
