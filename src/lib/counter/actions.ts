'use server'

import { z } from 'zod'
import { requireStaff, type ServiceDb } from '@/lib/staff/guard'
import { getAppointmentDetail } from '@/lib/staff/appointments'
import { findPatientRecordFor, getPatientRecord, normalizePhone } from '@/lib/staff/patients'
import { checkoutErrorMessage, isPaymentMethod, toSen } from './rules'
import { listRedeemablePackages } from './queries'

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

const uuid = z.string().uuid()
const STAFF: ('admin' | 'front_desk')[] = ['admin', 'front_desk']
const GENERIC = 'Something went wrong. Please try again.'

function fail(where: string, error: { message: string } | null | undefined, fallback: string): { ok: false; error: string } {
  if (error) console.error(`[counter] ${where}:`, error.message)
  const msg = error ? checkoutErrorMessage(error.message) : fallback
  return { ok: false, error: msg === GENERIC ? fallback : msg }
}

async function openBill(db: ServiceDb, billId: string) {
  const { data } = await db.from('counter_sales').select('id, status, customer_phone, appointment_id').eq('id', billId).maybeSingle()
  return data && data.status === 'open' ? data : null
}

/**
 * Start a bill for a saved patient, a visit (its therapy is added when it
 * wasn't paid online), or a walk-in by name. A visit that already has an open
 * bill gets that bill back instead of a second one.
 */
export async function createBill(raw: unknown): Promise<Result<{ id: string }>> {
  const { db, userId } = await requireStaff(STAFF)
  const parsed = z
    .object({
      patientId: uuid.optional(),
      appointmentId: uuid.optional(),
      customerName: z.string().trim().max(120).optional(),
      customerPhone: z.string().trim().max(30).optional(),
    })
    .safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Choose who the bill is for.' }
  const v = parsed.data

  let patientId: string | null = null
  let appointmentId: string | null = null
  let name = v.customerName?.trim() || ''
  let phone = v.customerPhone?.trim() || null
  let firstLine: { treatment_id: string | null; description: string; unit_price_rm: number } | null = null
  let notes: string | null = null

  if (v.appointmentId) {
    const { data: existing, error: exErr } = await db
      .from('counter_sales')
      .select('id')
      .eq('appointment_id', v.appointmentId)
      .eq('status', 'open')
      .limit(1)
      .maybeSingle()
    if (exErr) return fail('existing bill', exErr, 'Checkout isn’t set up yet. Please ask your developer to finish the setup.')
    if (existing) return { ok: true, id: existing.id }
    const a = await getAppointmentDetail(db, v.appointmentId)
    if (!a) return { ok: false, error: 'Visit not found.' }
    appointmentId = a.id
    name = a.patientName ?? 'Guest'
    phone = a.patientPhone ?? null
    patientId = (await findPatientRecordFor(db, a))?.id ?? null
    const { data: row } = await db
      .from('appointments')
      .select('booking_kind, treatment_id, treatment_name, payable_amount_rm, payment_status')
      .eq('id', a.id)
      .maybeSingle()
    if (row?.payment_status === 'paid') {
      notes = 'Therapy already paid online.'
    } else if (row && row.booking_kind !== 'consultation' && row.treatment_name) {
      let price = row.payable_amount_rm != null ? Number(row.payable_amount_rm) : null
      if (price == null && row.treatment_id) {
        const { data: t } = await db.from('treatments').select('price_rm').eq('id', row.treatment_id).maybeSingle()
        price = t?.price_rm != null ? Number(t.price_rm) : null
      }
      firstLine = { treatment_id: row.treatment_id ?? null, description: String(row.treatment_name).slice(0, 200), unit_price_rm: price ?? 0 }
    }
  } else if (v.patientId) {
    const r = await getPatientRecord(db, v.patientId)
    if (!r) return { ok: false, error: 'Patient not found.' }
    patientId = r.id
    name = r.fullName
    phone = r.phone
  }

  if (name.length < 1) return { ok: false, error: 'Enter the customer’s name.' }
  if (phone && !normalizePhone(phone)) phone = null
  // A walk-in who is already a saved patient (same phone + first name) is linked to their record.
  if (!patientId && phone) patientId = (await findPatientRecordFor(db, { patientPhone: phone, customerId: null, patientName: name }))?.id ?? null

  const { data: bill, error } = await db
    .from('counter_sales')
    .insert({ patient_id: patientId, appointment_id: appointmentId, customer_name: name.slice(0, 120), customer_phone: phone, notes, created_by_staff_id: userId })
    .select('id')
    .single()
  if (error || !bill) return fail('create', error, 'Checkout isn’t set up yet. Please ask your developer to finish the setup.')

  if (firstLine) {
    const { error: itemErr } = await db.from('counter_sale_items').insert({ sale_id: bill.id, kind: 'service', quantity: 1, ...firstLine })
    if (itemErr) console.error('[counter] first line:', itemErr.message)
  }
  return { ok: true, id: bill.id }
}

const AddItem = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('service'), treatmentId: uuid }),
  z.object({ kind: z.literal('product'), productId: uuid }),
  z.object({ kind: z.literal('package'), packagePurchaseId: uuid }),
])

/** Add a service, product or package session. Products and packages already on the bill go up by one. */
export async function addBillItem(billId: string, raw: unknown): Promise<Result> {
  const { db } = await requireStaff(STAFF)
  const parsed = AddItem.safeParse(raw)
  if (!uuid.safeParse(billId).success || !parsed.success) return { ok: false, error: 'Choose an item to add.' }
  const bill = await openBill(db, billId)
  if (!bill) return { ok: false, error: 'This bill is already paid, so it can’t be changed.' }
  const item = parsed.data

  if (item.kind === 'service') {
    const { data: t } = await db.from('treatments').select('id, title, price_rm').eq('id', item.treatmentId).maybeSingle()
    if (!t) return { ok: false, error: 'That therapy is no longer listed.' }
    const { error } = await db
      .from('counter_sale_items')
      .insert({ sale_id: billId, kind: 'service', treatment_id: t.id, description: String(t.title).slice(0, 200), quantity: 1, unit_price_rm: t.price_rm != null ? Number(t.price_rm) : 0 })
    return error ? fail('add service', error, 'Could not add the therapy.') : { ok: true }
  }

  if (item.kind === 'product') {
    const { data: p } = await db.from('products').select('id, name, price_rm, status').eq('id', item.productId).maybeSingle()
    if (!p || p.status !== 'active') return { ok: false, error: 'That product isn’t on sale.' }
    const { data: same } = await db.from('counter_sale_items').select('id, quantity').eq('sale_id', billId).eq('product_id', p.id).maybeSingle()
    const { error } = same
      ? await db.from('counter_sale_items').update({ quantity: Math.min(99, same.quantity + 1) }).eq('id', same.id)
      : await db.from('counter_sale_items').insert({ sale_id: billId, kind: 'product', product_id: p.id, description: String(p.name).slice(0, 200), quantity: 1, unit_price_rm: Number(p.price_rm) })
    return error ? fail('add product', error, 'Could not add the product.') : { ok: true }
  }

  // Package session: only this customer's own active packages, never more sessions than are left.
  const pkg = (await listRedeemablePackages(db, bill.customer_phone)).find((p) => p.id === item.packagePurchaseId)
  if (!pkg) return { ok: false, error: 'That package can’t be used on this bill.' }
  const left = pkg.sessionCount - pkg.sessionsUsed
  const { data: same } = await db.from('counter_sale_items').select('id, quantity').eq('sale_id', billId).eq('package_purchase_id', pkg.id).maybeSingle()
  if ((same?.quantity ?? 0) >= left) return { ok: false, error: `Only ${left} session${left === 1 ? '' : 's'} left on this package.` }
  const { error } = same
    ? await db.from('counter_sale_items').update({ quantity: same.quantity + 1 }).eq('id', same.id)
    : await db
        .from('counter_sale_items')
        .insert({ sale_id: billId, kind: 'package', package_purchase_id: pkg.id, description: `${pkg.name} — session redeemed`.slice(0, 200), quantity: 1, unit_price_rm: 0 })
  return error ? fail('add package', error, 'Could not redeem the session.') : { ok: true }
}

/** Change a line's quantity or price (package sessions stay free). */
export async function updateBillItem(itemId: string, raw: unknown): Promise<Result> {
  const { db } = await requireStaff(STAFF)
  const parsed = z.object({ quantity: z.number().int().min(1).max(99).optional(), unitPriceRm: z.number().min(0).max(1_000_000).optional() }).safeParse(raw)
  if (!uuid.safeParse(itemId).success || !parsed.success) return { ok: false, error: 'Enter a valid quantity and price.' }
  const { data: line } = await db.from('counter_sale_items').select('id, sale_id, kind, package_purchase_id').eq('id', itemId).maybeSingle()
  if (!line) return { ok: false, error: 'That line is no longer on the bill.' }
  const patch: Record<string, number> = {}
  if (parsed.data.quantity != null) patch.quantity = parsed.data.quantity
  if (parsed.data.unitPriceRm != null && line.kind !== 'package') patch.unit_price_rm = toSen(parsed.data.unitPriceRm) / 100
  if (line.kind === 'package' && patch.quantity != null) {
    const bill = await openBill(db, line.sale_id)
    const pkg = bill ? (await listRedeemablePackages(db, bill.customer_phone)).find((p) => p.id === line.package_purchase_id) : null
    const left = pkg ? pkg.sessionCount - pkg.sessionsUsed : 0
    if (patch.quantity > left) return { ok: false, error: `Only ${left} session${left === 1 ? '' : 's'} left on this package.` }
  }
  if (!Object.keys(patch).length) return { ok: true }
  const { error } = await db.from('counter_sale_items').update(patch).eq('id', itemId)
  return error ? fail('update line', error, 'Could not change that line.') : { ok: true }
}

export async function removeBillItem(itemId: string): Promise<Result> {
  const { db } = await requireStaff(STAFF)
  if (!uuid.safeParse(itemId).success) return { ok: false, error: 'That line is no longer on the bill.' }
  const { error } = await db.from('counter_sale_items').delete().eq('id', itemId)
  return error ? fail('remove line', error, 'Could not remove that line.') : { ok: true }
}

/** Bill-level discount (RM) and note. */
export async function updateBill(billId: string, raw: unknown): Promise<Result> {
  const { db } = await requireStaff(STAFF)
  const parsed = z
    .object({ discountRm: z.number().min(0).max(1_000_000).optional(), notes: z.string().trim().max(500).nullable().optional() })
    .safeParse(raw)
  if (!uuid.safeParse(billId).success || !parsed.success) return { ok: false, error: 'Enter a valid discount.' }
  if (!(await openBill(db, billId))) return { ok: false, error: 'This bill is already paid, so it can’t be changed.' }
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (parsed.data.discountRm != null) patch.discount_rm = toSen(parsed.data.discountRm) / 100
  if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes || null
  const { error } = await db.from('counter_sales').update(patch).eq('id', billId).eq('status', 'open')
  return error ? fail('update bill', error, 'Could not save the change.') : { ok: true }
}

/** Throw away an unpaid bill. Paid bills are records and stay. */
export async function deleteBill(billId: string): Promise<Result> {
  const { db } = await requireStaff(STAFF)
  if (!uuid.safeParse(billId).success) return { ok: false, error: 'Bill not found.' }
  const { data, error } = await db.from('counter_sales').delete().eq('id', billId).eq('status', 'open').select('id')
  if (error) return fail('delete', error, 'Could not delete the bill.')
  return data?.length ? { ok: true } : { ok: false, error: 'Only unpaid bills can be deleted.' }
}

/** Take payment: stock, package sessions and the bill are settled together, or not at all. */
export async function payBill(billId: string, raw: unknown): Promise<Result> {
  const { db, userId } = await requireStaff(STAFF)
  const parsed = z.object({ method: z.string().nullable(), receivedRm: z.number().min(0).max(1_000_000).nullable() }).safeParse(raw)
  if (!uuid.safeParse(billId).success || !parsed.success) return { ok: false, error: 'Choose how the customer is paying.' }
  const { method, receivedRm } = parsed.data
  if (method !== null && !isPaymentMethod(method)) return { ok: false, error: 'Choose how the customer is paying.' }
  const { error } = await db.rpc('complete_counter_sale', {
    p_sale_id: billId,
    p_staff_id: userId,
    p_method: method,
    p_received: receivedRm,
  })
  return error ? fail('pay', error, 'Payment could not be recorded. Please try again.') : { ok: true }
}
