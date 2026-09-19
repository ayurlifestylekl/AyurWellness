import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const SEEDED_SKUS = ['KT-001', 'NB-002', 'KS-003', 'NT-004', 'AS-005', 'MN-006']

async function main() {
  // 1. Find every customer with orders, wipe them all (this is a clean slate)
  const { data: orders, error: oErr } = await sb
    .from('orders')
    .select('id, customer_id')
  if (oErr) throw oErr

  if (orders?.length) {
    const ids = orders.map((o) => o.id)
    const { error: iErr } = await sb.from('order_items').delete().in('order_id', ids)
    if (iErr) throw iErr
    const { error: oDel } = await sb.from('orders').delete().in('id', ids)
    if (oDel) throw oDel
    console.log(`Removed ${orders.length} orders and their line items.`)
  } else {
    console.log('No orders to remove.')
  }

  // 2. Remove the seeded products by SKU
  const { data: prods, error: pErr } = await sb
    .from('products')
    .select('id, name, sku')
    .in('sku', SEEDED_SKUS)
  if (pErr) throw pErr

  if (prods?.length) {
    const { error: pDel } = await sb
      .from('products')
      .delete()
      .in('id', prods.map((p) => p.id))
    if (pDel) throw pDel
    console.log(`Removed ${prods.length} seeded products: ${prods.map((p) => p.name).join(', ')}`)
  } else {
    console.log('No seeded products to remove.')
  }

  console.log('\nDemo data cleared.')
}

main().catch((e) => {
  console.error('Cleanup failed:', e.message)
  process.exit(1)
})
