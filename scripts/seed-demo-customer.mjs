#!/usr/bin/env node
/**
 * Populates the customer dashboard for the most-recent customer with a full demo state.
 * Idempotent — re-runs skip what's already there.
 *
 * Run:  node scripts/seed-demo-customer.mjs
 *
 * Cleanup (per section, in Supabase SQL Editor):
 *   DELETE FROM notifications WHERE user_id = '<uuid>';
 *   DELETE FROM support_messages WHERE ticket_id IN (SELECT id FROM support_tickets WHERE customer_id = '<uuid>');
 *   DELETE FROM support_tickets WHERE customer_id = '<uuid>';
 *   DELETE FROM customer_promos WHERE customer_id = '<uuid>';
 *   DELETE FROM wishlist_items WHERE customer_id = '<uuid>';
 *   DELETE FROM appointments WHERE customer_id = '<uuid>';
 *   DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE customer_id = '<uuid>');
 *   DELETE FROM orders WHERE customer_id = '<uuid>';
 *   DELETE FROM addresses WHERE customer_id = '<uuid>';
 *   DELETE FROM quiz_results WHERE user_id = '<uuid>';
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const log = (...a) => console.log('  ·', ...a)
const ok = (s) => console.log(`✅ ${s}`)
const skip = (s) => console.log(`⏭️   ${s} (already exists)`)
const die = (m) => { console.error(`❌ ${m}`); process.exit(1) }

// ─── helpers ──────────────────────────────────────────────────────────
const daysAgo = (n) => new Date(Date.now() - n * 86400e3).toISOString()
const daysAhead = (n) => new Date(Date.now() + n * 86400e3).toISOString()
const hoursAhead = (n) => new Date(Date.now() + n * 3600e3).toISOString()

async function pickCustomer() {
  const { data, error } = await sb.from('users').select('id, full_name, email, phone_number')
    .eq('role', 'customer').order('created_at', { ascending: false }).limit(1)
  if (error) die(error.message)
  if (!data?.length) die('No customer found. Sign up at /auth/register first.')
  return data[0]
}

async function preflight() {
  // Detect PostgREST schema-cache desync where HEAD works but SELECT/INSERT fail.
  const probe = await sb.from('promos').select('id').limit(1)
  if (probe.error?.message?.includes('schema cache')) {
    console.error('❌ Supabase REST schema cache is stale.')
    console.error('   Fix once in Supabase Studio → SQL Editor:')
    console.error('     NOTIFY pgrst, \'reload schema\';')
    console.error('   Then re-run this script.')
    process.exit(1)
  }
}

// ─── 1. PRODUCTS ──────────────────────────────────────────────────────
const PRODUCTS = [
  { sku: 'NEELI-OIL-200ML', name: 'Neelibhringadi Hair Oil', category: 'Hair Care',
    description: 'Traditional Ayurvedic hair oil for nourishment and natural lustre.',
    price_rm: 65, stock_qty: 24, image_url: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600' },
  { sku: 'KUMK-SER-30ML', name: 'Kumkumadi Face Serum', category: 'Skin Care',
    description: 'Saffron-infused facial elixir for radiant, even-toned skin.',
    price_rm: 120, stock_qty: 12, image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600' },
  { sku: 'TRIP-CHURN-100G', name: 'Triphala Churna', category: 'Digestion',
    description: 'Classical three-fruit powder for digestive health and gentle detox.',
    price_rm: 35, stock_qty: 3, image_url: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600' },
  { sku: 'ASHW-TAB-60CT', name: 'Ashwagandha Tablets', category: 'Wellness',
    description: 'Adaptogenic root for stress, sleep, and vitality. 60 tablets.',
    price_rm: 55, stock_qty: 18, image_url: 'https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600' },
  { sku: 'BRAH-CAP-90CT', name: 'Brahmi Capsules', category: 'Cognitive',
    description: 'Memory and clarity support, 90 capsules.',
    price_rm: 75, stock_qty: 8, image_url: 'https://images.unsplash.com/photo-1574226516831-e1dff420e562?w=600' },
  { sku: 'CHYAW-500G', name: 'Chyawanprash Premium', category: 'Immunity',
    description: 'Honey-amla immunity tonic. Daily teaspoon for the whole family.',
    price_rm: 95, stock_qty: 0, image_url: 'https://images.unsplash.com/photo-1605186632481-3ed52f3fed09?w=600' },
  { sku: 'ANU-DROP-30ML', name: 'Anu Thailam Nasya Drops', category: 'Respiratory',
    description: 'Daily nasal drops for clear sinus and balanced prana.',
    price_rm: 45, stock_qty: 30, image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600' },
  { sku: 'KESHA-COMBO', name: 'Kesha Care Combo', category: 'Bundle',
    description: 'Neelibhringadi oil + Brahmi capsules. Save RM 15.',
    price_rm: 125, stock_qty: 6, image_url: 'https://images.unsplash.com/photo-1601049647420-c0a8b73f1f10?w=600' },
]

async function seedProducts() {
  const { count } = await sb.from('products').select('id', { count: 'exact', head: true })
  if ((count ?? 0) >= 5) { skip('Products (have ' + count + ')'); return }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = PRODUCTS.map((p) => ({ ...p, is_bundle: p.sku === 'KESHA-COMBO' }))
  const { error } = await sb.from('products').insert(rows)
  if (error) die('products: ' + error.message)
  ok('Products seeded (' + rows.length + ')')
}

async function getProducts() {
  const { data } = await sb.from('products').select('id, name, sku, price_rm').limit(20)
  return data ?? []
}

// ─── 2. PROMOS ────────────────────────────────────────────────────────
const PROMOS = [
  { code: 'WELCOME10', title: 'RM 10 off your first order', kind: 'fixed', value_amount: 10,
    min_spend_rm: 50, applies_to: 'all', is_public: false, is_active: true,
    starts_at: daysAgo(30), expires_at: daysAhead(60) },
  { code: 'WELLNESS20', title: '20% off wellness products', kind: 'percentage', value_amount: 20,
    min_spend_rm: 100, applies_to: 'products', is_public: true, is_active: true,
    starts_at: daysAgo(5), expires_at: daysAhead(5) },
  { code: 'SHIPFREE', title: 'Free shipping on any order', kind: 'free-shipping', value_amount: 0,
    min_spend_rm: 0, applies_to: 'all', is_public: true, is_active: true,
    starts_at: daysAgo(10), expires_at: daysAhead(30) },
  { code: 'DEEPAWALI25', title: 'Deepawali special', kind: 'fixed', value_amount: 25,
    min_spend_rm: 150, applies_to: 'all', is_public: true, is_active: true,
    starts_at: daysAgo(90), expires_at: daysAgo(30) },
]

async function seedPromos() {
  const { count } = await sb.from('promos').select('id', { count: 'exact', head: true })
  if ((count ?? 0) >= 3) { skip('Promos (have ' + count + ')'); return }
  const { error } = await sb.from('promos').insert(PROMOS)
  if (error) die('promos: ' + error.message)
  ok('Promos seeded (' + PROMOS.length + ')')
}

// ─── 3. PROFILE EXTENSION ─────────────────────────────────────────────
async function fillProfile(c) {
  const updates = {
    date_of_birth: '1990-08-15',
    gender: 'female',
    height_cm: 162,
    weight_kg: 58,
    allergies: 'None known',
    current_medications: 'None',
    medical_conditions: 'Occasional migraines',
    marketing_opt_in: true,
    whatsapp_reminders_opt_in: true,
    email_reminders_opt_in: true,
    treatment_followups_opt_in: true,
    language: 'en',
  }
  const { error } = await sb.from('users').update(updates).eq('id', c.id)
  if (error) die('profile: ' + error.message)
  ok('Profile extended for ' + (c.full_name ?? 'customer'))
}

// ─── 4. ADDRESSES ─────────────────────────────────────────────────────
async function seedAddresses(c) {
  const { count } = await sb.from('addresses').select('id', { count: 'exact', head: true }).eq('customer_id', c.id)
  if ((count ?? 0) > 0) { skip('Addresses (have ' + count + ')'); return }
  const rows = [
    { customer_id: c.id, label: 'Home', recipient: c.full_name ?? 'Demo', phone: c.phone_number ?? '+60123456789',
      line1: '12-A, Jalan Tun Sambanthan', line2: 'Brickfields',
      city: 'Kuala Lumpur', state: 'Kuala Lumpur', postcode: '50470', is_default: true },
    { customer_id: c.id, label: 'Office', recipient: c.full_name ?? 'Demo', phone: c.phone_number ?? '+60123456789',
      line1: 'Menara KLCC, Level 32', line2: 'Suite 32-08',
      city: 'Kuala Lumpur', state: 'Kuala Lumpur', postcode: '50088', is_default: false },
    { customer_id: c.id, label: 'Family home (Penang)', recipient: 'Family', phone: '+60412345678',
      line1: '88, Jalan Gurney', line2: null,
      city: 'George Town', state: 'Penang', postcode: '10250', is_default: false },
  ]
  const { error } = await sb.from('addresses').insert(rows)
  if (error) die('addresses: ' + error.message)
  ok('3 addresses seeded')
}

// ─── 5. ORDERS ────────────────────────────────────────────────────────
async function seedOrders(c, products) {
  const { count } = await sb.from('orders').select('id', { count: 'exact', head: true }).eq('customer_id', c.id)
  if ((count ?? 0) > 0) { skip('Orders (have ' + count + ')'); return }

  const find = (sku) => products.find((p) => p.sku === sku)
  const neeli = find('NEELI-OIL-200ML'), kumk = find('KUMK-SER-30ML'),
        ashw = find('ASHW-TAB-60CT'), brah = find('BRAH-CAP-90CT'),
        trip = find('TRIP-CHURN-100G'), combo = find('KESHA-COMBO')
  if (!neeli || !kumk || !ashw || !brah || !trip) die('Missing products to seed orders.')

  const orderInputs = [
    // 1. Delivered three weeks ago
    { created_at: daysAgo(21), payment_status: 'paid', fulfillment_status: 'delivered',
      courier_service: 'Pos Laju', tracking_number: 'PL293847562MY', total_amount_rm: 195,
      items: [{ p: kumk, qty: 1 }, { p: ashw, qty: 1 }, { p: brah, qty: 1 }],
      practitioner_note: null },
    // 2. Shipped five days ago
    { created_at: daysAgo(5), payment_status: 'paid', fulfillment_status: 'shipped',
      courier_service: 'J&T Express', tracking_number: 'JT847263918MY', total_amount_rm: 130,
      items: [{ p: neeli, qty: 2 }], practitioner_note: 'Apply 2x per week, warm slightly before use.' },
    // 3. Processing (placed yesterday)
    { created_at: daysAgo(1), payment_status: 'paid', fulfillment_status: 'processing',
      courier_service: null, tracking_number: null, total_amount_rm: 165,
      items: [{ p: combo, qty: 1 }, { p: trip, qty: 1 }], practitioner_note: null },
    // 4. Awaiting payment (placed today, will age)
    { created_at: daysAgo(0), payment_status: 'pending', fulfillment_status: 'processing',
      courier_service: null, tracking_number: null, total_amount_rm: 55,
      items: [{ p: ashw, qty: 1 }], practitioner_note: null },
    // 5. Cancelled
    { created_at: daysAgo(8), payment_status: 'pending', fulfillment_status: 'cancelled',
      courier_service: null, tracking_number: null, total_amount_rm: 35,
      cancelled_at: daysAgo(7), cancel_reason: 'Ordered by mistake',
      items: [{ p: trip, qty: 1 }], practitioner_note: null },
  ]

  for (const o of orderInputs) {
    const { items, ...orderRow } = o
    const { data: ord, error: oErr } = await sb.from('orders')
      .insert({ ...orderRow, customer_id: c.id })
      .select('id').single()
    if (oErr) die('order: ' + oErr.message)
    const itemRows = items.map(({ p, qty }) => ({
      order_id: ord.id, product_id: p.id, quantity: qty, price_at_purchase_rm: p.price_rm,
    }))
    const { error: iErr } = await sb.from('order_items').insert(itemRows)
    if (iErr) die('order_items: ' + iErr.message)
    log('order created · ' + o.fulfillment_status + ' · RM' + o.total_amount_rm)
  }
  ok('5 orders seeded')
}

// ─── 6. APPOINTMENTS ──────────────────────────────────────────────────
async function seedAppointments(c) {
  const { count } = await sb.from('appointments').select('id', { count: 'exact', head: true }).eq('customer_id', c.id)
  if ((count ?? 0) > 0) { skip('Appointments (have ' + count + ')'); return }
  const rows = [
    { customer_id: c.id, treatment_name: 'Initial consultation (Prakriti reading)',
      doctor_name: 'Vaidya Akhil HS', appointment_date_time: daysAgo(14),
      duration_mins: 60, status: 'completed', advance_payment_rm: 0,
      mode: 'in-person', meeting_link: null,
      notes: 'Patient presents Vata-Pitta constitution. Recommended daily Triphala, weekly Abhyanga. Follow-up in 3 weeks.' },
    { customer_id: c.id, treatment_name: 'Abhyanga + Shirodhara',
      doctor_name: 'Vaidya Akhil HS', appointment_date_time: hoursAhead(4),
      duration_mins: 90, status: 'scheduled', advance_payment_rm: 80,
      mode: 'in-person', meeting_link: null, notes: null },
    { customer_id: c.id, treatment_name: 'Follow-up consultation',
      doctor_name: 'Vaidya Akhil HS', appointment_date_time: daysAhead(3),
      duration_mins: 30, status: 'scheduled', advance_payment_rm: 0,
      mode: 'virtual', meeting_link: 'https://meet.example.com/akhil-consult', notes: null },
    { customer_id: c.id, treatment_name: 'Panchakarma — Day 1 (Snehana)',
      doctor_name: 'Vaidya Akhil HS', appointment_date_time: daysAhead(28),
      duration_mins: 120, status: 'scheduled', advance_payment_rm: 200,
      mode: 'in-person', meeting_link: null, notes: 'Pre-treatment prep starts 7 days prior.' },
  ]
  const { error } = await sb.from('appointments').insert(rows)
  if (error) die('appointments: ' + error.message)
  ok('4 appointments seeded')
}

// ─── 7. WISHLIST ──────────────────────────────────────────────────────
async function seedWishlist(c, products) {
  const { count } = await sb.from('wishlist_items').select('id', { count: 'exact', head: true }).eq('customer_id', c.id)
  if ((count ?? 0) > 0) { skip('Wishlist (have ' + count + ')'); return }
  const pick = (sku) => products.find((p) => p.sku === sku)
  const rows = ['KUMK-SER-30ML', 'CHYAW-500G', 'ANU-DROP-30ML']
    .map((s) => pick(s)).filter(Boolean)
    .map((p) => ({ customer_id: c.id, product_id: p.id }))
  const { error } = await sb.from('wishlist_items').insert(rows)
  if (error) die('wishlist: ' + error.message)
  ok(rows.length + ' wishlist items seeded')
}

// ─── 8. CUSTOMER PROMOS ───────────────────────────────────────────────
async function seedCustomerPromos(c) {
  const { count } = await sb.from('customer_promos').select('id', { count: 'exact', head: true }).eq('customer_id', c.id)
  if ((count ?? 0) > 0) { skip('Customer promos (have ' + count + ')'); return }
  const { data: promos } = await sb.from('promos').select('id, code')
  if (!promos?.length) die('No promos to attach.')
  const byCode = Object.fromEntries(promos.map((p) => [p.code, p.id]))

  const rows = [
    { customer_id: c.id, promo_id: byCode['WELCOME10'], source: 'signup', status: 'active',
      granted_at: daysAgo(45), used_at: null, used_on_order_id: null },
    { customer_id: c.id, promo_id: byCode['WELLNESS20'], source: 'admin-grant', status: 'active',
      granted_at: daysAgo(2), used_at: null, used_on_order_id: null },
    { customer_id: c.id, promo_id: byCode['SHIPFREE'], source: 'manual-claim', status: 'used',
      granted_at: daysAgo(10), used_at: daysAgo(5), used_on_order_id: null },
    { customer_id: c.id, promo_id: byCode['DEEPAWALI25'], source: 'manual-claim', status: 'expired',
      granted_at: daysAgo(80), used_at: null, used_on_order_id: null },
  ].filter((r) => r.promo_id)

  const { error } = await sb.from('customer_promos').insert(rows)
  if (error) die('customer_promos: ' + error.message)
  ok(rows.length + ' customer promos seeded')
}

// ─── 9. SUPPORT TICKETS ───────────────────────────────────────────────
async function seedTickets(c) {
  const { count } = await sb.from('support_tickets').select('id', { count: 'exact', head: true }).eq('customer_id', c.id)
  if ((count ?? 0) > 0) { skip('Support tickets (have ' + count + ')'); return }

  // Open ticket
  const { data: t1, error: t1Err } = await sb.from('support_tickets').insert({
    customer_id: c.id, topic: 'prescription',
    subject: 'How long should I take the Triphala?',
    status: 'awaiting-customer', last_message_at: daysAgo(1),
    unread_by_customer: true, unread_by_clinic: false,
    created_at: daysAgo(3),
  }).select('id').single()
  if (t1Err) die('ticket 1: ' + t1Err.message)
  await sb.from('support_messages').insert([
    { ticket_id: t1.id, sender_kind: 'customer',
      body: 'Hi Vaidya, the Triphala you prescribed has been helping a lot. Should I continue taking it daily long-term?',
      created_at: daysAgo(3) },
    { ticket_id: t1.id, sender_kind: 'clinic',
      body: 'Wonderful to hear, Jay! Yes, Triphala is safe for daily long-term use. After 3 months, take a 2-week break before resuming. Reduce dose if any loose stools occur.',
      created_at: daysAgo(1) },
  ])

  // Resolved ticket
  const { data: t2, error: t2Err } = await sb.from('support_tickets').insert({
    customer_id: c.id, topic: 'order',
    subject: 'Tracking number for my last order',
    status: 'resolved', last_message_at: daysAgo(7),
    unread_by_customer: false, unread_by_clinic: false,
    created_at: daysAgo(8),
  }).select('id').single()
  if (t2Err) die('ticket 2: ' + t2Err.message)
  await sb.from('support_messages').insert([
    { ticket_id: t2.id, sender_kind: 'customer', body: 'When will my order ship?', created_at: daysAgo(8) },
    { ticket_id: t2.id, sender_kind: 'clinic', body: 'Shipped today via J&T — tracking JT847263918MY. ETA 2-3 days.', created_at: daysAgo(7) },
    { ticket_id: t2.id, sender_kind: 'customer', body: 'Got it, thanks!', created_at: daysAgo(7) },
  ])

  ok('2 tickets seeded')
}

// ─── 10. QUIZ RESULT ──────────────────────────────────────────────────
async function seedQuizResult(c) {
  const { count } = await sb.from('quiz_results').select('id', { count: 'exact', head: true }).eq('user_id', c.id)
  if ((count ?? 0) > 0) { skip('Quiz results (have ' + count + ')'); return }
  // Realistic Vata-Pitta result shape (mirrors what savePrakritiResult writes).
  const result_data = {
    version: 1,
    archetypeKey: 'vata-pitta',
    dominantDosha: 'vata',
    scores: { vata: 14, pitta: 12, kapha: 4 },
    answers: [],
  }
  const { error } = await sb.from('quiz_results').insert({
    user_id: c.id, quiz_slug: 'prakriti', result_data, completed_at: daysAgo(14),
  })
  if (error) die('quiz_results: ' + error.message)
  ok('Prakriti result seeded (Vata-Pitta)')
}

// ─── 11. NOTIFICATIONS ────────────────────────────────────────────────
async function seedNotifications(c) {
  const { count } = await sb.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', c.id)
  if ((count ?? 0) > 0) { skip('Notifications (have ' + count + ')'); return }
  const rows = [
    { user_id: c.id, kind: 'welcome',
      title: 'Welcome to Kerala Ayurvedic',
      body: 'Your Vaidya will reach out within 24 hours to begin your wellness journey.',
      href: '/account/dashboard', read_at: daysAgo(45), created_at: daysAgo(45) },
    { user_id: c.id, kind: 'order_placed',
      title: 'Order placed',
      body: 'Your order of Kumkumadi Serum + Ashwagandha is being prepared.',
      href: '/account/orders', read_at: daysAgo(21), created_at: daysAgo(21) },
    { user_id: c.id, kind: 'order_shipped',
      title: 'Order shipped',
      body: 'Tracking JT847263918MY · J&T Express. ETA 2-3 days.',
      href: '/account/orders', read_at: null, created_at: daysAgo(5) },
    { user_id: c.id, kind: 'appointment_confirmed',
      title: 'Appointment confirmed',
      body: 'Abhyanga + Shirodhara today at 4 PM.',
      href: '/account/appointments', read_at: null, created_at: daysAgo(0) },
    { user_id: c.id, kind: 'promo_granted',
      title: 'New voucher in your wallet',
      body: 'WELLNESS20 — 20% off wellness products. Expires in 5 days.',
      href: '/account/promos', read_at: daysAgo(2), created_at: daysAgo(2) },
  ]
  const { error } = await sb.from('notifications').insert(rows)
  if (error) die('notifications: ' + error.message)
  ok('5 notifications seeded')
}

// ─── MAIN ─────────────────────────────────────────────────────────────
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('Seeding demo customer dashboard state…')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const customer = await pickCustomer()
console.log(`Customer: ${customer.full_name ?? '—'} · ${customer.email ?? customer.phone_number ?? '—'}\n`)

await preflight()
await seedProducts()
await seedPromos()
const products = await getProducts()
console.log('')
await fillProfile(customer)
await seedAddresses(customer)
await seedOrders(customer, products)
await seedAppointments(customer)
await seedWishlist(customer, products)
await seedCustomerPromos(customer)
await seedTickets(customer)
await seedQuizResult(customer)
await seedNotifications(customer)

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅  Demo state ready. Sign in as the customer and explore.')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
