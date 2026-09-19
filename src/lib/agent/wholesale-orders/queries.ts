import type { SupabaseClient } from '@supabase/supabase-js'
import {
  WHOLESALE_STATUS_LABEL,
  type WholesaleStatus,
} from '@/lib/admin/wholesale-orders/queries'

export { WHOLESALE_STATUS_LABEL }
export type { WholesaleStatus }

export interface AgentWholesaleListItem {
  id: string
  orderNumber: string
  status: WholesaleStatus
  totalRm: number
  itemCount: number
  createdAt: string
  paidAt: string | null
  shippedAt: string | null
  trackingNumber: string | null
}

export interface AgentWholesaleDetail {
  id: string
  orderNumber: string
  status: WholesaleStatus
  subtotalRm: number
  shippingRm: number
  totalRm: number
  shippingAddress: string
  shippingPostcode: string
  shippingState: string
  agentNotes: string | null
  paymentMethod: string | null
  paymentProofUrl: string | null
  paidAt: string | null
  trackingNumber: string | null
  courier: string | null
  shippedAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
  cancelReason: string | null
  createdAt: string
  items: Array<{
    id: string
    productName: string
    productSku: string | null
    quantity: number
    unitPriceRm: number
    lineTotalRm: number
  }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = SupabaseClient<any>

export async function listAgentWholesaleOrders(
  supabase: SB,
  agentId: string,
): Promise<AgentWholesaleListItem[]> {
  const { data } = await supabase
    .from('wholesale_orders')
    .select(
      `id, order_number, status, total_rm, created_at, paid_at, shipped_at,
       tracking_number,
       items:wholesale_order_items(id)`,
    )
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((r) => ({
    id: r.id,
    orderNumber: r.order_number,
    status: r.status,
    totalRm: Number(r.total_rm ?? 0),
    itemCount: Array.isArray(r.items) ? r.items.length : 0,
    createdAt: r.created_at,
    paidAt: r.paid_at ?? null,
    shippedAt: r.shipped_at ?? null,
    trackingNumber: r.tracking_number ?? null,
  }))
}

export async function getAgentWholesaleOrderById(
  supabase: SB,
  orderId: string,
  agentId: string,
): Promise<AgentWholesaleDetail | null> {
  const { data, error } = await supabase
    .from('wholesale_orders')
    .select(
      `id, order_number, status, subtotal_rm, shipping_rm, total_rm,
       shipping_address, shipping_postcode, shipping_state,
       agent_notes, payment_method, payment_proof_url,
       paid_at, tracking_number, courier, shipped_at, delivered_at,
       cancelled_at, cancel_reason, created_at,
       items:wholesale_order_items(
         id, product_name, product_sku, quantity, unit_price_rm, line_total_rm
       )`,
    )
    .eq('id', orderId)
    .eq('agent_id', agentId)
    .maybeSingle()

  if (error || !data) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r: any = data
  return {
    id: r.id,
    orderNumber: r.order_number,
    status: r.status,
    subtotalRm: Number(r.subtotal_rm ?? 0),
    shippingRm: Number(r.shipping_rm ?? 0),
    totalRm: Number(r.total_rm ?? 0),
    shippingAddress: r.shipping_address,
    shippingPostcode: r.shipping_postcode,
    shippingState: r.shipping_state,
    agentNotes: r.agent_notes ?? null,
    paymentMethod: r.payment_method ?? null,
    paymentProofUrl: r.payment_proof_url ?? null,
    paidAt: r.paid_at ?? null,
    trackingNumber: r.tracking_number ?? null,
    courier: r.courier ?? null,
    shippedAt: r.shipped_at ?? null,
    deliveredAt: r.delivered_at ?? null,
    cancelledAt: r.cancelled_at ?? null,
    cancelReason: r.cancel_reason ?? null,
    createdAt: r.created_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: ((r.items ?? []) as any[]).map((it) => ({
      id: it.id,
      productName: it.product_name,
      productSku: it.product_sku ?? null,
      quantity: it.quantity,
      unitPriceRm: Number(it.unit_price_rm ?? 0),
      lineTotalRm: Number(it.line_total_rm ?? 0),
    })),
  }
}
