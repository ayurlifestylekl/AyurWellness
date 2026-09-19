import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const sb = createClient(url, key, { auth: { persistSession: false } })

async function main() {
  // 1. List customers — pick the most recent one (the user testing)
  const { data: customers, error: cErr } = await sb
    .from('users')
    .select('id, full_name, email, created_at')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
  if (cErr) throw cErr
  if (!customers?.length) {
    console.error('No customer users found. Sign up at /auth/register first.')
    process.exit(1)
  }
  console.log('Customers found:')
  customers.forEach((c, i) => console.log(`  [${i}] ${c.full_name ?? '—'} · ${c.email ?? '—'} · ${c.id}`))

  const me = customers[0]
  console.log(`\n→ Seeding orders for: ${me.full_name ?? me.email} (${me.id})\n`)

  // 2. Seed products if the table is empty
  const { data: existingProducts } = await sb.from('products').select('id').limit(1)
  if (!existingProducts?.length) {
    console.log('Products table empty — seeding 6 products first.')
    const productSeed = [
      { name: 'Kesha Thailam', description: 'Cooling hair & scalp oil with brahmi, bhringraj and amla.', price_rm: 89, sku: 'KT-001', stock_qty: 42, category: 'hair-care', is_bundle: false, image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80' },
      { name: 'Neelibhringadi Kera Thailam', description: 'Intense hair growth & root strengthener.', price_rm: 79, sku: 'NB-002', stock_qty: 35, category: 'hair-care', is_bundle: false, image_url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80' },
      { name: 'Kumkumadi Serum', description: 'Saffron glow elixir with sandalwood and lotus.', price_rm: 159, sku: 'KS-003', stock_qty: 18, category: 'skin-care', is_bundle: false, image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80' },
      { name: 'Nalpamaradi Thailam', description: 'Turmeric brightening body oil for abhyanga.', price_rm: 110, sku: 'NT-004', stock_qty: 28, category: 'skin-care', is_bundle: false, image_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=800&q=80' },
      { name: 'Ashwagandha Extract', description: 'Daily adaptogen for stress, sleep, and vitality.', price_rm: 120, sku: 'AS-005', stock_qty: 50, category: 'wellness', is_bundle: false, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
      { name: 'Mahanarayan Oil', description: 'Classical pain-relief oil for joints and muscles.', price_rm: 95, sku: 'MN-006', stock_qty: 30, category: 'pain-relief', is_bundle: false, image_url: 'https://images.unsplash.com/photo-1611042553365-9b101441c135?auto=format&fit=crop&w=800&q=80' },
    ]
    const { error: insErr } = await sb.from('products').insert(productSeed)
    if (insErr) throw insErr
    console.log(`Seeded ${productSeed.length} products.\n`)
  }

  // 3. Pull products to populate orders
  const { data: products, error: pErr } = await sb
    .from('products')
    .select('id, name, price_rm, image_url')
    .gt('price_rm', 0)
    .order('created_at', { ascending: true })
    .limit(6)
  if (pErr) throw pErr
  if (!products?.length) {
    console.error('No products found after seeding. Cannot seed order_items.')
    process.exit(1)
  }
  console.log(`Using ${products.length} products: ${products.map((p) => p.name).join(', ')}\n`)

  // 3. Wipe any prior seeded orders for this customer (idempotent)
  const { data: prior, error: priorErr } = await sb
    .from('orders')
    .select('id')
    .eq('customer_id', me.id)
  if (priorErr) throw priorErr
  if (prior?.length) {
    const ids = prior.map((o) => o.id)
    await sb.from('order_items').delete().in('order_id', ids)
    await sb.from('orders').delete().in('id', ids)
    console.log(`Cleared ${prior.length} prior order(s).\n`)
  }

  const now = new Date()
  const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString()

  // 4. Build 3 orders
  const ordersToInsert = [
    {
      meta: { label: 'Delivered · paid (oldest)', items: [[0, 2], [1, 1], [2, 1]] },
      row: {
        customer_id: me.id,
        payment_status: 'paid',
        fulfillment_status: 'delivered',
        courier_service: 'Pos Laju',
        tracking_number: 'EL183829441MY',
        created_at: daysAgo(28),
      },
    },
    {
      meta: { label: 'Shipped · paid (in transit)', items: [[3, 1], [4, 2]] },
      row: {
        customer_id: me.id,
        payment_status: 'paid',
        fulfillment_status: 'shipped',
        courier_service: 'Ninja Van',
        tracking_number: 'NVMYS00091823',
        created_at: daysAgo(4),
      },
    },
    {
      meta: { label: 'Processing · pending', items: [[5, 1], [0, 1]] },
      row: {
        customer_id: me.id,
        payment_status: 'pending',
        fulfillment_status: 'processing',
        courier_service: null,
        tracking_number: null,
        created_at: daysAgo(1),
      },
    },
  ]

  for (const order of ordersToInsert) {
    // Calculate total
    const lineRows = order.meta.items
      .map(([idx, qty]) => {
        const p = products[idx % products.length]
        return p ? { product: p, quantity: qty } : null
      })
      .filter(Boolean)
    const total = lineRows.reduce(
      (sum, l) => sum + Number(l.product.price_rm) * l.quantity,
      0
    )

    const { data: inserted, error: oErr } = await sb
      .from('orders')
      .insert({ ...order.row, total_amount_rm: total })
      .select('id')
      .single()
    if (oErr) throw oErr

    const itemRows = lineRows.map((l) => ({
      order_id: inserted.id,
      product_id: l.product.id,
      quantity: l.quantity,
      price_at_purchase_rm: l.product.price_rm,
    }))
    const { error: iErr } = await sb.from('order_items').insert(itemRows)
    if (iErr) throw iErr

    console.log(
      `✓ ${order.meta.label} — RM ${total.toFixed(2)} (${itemRows.length} lines)`
    )
  }

  console.log('\nDone. Reload /account/orders to see them.\n')
}

main().catch((e) => {
  console.error('Seed failed:', e.message)
  process.exit(1)
})
