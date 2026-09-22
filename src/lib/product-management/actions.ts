'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient as createSb } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getProviderByName } from '@/lib/payments'
import { requestProviderRefund, productRefundDependencies } from '@/lib/payments/refund'
import { ProviderRefundError } from '@/lib/payments/provider'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

/**
 * Product Management has its own account (role: product_manager) and its own
 * login, separate from the general admin portal — an admin can act here too,
 * but this must NOT be admin-only, or a product_manager could sign in and see
 * these screens yet get "Not authorised" the instant they click Approve.
 */
export async function requireProductManagementSession() {
  const me = await getCurrentUser()
  if (!me || (me.role !== 'admin' && me.role !== 'product_manager')) throw new Error('Not authorised.')
  return me
}

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

const UpdateStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(['paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  trackingNumber: z.string().optional(),
  courier: z.string().optional(),
  notes: z.string().optional(),
})

export async function updateProductOrderStatus(raw: unknown): Promise<ActionResult> {
  await requireProductManagementSession()
  const parsed = UpdateStatusSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  const { orderId, status, trackingNumber, courier, notes } = parsed.data

  const sb = admin()
  const update: Record<string, unknown> = { status }
  if (status === 'shipped') {
    if (trackingNumber) update.tracking_number = trackingNumber
    if (courier) update.courier = courier
    update.shipped_at = new Date().toISOString()
  }
  if (status === 'delivered') update.delivered_at = new Date().toISOString()
  if (status === 'cancelled') update.cancelled_at = new Date().toISOString()
  if (notes) update.internal_notes = notes

  const { error } = await sb.from('product_orders').update(update).eq('id', orderId)
  if (error) {
    console.error('[product-management] updateProductOrderStatus failed', error)
    return { ok: false, error: 'Could not update order status.' }
  }

  revalidatePath('/product-management/orders')
  revalidatePath(`/product-management/orders/${orderId}`)
  return { ok: true }
}

const ApproveCancellationSchema = z.object({
  cancellationId: z.string().uuid(),
  staffReason: z.string().optional(),
  bankCode: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountHolderName: z.string().optional(),
})

export async function approveProductCancellation(
  raw: unknown,
): Promise<ActionResult<{ refundNeedsAttention: boolean }>> {
  await requireProductManagementSession()
  const parsed = ApproveCancellationSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  const { cancellationId, staffReason, bankCode, bankAccountNumber, bankAccountHolderName } = parsed.data

  const sb = admin()
  const { data: cancellation } = await sb
    .from('product_cancellations')
    .select('*, product_orders(*)')
    .eq('id', cancellationId)
    .single()

  if (!cancellation) return { ok: false, error: 'Cancellation request not found.' }

  const order = Array.isArray(cancellation.product_orders)
    ? cancellation.product_orders[0]
    : cancellation.product_orders
  if (!order) return { ok: false, error: 'Order not found.' }

  if (order.status === 'cancelled' || order.status === 'refunded') {
    return { ok: false, error: 'Order is already cancelled.' }
  }

  // Guard A — atomically claim the cancellation before any side effect. This
  // is what makes a double-click (or two staff approving at once) safe: only
  // one caller can win this update, so only one caller ever reaches the stock
  // RPCs and the provider refund call below. `restore_stock_for_product_order`
  // in particular is NOT idempotent — it re-derives from stock_movements and
  // inserts a fresh 'returned' row every time it's called.
  if (cancellation.status !== 'requested') {
    return { ok: false, error: 'This cancellation has already been processed.' }
  }
  const { data: claimedRows, error: claimError } = await sb
    .from('product_cancellations')
    .update({ status: 'processing' })
    .eq('id', cancellationId)
    .eq('status', 'requested')
    .select('id')
  if (claimError) {
    console.error('[product-management] claim cancellation failed', claimError)
    return { ok: false, error: 'Could not claim cancellation for processing.' }
  }
  if (!claimedRows?.length) {
    return { ok: false, error: 'This cancellation was already processed by someone else. Please refresh.' }
  }

  const isPaid = order.status === 'paid' || order.payment_status === 'paid'

  // Restore or release stock
  if (isPaid) {
    const { error: restoreError } = await sb.rpc('restore_stock_for_product_order', {
      p_order_id: order.id,
      p_reason: staffReason || 'Cancellation approved by staff',
    })
    if (restoreError) {
      console.error('[product-management] restore stock failed', restoreError)
      return { ok: false, error: 'Could not restore stock for cancellation.' }
    }
  } else {
    const { error: releaseError } = await sb.rpc('release_stock_for_product_order', {
      p_order_id: order.id,
    })
    if (releaseError) {
      console.error('[product-management] release stock failed', releaseError)
      return { ok: false, error: 'Could not release reserved stock.' }
    }
    // Void the open bill so it can never be paid
    if (order.provider_bill_id && order.payment_provider) {
      try {
        const provider = getProviderByName(order.payment_provider)
        if (provider?.deleteBill) await provider.deleteBill(order.provider_bill_id)
      } catch (e) {
        console.error('[product-management] void bill failed', e)
      }
    }
  }

  // Guard B — if the order was paid, route the refund through the shared
  // refund engine (same claim/complete semantics booking refunds already
  // have) instead of calling provider.createRefund() directly.
  // `refundSucceeded` gates whether the order is honestly marked 'refunded'
  // below — a thrown/skipped refund must never be reported as money moved.
  let refundSucceeded = false
  let refundNeedsAttention = false

  if (isPaid) {
    const idempotencyKey = `product-refund:${order.id}:full`
    let { data: refundRow } = await sb
      .from('product_refund_requests')
      .select('id, idempotency_key')
      .eq('product_order_id', order.id)
      .maybeSingle()

    if (!refundRow) {
      const ins = await sb.from('product_refund_requests').insert({
        product_order_id: order.id,
        product_cancellation_id: cancellationId,
        amount_rm: order.total_rm,
        status: 'requested',
        idempotency_key: idempotencyKey,
        bank_code: bankCode || null,
        bank_account_number: bankAccountNumber || null,
        bank_account_holder_name: bankAccountHolderName || null,
        staff_reason: staffReason || null,
      }).select('id, idempotency_key').single()
      if (ins.error || !ins.data) {
        console.error('[product-management] create refund request failed', ins.error)
        return { ok: false, error: 'Could not create refund record.' }
      }
      refundRow = ins.data
    } else {
      await sb.from('product_refund_requests').update({
        idempotency_key: refundRow.idempotency_key ?? idempotencyKey,
        product_cancellation_id: cancellationId,
        bank_code: bankCode || null,
        bank_account_number: bankAccountNumber || null,
        bank_account_holder_name: bankAccountHolderName || null,
        staff_reason: staffReason || null,
      }).eq('id', refundRow.id)
    }

    if (!order.provider_bill_id || !order.payment_provider) {
      // Nothing to call automatically — e.g. an order manually marked "paid"
      // for an offline sale, with no provider bill behind it. Mark the
      // refund row as needing a human instead of leaving it silently
      // 'claimed' forever with no path to resolve and no staff visibility.
      await sb.from('product_refund_requests').update({
        status: 'exception',
        failure_reason: 'Order has no payment provider on file — refund must be processed manually.',
      }).eq('id', refundRow.id)
      refundNeedsAttention = true
    } else {
      const { data: claimedRefund } = await sb
        .from('product_refund_requests')
        .update({ status: 'claimed' })
        .eq('id', refundRow.id)
        .eq('status', 'requested')
        .select('id')

      if (claimedRefund?.length) {
        try {
          await requestProviderRefund({
            refundId: refundRow.id,
            billId: order.provider_bill_id,
            amountRm: Number(order.total_rm),
            idempotencyKey: refundRow.idempotency_key ?? idempotencyKey,
            customerEmail: order.email,
            bank: bankCode
              ? { bankCode, accountNumber: bankAccountNumber ?? '', accountHolderName: bankAccountHolderName ?? '' }
              : undefined,
          }, productRefundDependencies())
          refundSucceeded = true
        } catch (e) {
          // requestProviderRefund already persisted the terminal state
          // ('exception' on a definitive failure, retryable otherwise) — the
          // cancellation still completes below; a failed refund surfaces in
          // the "Refunds in progress" view for staff to resolve manually
          // rather than leaving stock/order state stuck in limbo. It must
          // NOT be reported to the order as 'refunded' though.
          const category = e instanceof ProviderRefundError ? e.category : 'ambiguous'
          console.error('[product-management] provider refund failed', category, e)
          refundNeedsAttention = true
        }
      } else {
        // Row was already claimed/advanced by something else (reconciliation
        // sweep, a concurrent action) between the insert/update above and
        // here — treat as in-flight rather than a fresh failure, but don't
        // claim success for a call we never made.
        refundNeedsAttention = true
      }
    }
  }

  const { error: cancelError } = await sb
    .from('product_orders')
    .update({
      status: 'cancelled',
      payment_status: isPaid ? (refundSucceeded ? 'refunded' : 'paid') : 'failed',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', order.id)
  if (cancelError) {
    console.error('[product-management] cancel order failed', cancelError)
    return { ok: false, error: 'Could not cancel order.' }
  }

  const { error: updateError } = await sb
    .from('product_cancellations')
    .update({ status: 'approved', decided_at: new Date().toISOString(), staff_reason: staffReason || null })
    .eq('id', cancellationId)
    .eq('status', 'processing')
  if (updateError) {
    console.error('[product-management] approve cancellation failed', updateError)
    return { ok: false, error: 'Could not approve cancellation.' }
  }

  revalidatePath('/product-management/cancellations')
  revalidatePath('/product-management/orders')
  return { ok: true, data: refundNeedsAttention ? { refundNeedsAttention: true } : undefined }
}

const RejectCancellationSchema = z.object({
  cancellationId: z.string().uuid(),
  staffReason: z.string().min(1, 'Please provide a reason.'),
})

export async function rejectProductCancellation(raw: unknown): Promise<ActionResult> {
  await requireProductManagementSession()
  const parsed = RejectCancellationSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  const { cancellationId, staffReason } = parsed.data

  const sb = admin()
  // Guard C — same claim discipline as approve, so a reject can't race an
  // in-flight approve and silently overwrite its outcome.
  const { data: rejectedRows, error } = await sb
    .from('product_cancellations')
    .update({ status: 'rejected', decided_at: new Date().toISOString(), staff_reason: staffReason })
    .eq('id', cancellationId)
    .eq('status', 'requested')
    .select('id')

  if (error) {
    console.error('[product-management] reject cancellation failed', error)
    return { ok: false, error: 'Could not reject cancellation.' }
  }
  if (!rejectedRows?.length) {
    return { ok: false, error: 'This cancellation has already been processed.' }
  }

  revalidatePath('/product-management/cancellations')
  return { ok: true }
}
