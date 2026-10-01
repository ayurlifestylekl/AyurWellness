#!/usr/bin/env node
/**
 * Create the clinic's real staff accounts (admin, front desk, Vaidya, product
 * manager) and give each person a one-time "set your password" link.
 *
 * ADDITIVE ONLY: it never deletes anything, and never changes an existing
 * account unless you pass --update-roles. No password is ever chosen, shown or
 * stored by this script — each account is created with a random throwaway
 * password nobody sees, and the person sets their own through the link.
 *
 * 1. Put the people in a JSON file (kept out of git — it holds personal data):
 *      scripts/staff.local.json
 *      [
 *        { "email": "priya@example.com", "fullName": "Priya Nair", "role": "admin" },
 *        { "email": "ravi@example.com",  "fullName": "Dr Ravi",    "role": "doctor" }
 *      ]
 *    Roles: admin | front_desk | doctor | product_manager
 *    (Sales agents are invite-only: the admin issues those from the admin
 *    dashboard, so they're deliberately not created here.)
 *
 * 2. Preview — changes nothing:
 *      node scripts/create-staff.mjs --site-url https://yourdomain.com.my
 *
 * 3. Create them and print the set-password links:
 *      node scripts/create-staff.mjs --site-url https://yourdomain.com.my --apply
 *
 * Other flags:
 *   --file <path>      use a different JSON file
 *   --links-only       just (re)generate links for accounts that already exist
 *                      (links expire after about an hour — regenerate when
 *                      you're ready to hand one over)
 *   --update-roles     also change the role of an existing account to match
 *   --allow-localhost  permit a localhost --site-url (testing only)
 *
 * The links are secrets: send each one only to its owner, privately.
 * The site URL must be in Supabase → Authentication → URL Configuration →
 * Redirect URLs, or the link will bounce.
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { randomBytes } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local', override: true })

const args = process.argv.slice(2)
const getArg = (flag) => {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : undefined
}
const APPLY = args.includes('--apply')
const LINKS_ONLY = args.includes('--links-only')
const UPDATE_ROLES = args.includes('--update-roles')
const ALLOW_LOCAL = args.includes('--allow-localhost')
const FILE = getArg('--file') || 'scripts/staff.local.json'
const SITE_URL = (getArg('--site-url') || '').replace(/\/$/, '')

const ROLES = ['admin', 'front_desk', 'doctor', 'product_manager']
const fail = (msg) => { console.error(`\n❌  ${msg}\n`); process.exit(1) }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey || serviceKey.startsWith('your-')) {
  fail('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
}
if (!existsSync(FILE)) fail(`No staff file at ${FILE}. See the top of this script for the format.`)

// ---- read + validate the list before touching anything ----
let people
try { people = JSON.parse(readFileSync(FILE, 'utf8')) } catch (e) { fail(`${FILE} is not valid JSON: ${e.message}`) }
if (!Array.isArray(people) || people.length === 0) fail(`${FILE} must be a non-empty JSON array.`)

const seen = new Set()
const problems = []
people.forEach((p, i) => {
  const where = `entry ${i + 1}${p?.email ? ` (${p.email})` : ''}`
  const email = String(p?.email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push(`${where}: invalid email`)
  if (!String(p?.fullName ?? '').trim()) problems.push(`${where}: fullName is required`)
  if (!ROLES.includes(p?.role)) problems.push(`${where}: role must be one of ${ROLES.join(', ')} (got "${p?.role}")`)
  if (seen.has(email)) problems.push(`${where}: listed twice`)
  seen.add(email)
  if (p) p.email = email
})
if (problems.length) fail(`Fix these in ${FILE} first:\n   - ${problems.join('\n   - ')}`)

if (APPLY || LINKS_ONLY) {
  if (!SITE_URL) fail('--site-url is required (the address the set-password links should open), e.g. --site-url https://yourdomain.com.my')
  if (!/^https?:\/\//.test(SITE_URL)) fail('--site-url must start with https:// (or http:// for testing)')
  if (/localhost|127\.0\.0\.1/.test(SITE_URL) && !ALLOW_LOCAL) {
    fail('--site-url points at localhost: staff would receive links that only work on this machine. Use the real domain, or add --allow-localhost for a test.')
  }
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

async function findAuthUser(email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === email)
    if (hit) return hit
    if (data.users.length < 200) return null
  }
  return null
}

async function currentRole(id) {
  const { data } = await sb.from('users').select('role').eq('id', id).maybeSingle()
  return data?.role ?? null
}

async function makeLink(email) {
  const { data, error } = await sb.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${SITE_URL}/auth/reset-password` },
  })
  if (error) throw error
  return data.properties.action_link
}

console.log(`\n${APPLY ? 'APPLYING' : LINKS_ONLY ? 'LINKS ONLY' : 'DRY RUN (nothing will be changed)'} — ${people.length} ${people.length === 1 ? 'person' : 'people'} in ${FILE}\n`)

const summary = { create: 0, exists: 0, roleChanged: 0, roleMismatchSkipped: 0, errors: 0 }
const links = []

for (const p of people) {
  const label = `${p.fullName} <${p.email}> as ${p.role}`
  try {
    const existing = await findAuthUser(p.email)

    if (LINKS_ONLY) {
      if (!existing) { console.log(`  ✗ ${label}: no account yet — run without --links-only first`); summary.errors++; continue }
      links.push({ p, link: await makeLink(p.email) })
      console.log(`  🔗 ${label}: link generated`)
      continue
    }

    if (existing) {
      const role = await currentRole(existing.id)
      if (role === p.role) {
        console.log(`  = ${label}: already exists with this role — left alone`)
        summary.exists++
      } else if (UPDATE_ROLES) {
        if (APPLY) {
          const { error } = await sb.from('users').update({ role: p.role, full_name: p.fullName }).eq('id', existing.id)
          if (error) throw error
        }
        console.log(`  ~ ${label}: ${APPLY ? 'role changed' : 'would change role'} (${role ?? 'none'} → ${p.role})`)
        summary.roleChanged++
      } else {
        console.log(`  ! ${label}: already exists as "${role ?? 'no role'}" — NOT changed (add --update-roles to change it)`)
        summary.roleMismatchSkipped++
      }
      continue
    }

    if (!APPLY) { console.log(`  + ${label}: would be created`); summary.create++; continue }

    // Throwaway password: random, never printed, never stored anywhere.
    const { data: created, error: cErr } = await sb.auth.admin.createUser({
      email: p.email,
      password: randomBytes(24).toString('base64url'),
      email_confirm: true,
      user_metadata: { full_name: p.fullName },
    })
    if (cErr) throw cErr
    const { error: uErr } = await sb.from('users').upsert(
      { id: created.user.id, email: p.email, full_name: p.fullName, role: p.role },
      { onConflict: 'id' },
    )
    if (uErr) throw uErr
    links.push({ p, link: await makeLink(p.email) })
    console.log(`  + ${label}: created`)
    summary.create++
  } catch (e) {
    console.log(`  ✗ ${label}: ${e.message ?? e}`)
    summary.errors++
  }
}

if (links.length) {
  console.log('\n──────── SET-PASSWORD LINKS (private — send each only to its owner; valid ~1 hour) ────────')
  for (const { p, link } of links) console.log(`\n${p.fullName} (${p.role})\n${link}`)
  console.log('\n─────────────────────────────────────────────────────────────────────────────────────')
}

console.log(`\nDone: ${summary.create} ${APPLY ? 'created' : 'to create'}, ${summary.exists} already fine, ${summary.roleChanged} role changes, ${summary.roleMismatchSkipped} skipped (role differs), ${summary.errors} errors.`)
if (!APPLY && !LINKS_ONLY) console.log('Nothing was changed. Add --apply to create the accounts.\n')
process.exit(summary.errors ? 1 : 0)
