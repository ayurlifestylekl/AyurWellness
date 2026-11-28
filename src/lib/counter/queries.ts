import 'server-only'
import type { ServiceDb } from '@/lib/staff/guard'
import { normalizePhone } from '@/lib/staff/patients'
import { balanceTotals, type BalanceKind, type BillItemKind, type BillStatus } from './rules'

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
  counterItemId: string | null
  description: string
  /** Printed under the line on the receipt, e.g. "Ayurvedic neck treatment" for a claim. */
  remark: string | null
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
  /** Paid from the patient's credit / deposit / gift card. */
  balanceUsedRm: number
  /** Left to pay later (added to the patient's outstanding). */
  outstandingRm: number
  /** Taken by the payment method. */
  amountPaidRm: number
  balanceUses: { kind: BalanceKind; amount: number }[]
  /** Customer's signature for a claim (PNG data URL), the name signed and when; null if not signed. */
  signature: { png: string; name: string; at: string } | null
}

const BILL_COLUMNS =
  'id, bill_no, status, patient_id, appointment_id, customer_name, customer_phone, discount_rm, subtotal_rm, total_rm, payment_method, amount_received_rm, notes, paid_at, created_at, paid_by_staff_id, balance_used_rm, outstanding_rm, amount_paid_rm, patient_balance_entries(kind, amount), counter_sale_items(id, kind, treatment_id, product_id, package_purchase_id, counter_item_id, description, remark, quantity, unit_price_rm, line_total_rm, created_at)'

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
      counterItemId: i.counter_item_id ?? null,
      description: i.description,
      remark: i.remark ?? null,
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
    balanceUsedRm: Number(r.balance_used_rm ?? 0),
    outstandingRm: Number(r.outstanding_rm ?? 0),
    amountPaidRm: Number(r.amount_paid_rm ?? 0),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    balanceUses: ((r.patient_balance_entries ?? []) as any[])
      .filter((e) => Number(e.amount) < 0 && e.kind !== 'outstanding')
      .map((e) => ({ kind: e.kind as BalanceKind, amount: -Number(e.amount) })),
    signature: null,
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
  if (!data) return null
  const bill = (await withNames(db, [data]))[0]
  // Signature columns arrive with 20261202_bill_signatures.sql; a bill reads fine without them.
  const { data: sig } = await db.from('counter_sales').select('signature_png, signed_name, signed_at').eq('id', id).maybeSingle()
  if (sig?.signature_png) bill.signature = { png: sig.signature_png, name: sig.signed_name ?? bill.customerName, at: sig.signed_at ?? bill.createdAt }
  return bill
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
  /** A billing item the centre added itself: no stock count. */
  untracked?: boolean
}

/** The price a product sells at: its sale price when one is set, as online checkout charges. */
export function sellingPrice(p: { price_rm: number | string; sale_price_rm?: number | string | null }): number {
  return p.sale_price_rm != null && Number(p.sale_price_rm) > 0 ? Number(p.sale_price_rm) : Number(p.price_rm)
}

/** Products on sale in the shop, priced as the website shows them. */
export async function listSellableProducts(db: ServiceDb): Promise<ProductOption[]> {
  const { data, error } = await db
    .from('products')
    .select('id, name, price_rm, sale_price_rm, stock_qty, allow_backorder, category, status')
    .eq('status', 'active')
    .order('name', { ascending: true })
  if (error) {
    logError('products', error)
    return []
  }
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    priceRm: sellingPrice(p),
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

export interface BalanceEntry {
  id: string
  kind: BalanceKind
  amount: number
  note: string | null
  paymentMethod: string | null
  saleId: string | null
  staffName: string | null
  createdAt: string
}

export interface PatientBalances {
  ready: boolean
  totals: Record<BalanceKind, number>
  entries: BalanceEntry[]
}

/** A saved patient's balances (credit, deposit, gift card, points, outstanding) and their history. */
export async function getPatientBalances(db: ServiceDb, patientId: string): Promise<PatientBalances> {
  const empty = balanceTotals([])
  if (!/^[0-9a-f-]{36}$/i.test(patientId)) return { ready: true, totals: empty, entries: [] }
  const { data, error } = await db
    .from('patient_balance_entries')
    .select('id, kind, amount, note, payment_method, sale_id, staff_id, created_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  if (error) {
    logError('balances', error)
    return { ready: !missingTable(error), totals: empty, entries: [] }
  }
  const rows = data ?? []
  const ids = Array.from(new Set(rows.map((r) => r.staff_id).filter(Boolean)))
  const names = new Map<string, string>()
  if (ids.length) {
    const { data: users } = await db.from('users').select('id, full_name').in('id', ids)
    for (const u of users ?? []) names.set(u.id, u.full_name || 'Staff')
  }
  const entries = rows.map((r) => ({
    id: r.id,
    kind: r.kind as BalanceKind,
    amount: Number(r.amount),
    note: r.note ?? null,
    paymentMethod: r.payment_method ?? null,
    saleId: r.sale_id ?? null,
    staffName: r.staff_id ? names.get(r.staff_id) ?? null : null,
    createdAt: r.created_at,
  }))
  return { ready: true, totals: balanceTotals(entries), entries }
}
