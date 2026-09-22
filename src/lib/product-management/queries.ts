/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only'
import { createClient as createSb } from '@supabase/supabase-js'

function admin() {
  return createSb(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (i, init) => fetch(i, { ...init, cache: 'no-store' }) },
    },
  )
}

export interface ProductOrderListItem {
  id: string
  order_number: string
  email: string
  phone: string | null
  status: string
  payment_status: string
  total_rm: number
  created_at: string
  item_count: number
}

export async function listProductOrders(filters?: {
  status?: string
  paymentStatus?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<{ items: ProductOrderListItem[]; total: number }> {
  const sb = admin()
  let q = sb
    .from('product_orders')
    .select(
      'id, order_number, email, phone, status, payment_status, total_rm, created_at, product_order_items(count)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (filters?.status) q = q.eq('status', filters.status)
  if (filters?.paymentStatus) q = q.eq('payment_status', filters.paymentStatus)
  if (filters?.search) {
    const s = filters.search.trim()
    q = q.or(`order_number.ilike.%${s}%,email.ilike.%${s}%`)
  }

  const limit = filters?.limit ?? 50
  const offset = filters?.offset ?? 0
  q = q.range(offset, offset + limit - 1)

  const { data, error, count } = await q
  if (error) {
    console.error('[product-management] listProductOrders failed', error)
    return { items: [], total: 0 }
  }

  const items = (data ?? []).map((r: any) => ({
    id: r.id,
    order_number: r.order_number,
    email: r.email,
    phone: r.phone,
    status: r.status,
    payment_status: r.payment_status,
    total_rm: Number(r.total_rm),
    created_at: r.created_at,
    item_count: Number(r.product_order_items?.[0]?.count ?? 0),
  }))

  return { items, total: count ?? 0 }
}

export interface ProductOrderDetail {
  id: string
  order_number: string
  customer_id: string | null
  email: string
  phone: string | null
  status: string
  payment_status: string
  payment_method: string
  payment_provider: string | null
  subtotal_rm: number
  shipping_rm: number
  member_discount_rm: number
  total_rm: number
  shipping_country_code: string | null
  shipping_zone_name: string | null
  total_weight_grams: number
  billplz_bill_id: string | null
  provider_bill_id: string | null
  tracking_number: string | null
  courier: string | null
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  internal_notes: string | null
  created_at: string
  items: Array<{
    id: string
    product_id: string
    product_name: string
    product_sku: string | null
    quantity: number
    unit_price_rm: number
    line_total_rm: number
  }>
  address: {
    name: string
    email: string
    phone: string | null
    line_1: string
    line_2: string | null
    city: string
    postcode: string
    state: string
    country: string
  } | null
  history: Array<{
    id: string
    event_type: string
    from_status: string | null
    to_status: string | null
    payload: Record<string, unknown>
    created_at: string
    actor_id: string | null
  }>
}

export async function getProductOrderById(id: string): Promise<ProductOrderDetail | null> {
  const sb = admin()
  const { data, error } = await sb
    .from('product_orders')
    .select(
      `*,
       product_order_items(id, product_id, product_name, product_sku, quantity, unit_price_rm, line_total_rm),
       product_order_addresses(name, email, phone, line_1, line_2, city, postcode, state, country),
       product_order_status_history(id, event_type, from_status, to_status, payload, created_at, actor_id),
       shipping_zones(name)`,
    )
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('[product-management] getProductOrderById failed', error)
    return null
  }

  const d = data as any
  const addressArr = d.product_order_addresses as any[]
  const address = addressArr?.[0] ?? null

  return {
    id: d.id,
    order_number: d.order_number,
    customer_id: d.customer_id,
    email: d.email,
    phone: d.phone,
    status: d.status,
    payment_status: d.payment_status,
    payment_method: d.payment_method,
    payment_provider: d.payment_provider ?? null,
    subtotal_rm: Number(d.subtotal_rm),
    shipping_rm: Number(d.shipping_rm),
    member_discount_rm: Number(d.member_discount_rm),
    total_rm: Number(d.total_rm),
    shipping_country_code: d.shipping_country_code ?? null,
    shipping_zone_name: d.shipping_zones?.[0]?.name ?? null,
    total_weight_grams: Number(d.total_weight_grams ?? 0),
    billplz_bill_id: d.billplz_bill_id,
    provider_bill_id: d.provider_bill_id ?? null,
    tracking_number: d.tracking_number,
    courier: d.courier,
    paid_at: d.paid_at,
    shipped_at: d.shipped_at,
    delivered_at: d.delivered_at,
    cancelled_at: d.cancelled_at,
    cancel_reason: d.cancel_reason,
    internal_notes: d.internal_notes,
    created_at: d.created_at,
    items: (d.product_order_items as any[]).map((item) => ({
      id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      quantity: item.quantity,
      unit_price_rm: Number(item.unit_price_rm),
      line_total_rm: Number(item.line_total_rm),
    })),
    address: address
      ? {
          name: address.name,
          email: address.email,
          phone: address.phone,
          line_1: address.line_1,
          line_2: address.line_2,
          city: address.city,
          postcode: address.postcode,
          state: address.state,
          country: address.country,
        }
      : null,
    history: (d.product_order_status_history as any[]).map((h) => ({
      id: h.id,
      event_type: h.event_type,
      from_status: h.from_status,
      to_status: h.to_status,
      payload: h.payload,
      created_at: h.created_at,
      actor_id: h.actor_id,
    })),
  }
}

export interface PendingCancellation {
  id: string
  order_id: string
  order_number: string
  email: string
  reason: string
  amount_rm: number
  requested_at: string
  refund_status: string | null
}

export async function listCustomerProductOrders(
  customerId: string,
  email: string,
): Promise<ProductOrderListItem[]> {
  const sb = admin()
  const { data, error } = await sb
    .from('product_orders')
    .select(
      'id, order_number, email, phone, status, payment_status, total_rm, created_at, product_order_items(count)',
    )
    .or(`customer_id.eq.${customerId},email.eq.${email}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[product-management] listCustomerProductOrders failed', error)
    return []
  }

  return (data ?? []).map((r: any) => ({
    id: r.id,
    order_number: r.order_number,
    email: r.email,
    phone: r.phone,
    status: r.status,
    payment_status: r.payment_status,
    total_rm: Number(r.total_rm),
    created_at: r.created_at,
    item_count: Number(r.product_order_items?.[0]?.count ?? 0),
  }))
}

export async function getTodaysOrderStats(): Promise<{
  orders: number
  revenue: number
  paidOrders: number
}> {
  const sb = admin()
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const startIso = start.toISOString()

  const { data, error } = await sb
    .from('product_orders')
    .select('status, payment_status, total_rm')
    .gte('created_at', startIso)

  if (error || !data) {
    console.error('[product-management] getTodaysOrderStats failed', error)
    return { orders: 0, revenue: 0, paidOrders: 0 }
  }

  const paid = data.filter((r: any) => r.status === 'paid' || r.payment_status === 'paid')
  return {
    orders: data.length,
    revenue: paid.reduce((sum: number, r: any) => sum + Number(r.total_rm), 0),
    paidOrders: paid.length,
  }
}

export async function getLowStockCount(): Promise<number> {
  const sb = admin()
  const { data, error } = await sb.rpc('get_low_stock_products') // optional helper; fallback below
  if (error) {
    // Fallback to a simple client-side count
    const { data: products, error: prodError } = await sb
      .from('products')
      .select('stock_qty, low_stock_threshold')
    if (prodError || !products) {
      console.error('[product-management] getLowStockCount failed', prodError)
      return 0
    }
    return products.filter((p: any) => {
      const threshold = p.low_stock_threshold ?? 5
      return p.stock_qty <= threshold
    }).length
  }
  return data?.length ?? 0
}

export async function listPendingCancellations(): Promise<PendingCancellation[]> {
  const sb = admin()
  const { data, error } = await sb
    .from('product_cancellations')
    .select(
      `id, reason, requested_at, status,
       product_orders(id, order_number, email, total_rm),
       product_refund_requests(id, status)`,
    )
    .eq('status', 'requested')
    .order('requested_at', { ascending: false })

  if (error) {
    console.error('[product-management] listPendingCancellations failed', error)
    return []
  }

  return (data ?? []).map((r: any) => {
    const order = Array.isArray(r.product_orders) ? r.product_orders[0] : r.product_orders
    const refund = Array.isArray(r.product_refund_requests)
      ? r.product_refund_requests[0]
      : r.product_refund_requests
    return {
      id: r.id,
      order_id: order?.id,
      order_number: order?.order_number,
      email: order?.email,
      reason: r.reason,
      amount_rm: Number(order?.total_rm ?? 0),
      requested_at: r.requested_at,
      refund_status: refund?.status ?? null,
    }
  })
}

export interface InFlightProductRefund {
  id: string
  order_id: string
  order_number: string
  email: string
  amount_rm: number
  status: string
  failure_reason: string | null
  requested_at: string
}

/**
 * Refunds that have been approved and sent to HitPay but haven't resolved
 * yet — either still 'pending' (settling) or 'exception' (needs manual
 * follow-up). Approved cancellations otherwise disappear from view once
 * they leave listPendingCancellations(), so this is the only place staff
 * can see a refund actually in flight.
 */
export async function listInFlightProductRefunds(): Promise<InFlightProductRefund[]> {
  const sb = admin()
  const { data, error } = await sb
    .from('product_refund_requests')
    .select(
      `id, amount_rm, status, failure_reason, requested_at,
       product_orders(id, order_number, email)`,
    )
    .in('status', ['pending', 'exception'])
    .order('requested_at', { ascending: false })

  if (error) {
    console.error('[product-management] listInFlightProductRefunds failed', error)
    return []
  }

  return (data ?? []).map((r: any) => {
    const order = Array.isArray(r.product_orders) ? r.product_orders[0] : r.product_orders
    return {
      id: r.id,
      order_id: order?.id,
      order_number: order?.order_number,
      email: order?.email,
      amount_rm: Number(r.amount_rm ?? 0),
      status: r.status,
      failure_reason: r.failure_reason ?? null,
      requested_at: r.requested_at,
    }
  })
}
