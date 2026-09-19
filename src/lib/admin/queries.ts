import type { SupabaseClient } from '@supabase/supabase-js'

export interface AdminOverviewStats {
  ordersToday: number
  pendingFulfillment: number
  unreadTickets: number
  lowStockProducts: number
}

export interface OrderNeedingAttention {
  id: string
  shortId: string
  totalRm: number
  createdAt: string
  paymentStatus: 'pending' | 'paid' | 'failed'
  fulfillmentStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled'
  customerName: string | null
}

export interface TicketNeedingAttention {
  id: string
  subject: string
  topic: string
  lastMessageAt: string
  customerName: string | null
}

export interface LowStockProduct {
  id: string
  name: string
  sku: string
  stockQty: number
}

export const LOW_STOCK_THRESHOLD = 5

export async function getAdminOverviewStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>
): Promise<AdminOverviewStats> {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startISO = startOfToday.toISOString()

  const [ordersToday, pendingFulfillment, unreadTickets, lowStockProducts] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startISO),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('payment_status', 'paid')
      .eq('fulfillment_status', 'processing'),
    supabase
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('unread_by_clinic', true),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_bundle', false)
      .lt('stock_qty', LOW_STOCK_THRESHOLD),
  ])

  return {
    ordersToday: ordersToday.count ?? 0,
    pendingFulfillment: pendingFulfillment.count ?? 0,
    unreadTickets: unreadTickets.count ?? 0,
    lowStockProducts: lowStockProducts.count ?? 0,
  }
}

export async function getOrdersNeedingAttention(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  limit = 5
): Promise<OrderNeedingAttention[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, total_amount_rm, payment_status, fulfillment_status, created_at, customer:users(full_name)')
    .eq('payment_status', 'paid')
    .eq('fulfillment_status', 'processing')
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) {
    console.error('[admin/ordersNeedingAttention] failed:', error.message)
    return []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    shortId: (row.id as string).slice(-6).toUpperCase(),
    totalRm: Number(row.total_amount_rm),
    createdAt: row.created_at,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    customerName: row.customer?.full_name ?? null,
  }))
}

export async function getTicketsNeedingAttention(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  limit = 5
): Promise<TicketNeedingAttention[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('id, subject, topic, last_message_at, customer:users(full_name)')
    .eq('unread_by_clinic', true)
    .order('last_message_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('[admin/ticketsNeedingAttention] failed:', error.message)
    return []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    subject: row.subject,
    topic: row.topic,
    lastMessageAt: row.last_message_at,
    customerName: row.customer?.full_name ?? null,
  }))
}

export async function getLowStockProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  limit = 5
): Promise<LowStockProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, stock_qty')
    .eq('is_bundle', false)
    .lt('stock_qty', LOW_STOCK_THRESHOLD)
    .order('stock_qty', { ascending: true })
    .limit(limit)
  if (error) {
    console.error('[admin/lowStock] failed:', error.message)
    return []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    stockQty: row.stock_qty,
  }))
}

// ─────────────────────────────────────────────────────────────────────
// Extended overview (Phase 2 of admin overview)
// ─────────────────────────────────────────────────────────────────────

export interface ExtendedOverviewStats extends AdminOverviewStats {
  revenueTodayRm: number
  newCustomersToday: number
  avgOrderValueRm: number
  pendingConsultationsToday: number
}

export interface ConsultationToday {
  id: string
  startsAt: string
  treatmentName: string
  mode: 'in-person' | 'virtual'
  customerName: string | null
  status: 'scheduled' | 'completed' | 'cancelled'
}

export interface TopSellingProduct {
  productId: string
  name: string
  unitsSold: number
  revenueRm: number
}

export interface VaidyaUtilization {
  bookedMinutes: number
  availableMinutes: number
  percent: number
}

export interface ActivePromo {
  id: string
  code: string
  title: string
  expiresAt: string | null
}

export interface MostBookedTreatment {
  name: string
  bookings: number
}

export interface AgedPendingOrder {
  id: string
  shortId: string
  totalRm: number
  createdAt: string
  customerName: string | null
}

const AVAILABLE_MINS_PER_WEEK = 10 * 60 * 6 // 10h/day × 6 days (Tue-Sun, Mon closed)

function startOfTodayISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function startOfWeekISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  // Monday start: if Sunday (0) go back 6, else back to Monday
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d.toISOString()
}

function endOfTodayISO(): string {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export async function getExtendedOverviewStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>
): Promise<ExtendedOverviewStats> {
  const base = await getAdminOverviewStats(supabase)
  const startISO = startOfTodayISO()
  const endISO = endOfTodayISO()

  const [revenueResp, newCustResp, pendingConsResp] = await Promise.all([
    supabase
      .from('orders')
      .select('total_amount_rm')
      .eq('payment_status', 'paid')
      .gte('created_at', startISO),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'customer')
      .gte('created_at', startISO),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('appointment_date_time', startISO)
      .lte('appointment_date_time', endISO)
      .eq('status', 'scheduled'),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const revRows = (revenueResp.data ?? []) as any[]
  const revenueTodayRm = revRows.reduce((sum, r) => sum + Number(r.total_amount_rm), 0)
  const avgOrderValueRm = revRows.length === 0 ? 0 : revenueTodayRm / revRows.length

  return {
    ...base,
    revenueTodayRm,
    newCustomersToday: newCustResp.count ?? 0,
    avgOrderValueRm,
    pendingConsultationsToday: pendingConsResp.count ?? 0,
  }
}

export async function getTodayConsultations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>
): Promise<ConsultationToday[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, appointment_date_time, treatment_name, mode, status, customer:users(full_name)')
    .gte('appointment_date_time', startOfTodayISO())
    .lte('appointment_date_time', endOfTodayISO())
    .order('appointment_date_time', { ascending: true })
  if (error) {
    console.error('[admin/todayConsults] failed:', error.message)
    return []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    startsAt: row.appointment_date_time,
    treatmentName: row.treatment_name,
    mode: row.mode,
    status: row.status,
    customerName: row.customer?.full_name ?? null,
  }))
}

export async function getTopSellingProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  limit = 5
): Promise<TopSellingProduct[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select('product_id, quantity, price_at_purchase_rm, product:products(name), order:orders!inner(payment_status, created_at)')
    .eq('order.payment_status', 'paid')
    .gte('order.created_at', startOfWeekISO())
  if (error) {
    console.error('[admin/topSelling] failed:', error.message)
    return []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[]
  const map = new Map<string, TopSellingProduct>()
  for (const r of rows) {
    if (!r.product_id || !r.product) continue
    const entry = map.get(r.product_id) ?? {
      productId: r.product_id,
      name: r.product.name,
      unitsSold: 0,
      revenueRm: 0,
    }
    entry.unitsSold += r.quantity
    entry.revenueRm += Number(r.price_at_purchase_rm) * r.quantity
    map.set(r.product_id, entry)
  }
  return Array.from(map.values()).sort((a, b) => b.unitsSold - a.unitsSold).slice(0, limit)
}

export async function getVaidyaUtilization(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>
): Promise<VaidyaUtilization> {
  const { data } = await supabase
    .from('appointments')
    .select('duration_mins')
    .gte('appointment_date_time', startOfWeekISO())
    .in('status', ['scheduled', 'completed'])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookedMinutes = ((data ?? []) as any[]).reduce(
    (s, r) => s + (r.duration_mins ?? 0),
    0
  )
  const percent = Math.min(100, Math.round((bookedMinutes / AVAILABLE_MINS_PER_WEEK) * 100))
  return { bookedMinutes, availableMinutes: AVAILABLE_MINS_PER_WEEK, percent }
}

export async function getActivePromos(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  limit = 5
): Promise<ActivePromo[]> {
  const nowISO = new Date().toISOString()
  const { data } = await supabase
    .from('promos')
    .select('id, code, title, expires_at')
    .eq('is_active', true)
    .lte('starts_at', nowISO)
    .or(`expires_at.is.null,expires_at.gt.${nowISO}`)
    .order('starts_at', { ascending: false })
    .limit(limit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    code: r.code,
    title: r.title,
    expiresAt: r.expires_at,
  }))
}

export async function getMostBookedTreatment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>
): Promise<MostBookedTreatment | null> {
  const { data } = await supabase
    .from('appointments')
    .select('treatment_name')
    .gte('appointment_date_time', startOfWeekISO())
    .in('status', ['scheduled', 'completed'])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[]
  if (rows.length === 0) return null
  const counts = new Map<string, number>()
  for (const r of rows) counts.set(r.treatment_name, (counts.get(r.treatment_name) ?? 0) + 1)
  const [name, bookings] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]
  return { name, bookings }
}

export async function getAgedPendingPayments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  limit = 5
): Promise<AgedPendingOrder[]> {
  const dayAgoISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('orders')
    .select('id, total_amount_rm, created_at, customer:users(full_name)')
    .eq('payment_status', 'pending')
    .lt('created_at', dayAgoISO)
    .order('created_at', { ascending: true })
    .limit(limit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    shortId: (r.id as string).slice(-6).toUpperCase(),
    totalRm: Number(r.total_amount_rm),
    createdAt: r.created_at,
    customerName: r.customer?.full_name ?? null,
  }))
}

export async function getDailyOrderCounts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  daysBack: number
): Promise<Array<{ date: string; count: number; revenue: number }>> {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - daysBack + 1)
  const { data } = await supabase
    .from('orders')
    .select('created_at, total_amount_rm, payment_status')
    .gte('created_at', start.toISOString())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[]
  const buckets = new Map<string, { count: number; revenue: number }>()
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    buckets.set(d.toISOString().slice(0, 10), { count: 0, revenue: 0 })
  }
  for (const r of rows) {
    const key = new Date(r.created_at).toISOString().slice(0, 10)
    const b = buckets.get(key)
    if (!b) continue
    b.count += 1
    if (r.payment_status === 'paid') b.revenue += Number(r.total_amount_rm)
  }
  return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }))
}

export async function getFulfilmentFunnel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>
): Promise<Array<{ stage: string; count: number }>> {
  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString()
  const { data } = await supabase
    .from('orders')
    .select('payment_status, fulfillment_status')
    .gte('created_at', since)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[]
  const stages = { 'Awaiting payment': 0, Processing: 0, Shipped: 0, Delivered: 0 }
  for (const r of rows) {
    if (r.fulfillment_status === 'cancelled') continue
    if (r.payment_status === 'pending') stages['Awaiting payment']++
    else if (r.fulfillment_status === 'processing') stages.Processing++
    else if (r.fulfillment_status === 'shipped') stages.Shipped++
    else if (r.fulfillment_status === 'delivered') stages.Delivered++
  }
  return Object.entries(stages).map(([stage, count]) => ({ stage, count }))
}
