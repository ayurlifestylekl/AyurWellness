import 'server-only'
import type { ServiceDb } from '@/lib/staff/guard'
import { normalizePhone } from '@/lib/staff/patients'
import type { BillItemKind, BillStatus } from './rules'

/**
 * Counter bills (20261123_counter_checkout.sql). Until that migration is
 * applied the tables don't exist: reads return null / [] and the checkout
 * pages say so instead of failing.
 */

function missingTable(error: { message: string; code?: string }): boolean {
  return error.code === '42P01' || error.code === 'PGRST205' || /(does not exist|Could not find the table)/.test(error.message)
}

export function isCheckoutMissing(error: { message: string; code?: string }): boolean {
  return missingTable(error)
}

function logError(where: string, error: { message: string; code?: string }) {
  if (!missingTable(error)) console.error(`[checkout] ${where}:`, error.message)
}

export interface BillItem {
  id: string
  kind: BillItemKind
  treatmentId: string | null
  productId: string | null
  packagePurchaseId: string | null
  description: string
  quantity: number
  unitPriceRm: number
  lineTotalRm: number
}

export interface Bill {
  id: string
  billNo: number
  status: BillStatus
  patientId: string | null
  appointmentId: string | null
  customerName: string
  customerPhone: string | null
  discountRm: number
  subtotalRm: number
  totalRm: number
  paymentMethod: string | null
  amountReceivedRm: number | null
  notes: string | null
  paidAt: string | null
  createdAt: string
  paidByName: string | null
  items: BillItem[]
}

const BILL_COLUMNS =
  'id, bill_no, status, patient_id, appointment_id, customer_name, customer_phone, discount_rm, subtotal_rm, total_rm, payment_method, amount_received_rm, notes, paid_at, created_at, paid_by_staff_id, counter_sale_items(id, kind, treatment_id, product_id, package_purchase_id, description, quantity, unit_price_rm, line_total_rm, created_at)'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBill(r: any, names: Map<string, string>): Bill {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = ((r.counter_sale_items ?? []) as any[])
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
    .map((i) => ({
      id: i.id,
      kind: i.kind as BillItemKind,
      treatmentId: i.treatment_id ?? null,
      productId: i.product_id ?? null,
      packagePurchaseId: i.package_purchase_id ?? null,
      description: i.description,
      quantity: i.quantity,
      unitPriceRm: Number(i.unit_price_rm),
      lineTotalRm: Number(i.line_total_rm),
    }))
  return {
    id: r.id,
    billNo: Number(r.bill_no),
    status: r.status as BillStatus,
    patientId: r.patient_id ?? null,
    appointmentId: r.appointment_id ?? null,
    customerName: r.customer_name,
    customerPhone: r.customer_phone ?? null,
    discountRm: Number(r.discount_rm),
    subtotalRm: Number(r.subtotal_rm),
    totalRm: Number(r.total_rm),
    paymentMethod: r.payment_method ?? null,
    amountReceivedRm: r.amount_received_rm != null ? Number(r.amount_received_rm) : null,
    notes: r.notes ?? null,
    paidAt: r.paid_at ?? null,
    createdAt: r.created_at,
    paidByName: r.paid_by_staff_id ? names.get(r.paid_by_staff_id) ?? null : null,
    items,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function withNames(db: ServiceDb, rows: any[]): Promise<Bill[]> {
  const ids = Array.from(new Set(rows.map((r) => r.paid_by_staff_id).filter(Boolean)))
  const names = new Map<string, string>()
  if (ids.length) {
    const { data } = await db.from('users').select('id, full_name').in('id', ids)
    for (const u of data ?? []) names.set(u.id, u.full_name || 'Staff')
  }
  return rows.map((r) => mapBill(r, names))
}

/** One bill with its lines; `undefined` when checkout isn't set up yet, null when not found. */
export async function getBill(db: ServiceDb, id: string): Promise<Bill | null | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const { data, error } = await db.from('counter_sales').select(BILL_COLUMNS).eq('id', id).maybeSingle()
  if (error) {
    logError('bill', error)
    return missingTable(error) ? undefined : null
  }
  return data ? (await withNames(db, [data]))[0] : null
}

export interface BillLists {
  ready: boolean
  open: Bill[]
  paidToday: Bill[]
}

/** Open bills (carts in progress) and bills paid since `sinceISO` (start of today). */
export async function listCounterBills(db: ServiceDb, sinceISO: string): Promise<BillLists> {
  const [open, paid] = await Promise.all([
    db.from('counter_sales').select(BILL_COLUMNS).eq('status', 'open').order('created_at', { ascending: false }).limit(50),
    db.from('counter_sales').select(BILL_COLUMNS).eq('status', 'paid').gte('paid_at', sinceISO).order('paid_at', { ascending: false }).limit(200),
  ])
  const err = open.error ?? paid.error
  if (err) {
    logError('bills', err)
    return { ready: !missingTable(err), open: [], paidToday: [] }
  }
  return { ready: true, open: await withNames(db, open.data ?? []), paidToday: await withNames(db, paid.data ?? []) }
}

/** A patient's or a visit's bills, newest first (paid and open; void left out). */
export async function listBillsFor(db: ServiceDb, by: { patientId?: string | null; appointmentIds?: string[] }): Promise<Bill[]> {
  const filters: string[] = []
  if (by.patientId) filters.push(`patient_id.eq.${by.patientId}`)
  const appts = (by.appointmentIds ?? []).filter((x) => /^[0-9a-f-]{36}$/i.test(x))
  if (appts.length) filters.push(`appointment_id.in.(${appts.join(',')})`)
  if (!filters.length) return []
  const { data, error } = await db
    .from('counter_sales')
    .select(BILL_COLUMNS)
    .or(filters.join(','))
    .neq('status', 'void')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) {
    logError('bills for', error)
    return []
  }
  return withNames(db, data ?? [])
}

export interface ProductOption {
  id: string
  name: string
  priceRm: number
  stock: number
  allowBackorder: boolean
  category: string
}

/** Products on sale in the shop, priced as the website shows them. */
export async function listSellableProducts(db: ServiceDb): Promise<ProductOption[]> {
  const { data, error } = await db
    .from('products')
    .select('id, name, price_rm, stock_qty, allow_backorder, category, status')
    .eq('status', 'active')
    .order('name', { ascending: true })
  if (error) {
    logError('products', error)
    return []
  }
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    priceRm: Number(p.price_rm),
    stock: p.stock_qty ?? 0,
    allowBackorder: !!p.allow_backorder,
    category: p.category || 'Products',
  }))
}

export interface PackageOption {
  id: string
  name: string
  ownerName: string
  sessionCount: number
  sessionsUsed: number
  expiresAt: string | null
}

/**
 * Active packages bought on this phone number (sessions can be shared with
 * family, so the phone is enough). Sites without packages get [].
 */
export async function listRedeemablePackages(db: ServiceDb, phone: string | null): Promise<PackageOption[]> {
  const norm = normalizePhone(phone)
  if (!norm) return []
  const { data, error } = await db
    .from('package_purchases')
    .select('id, package_name_snapshot, owner_name, owner_phone, session_count_snapshot, sessions_used, expires_at, status')
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .ilike('owner_phone', `*${norm.slice(-7).split('').join('*')}*`)
    .limit(20)
  if (error) {
    logError('packages', error)
    return []
  }
  return (data ?? [])
    .filter((p) => normalizePhone(p.owner_phone) === norm && p.sessions_used < p.session_count_snapshot)
    .map((p) => ({
      id: p.id,
      name: p.package_name_snapshot,
      ownerName: p.owner_name,
      sessionCount: p.session_count_snapshot,
      sessionsUsed: p.sessions_used,
      expiresAt: p.expires_at ?? null,
    }))
}
