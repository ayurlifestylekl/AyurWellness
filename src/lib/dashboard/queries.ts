import type { Database } from '@/lib/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

export type OrderRow = Database['public']['Tables']['orders']['Row']
export type AppointmentRow = Database['public']['Tables']['appointments']['Row']
export type ProductRow = Database['public']['Tables']['products']['Row']

/**
 * Server-side query helpers for the customer dashboard. RLS auto-filters
 * by auth.uid() so customer can only see their own data — we still pass
 * customerId explicitly for query clarity + TS inference.
 */

interface RecentOrder extends Pick<OrderRow,
  'id' | 'total_amount_rm' | 'payment_status' | 'fulfillment_status' |
  'courier_service' | 'tracking_number' | 'created_at'> {
  itemCount: number
}

/** Last 3 orders, newest first, with line-item count. */
export async function getRecentOrders(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string,
  limit = 3
): Promise<RecentOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, total_amount_rm, payment_status, fulfillment_status,
      courier_service, tracking_number, created_at,
      order_items(count)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[dashboard/getRecentOrders] failed:', error.message)
    return []
  }
  if (!data) return []

  // Cast: the hand-maintained Database type predates v2 inference metadata.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row): RecentOrder => ({
    id: row.id,
    total_amount_rm: row.total_amount_rm,
    payment_status: row.payment_status,
    fulfillment_status: row.fulfillment_status,
    courier_service: row.courier_service,
    tracking_number: row.tracking_number,
    created_at: row.created_at,
    itemCount: row.order_items?.[0]?.count ?? 0,
  }))
}

/** Next N scheduled appointments in the future. */
export async function getUpcomingAppointments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string,
  limit = 2
): Promise<AppointmentRow[]> {
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('customer_id', customerId)
    .eq('status', 'scheduled')
    .gte('appointment_date_time', nowIso)
    .order('appointment_date_time', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[dashboard/getUpcomingAppointments] failed:', error.message)
    return []
  }
  return (data ?? []) as AppointmentRow[]
}

/** Count of orders that are not yet delivered. */
export async function getActiveOrdersCount(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .neq('fulfillment_status', 'delivered')

  if (error) {
    console.error('[dashboard/getActiveOrdersCount] failed:', error.message)
    return 0
  }
  return count ?? 0
}

/**
 * Sample products for the Recommendations Tier-B placeholder.
 * Pulls 3 latest products — purely for visual demonstration. Will swap
 * to a real `recommendations` table query when that exists.
 */
export async function getSampleProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  limit = 3
): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[dashboard/getSampleProducts] failed:', error.message)
    return []
  }
  return (data ?? []) as ProductRow[]
}
