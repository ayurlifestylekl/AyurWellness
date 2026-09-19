import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type OrdersRow = Database['public']['Tables']['orders']['Row']

export interface AdminOrderListItem {
  id: string
  shortId: string
  customerName: string | null
  customerEmail: string | null
  totalRm: number
  paymentStatus: OrdersRow['payment_status']
  fulfillmentStatus: OrdersRow['fulfillment_status']
  channel: OrdersRow['channel']
  trackingNumber: string | null
  createdAt: string
  itemCount: number
}

export interface AdminOrderFilters {
  fulfillmentStatus?: OrdersRow['fulfillment_status'][]
  paymentStatus?: OrdersRow['payment_status'][]
  channel?: OrdersRow['channel'][]
  dateFrom?: string
  dateTo?: string
  hasTracking?: boolean
  search?: string
  limit?: number
  offset?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any, 'public', any>

/**
 * List admin orders with filters. Admin RLS bypass via is_admin() means we
 * see every order regardless of customer_id. Joins the customer for name +
 * email rendering in the list, and order_items just for the count.
 */
export async function listAdminOrders(
  supabase: SB,
  filters: AdminOrderFilters = {}
): Promise<{ items: AdminOrderListItem[]; total: number }> {
  let q = supabase
    .from('orders')
    .select(
      `
      id, customer_id, total_amount_rm,
      payment_status, fulfillment_status, channel,
      tracking_number, created_at,
      customer:users!orders_customer_id_fkey(full_name, email),
      order_items(id)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (filters.fulfillmentStatus?.length)
    q = q.in('fulfillment_status', filters.fulfillmentStatus)
  if (filters.paymentStatus?.length) q = q.in('payment_status', filters.paymentStatus)
  if (filters.channel?.length) q = q.in('channel', filters.channel)
  if (filters.dateFrom) q = q.gte('created_at', filters.dateFrom)
  if (filters.dateTo) q = q.lte('created_at', filters.dateTo)
  if (filters.hasTracking === true) q = q.not('tracking_number', 'is', null)
  if (filters.hasTracking === false) q = q.is('tracking_number', null)
  if (filters.search) {
    const s = filters.search.replace(/[%_]/g, '')
    // Search across order id (cast to text), customer name, customer email.
    q = q.or(
      `id::text.ilike.%${s}%,customer.full_name.ilike.%${s}%,customer.email.ilike.%${s}%`
    )
  }

  const offset = filters.offset ?? 0
  const limit = filters.limit ?? 50
  q = q.range(offset, offset + limit - 1)

  const { data, error, count } = await q
  if (error) {
    console.error('[admin/orders] listAdminOrders failed:', error.message)
    return { items: [], total: 0 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = ((data ?? []) as any[]).map((r): AdminOrderListItem => {
    const cust = Array.isArray(r.customer) ? r.customer[0] : r.customer
    return {
      id: r.id,
      shortId: String(r.id).slice(-6).toUpperCase(),
      customerName: cust?.full_name ?? null,
      customerEmail: cust?.email ?? null,
      totalRm: Number(r.total_amount_rm),
      paymentStatus: r.payment_status,
      fulfillmentStatus: r.fulfillment_status,
      channel: r.channel,
      trackingNumber: r.tracking_number,
      createdAt: r.created_at,
      itemCount: Array.isArray(r.order_items) ? r.order_items.length : 0,
    }
  })

  return { items, total: count ?? 0 }
}

/**
 * Full order detail for the admin detail page. Pulls customer, both addresses,
 * line items with product info, refunds, and the event timeline in one round-trip.
 */
export async function getAdminOrderById(supabase: SB, id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      customer:users!orders_customer_id_fkey(id, full_name, email, phone_number),
      billing_address:addresses!orders_billing_address_id_fkey(*),
      shipping_address:addresses!orders_shipping_address_id_fkey(*),
      order_items(*, product:products(id, name, sku, image_url, category)),
      refunds(*),
      events:order_events(*)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    console.error('[admin/orders] getAdminOrderById failed:', error.message)
    return null
  }
  return data
}

/**
 * Used by the CRM customer-detail page to show that customer's recent orders.
 */
export async function listOrdersByCustomer(supabase: SB, customerId: string, limit = 10) {
  const { data } = await supabase
    .from('orders')
    .select('id, total_amount_rm, fulfillment_status, payment_status, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}
