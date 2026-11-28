import 'server-only'
import { createClient as createSb } from '@supabase/supabase-js'
import type { JtOrder } from './jt'

export function serviceDb() {
  return createSb(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (i, init) => fetch(i, { ...init, cache: 'no-store' }) },
  })
}

/** Paid shop orders with their delivery address, items and product weights, for J&T. */
export async function loadJtOrders(ids: string[]): Promise<JtOrder[]> {
  const sb = serviceDb()
  const { data, error } = await sb
    .from('product_orders')
    .select('id, order_number, phone, email, subtotal_rm, payment_status, product_order_items(product_id, product_name, quantity), product_order_addresses(name, email, phone, line_1, line_2, city, postcode, state, country)')
    .in('id', ids)
    .eq('payment_status', 'paid')
    .order('paid_at', { ascending: true })
  if (error) {
    console.error('[jt] order lookup failed', error.message)
    return []
  }
  const productIds = Array.from(new Set((data ?? []).flatMap((o) => (o.product_order_items ?? []).map((i: { product_id: string | null }) => i.product_id).filter(Boolean)))) as string[]
  const weights = new Map<string, number | null>()
  if (productIds.length) {
    const { data: ps } = await sb.from('products').select('id, weight_grams').in('id', productIds)
    for (const p of ps ?? []) weights.set(p.id, p.weight_grams != null ? Number(p.weight_grams) : null)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((o: any) => {
    const a = (Array.isArray(o.product_order_addresses) ? o.product_order_addresses[0] : o.product_order_addresses) ?? {}
    return {
      orderNumber: o.order_number,
      receiverName: a.name ?? '',
      receiverPhone: a.phone ?? o.phone ?? '',
      postcode: a.postcode ?? '',
      addressLines: [a.line_1, a.line_2, a.city, a.state].filter(Boolean),
      country: a.country ?? '',
      email: a.email ?? o.email ?? null,
      goodsValueRm: Number(o.subtotal_rm ?? 0),
      items: (o.product_order_items ?? []).map((i: { product_id: string | null; product_name: string; quantity: number }) => ({
        name: i.product_name,
        quantity: i.quantity,
        weightGrams: i.product_id ? weights.get(i.product_id) ?? null : null,
      })),
    }
  })
}
