import type { Database } from '@/lib/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

export type OrderRow = Database['public']['Tables']['orders']['Row']
export type OrderItemRow = Database['public']['Tables']['order_items']['Row']
export type ProductRow = Database['public']['Tables']['products']['Row']

export interface OrderListLine {
  productId: string
  name: string
  imageUrl: string | null
  quantity: number
}

export interface OrderListItem extends Pick<OrderRow,
  'id' | 'total_amount_rm' | 'payment_status' | 'fulfillment_status' |
  'courier_service' | 'tracking_number' | 'created_at'> {
  itemCount: number
  firstItem: { name: string; imageUrl: string | null } | null
  lines: OrderListLine[]
}

export interface OrderItemWithProduct {
  id: string
  quantity: number
  price_at_purchase_rm: number
  product: Pick<ProductRow, 'id' | 'name' | 'image_url' | 'category'> | null
}

export interface OrderWithItems extends OrderRow {
  items: OrderItemWithProduct[]
}

export interface CustomerOrderStats {
  totalOrders: number
  totalSpent: number
}

/**
 * Server-side query helpers for the orders pages. RLS auto-filters by
 * auth.uid() so customer can only see their own data — we still pass
 * customerId explicitly for query clarity + TS inference.
 */

/**
 * Full list of customer's orders, newest first, with per-order item count.
 * Sized for the wellness-clinic use case (10s of orders, not 1000s).
 */
export async function listOrders(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string
): Promise<OrderListItem[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, total_amount_rm, payment_status, fulfillment_status,
      courier_service, tracking_number, created_at,
      order_items(
        id, quantity,
        product:products(id, name, image_url)
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[orders/listOrders] failed:', error.message)
    return []
  }
  if (!data) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row): OrderListItem => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawItems: any[] = Array.isArray(row.order_items) ? row.order_items : []
    const lines: OrderListLine[] = rawItems
      .map((it) => {
        const product = Array.isArray(it.product) ? it.product[0] : it.product
        if (!product?.id) return null
        return {
          productId: product.id as string,
          name: (product.name as string) ?? 'Product',
          imageUrl: (product.image_url as string | null) ?? null,
          quantity: Number(it.quantity ?? 0),
        } satisfies OrderListLine
      })
      .filter((l): l is OrderListLine => l !== null && l.quantity > 0)

    const firstItem = lines[0]
      ? { name: lines[0].name, imageUrl: lines[0].imageUrl }
      : null

    return {
      id: row.id,
      total_amount_rm: row.total_amount_rm,
      payment_status: row.payment_status,
      fulfillment_status: row.fulfillment_status,
      courier_service: row.courier_service,
      tracking_number: row.tracking_number,
      created_at: row.created_at,
      itemCount: lines.length,
      firstItem,
      lines,
    }
  })
}

/**
 * Single order with all items joined to product info. Returns null when
 * the order doesn't exist or doesn't belong to this customer (RLS will
 * make the row invisible — handled by the caller via notFound()).
 */
export async function getOrderById(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string,
  orderId: string
): Promise<OrderWithItems | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        id, quantity, price_at_purchase_rm,
        product:products(id, name, image_url, category)
      )
    `)
    .eq('id', orderId)
    .eq('customer_id', customerId)
    .maybeSingle()

  if (error) {
    console.error('[orders/getOrderById] failed:', error.message)
    return null
  }
  if (!data) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any
  return {
    ...(row as OrderRow),
    items: (row.order_items ?? []).map((it: {
      id: string
      quantity: number
      price_at_purchase_rm: number
      product: ProductRow | ProductRow[] | null
    }): OrderItemWithProduct => ({
      id: it.id,
      quantity: it.quantity,
      price_at_purchase_rm: Number(it.price_at_purchase_rm),
      // Supabase's nested join returns either an object or an array;
      // normalize to a single product (or null).
      product: Array.isArray(it.product) ? (it.product[0] ?? null) : (it.product ?? null),
    })),
  }
}

/**
 * Aggregate stats for the summary row at the top of the list page.
 * Total spent counts only paid orders.
 */
export async function getCustomerOrderStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  customerId: string
): Promise<CustomerOrderStats> {
  const { data, error } = await supabase
    .from('orders')
    .select('total_amount_rm, payment_status')
    .eq('customer_id', customerId)

  if (error) {
    console.error('[orders/getCustomerOrderStats] failed:', error.message)
    return { totalOrders: 0, totalSpent: 0 }
  }

  const rows = (data ?? []) as Array<Pick<OrderRow, 'total_amount_rm' | 'payment_status'>>
  const totalOrders = rows.length
  const totalSpent = rows
    .filter((r) => r.payment_status === 'paid')
    .reduce((sum, r) => sum + Number(r.total_amount_rm ?? 0), 0)

  return { totalOrders, totalSpent }
}
