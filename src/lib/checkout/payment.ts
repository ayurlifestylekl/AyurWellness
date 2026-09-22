import 'server-only'
import { createClient as createSb } from '@supabase/supabase-js'
import { getPaymentProvider, getProviderByName } from '@/lib/payments'

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

type PaymentHandlingResult =
  | { ok: true; state: 'confirmed' | 'already_confirmed' | 'not_found' }
  | { ok: false; state: 'error'; message: string }

/**
 * Mark a product order as paid by its provider bill id. Idempotent.
 */
export async function markProductBillPaid(billId: string): Promise<PaymentHandlingResult> {
  const sb = admin()

  const { data: order } = await sb
    .from('product_orders')
    .select('id, status, payment_status, total_rm')
    .eq('provider_bill_id', billId)
    .maybeSingle()

  if (!order) return { ok: true, state: 'not_found' }
  if (order.status !== 'awaiting_payment') {
    return { ok: true, state: 'already_confirmed' }
  }

  const { error: finalizeError } = await sb.rpc('finalize_stock_for_product_order', {
    p_order_id: order.id,
  })
  if (finalizeError) {
    console.error('[checkout payment] finalize stock failed', finalizeError)
    return { ok: false, state: 'error', message: 'Could not finalize stock.' }
  }

  const { error: updateError } = await sb
    .from('product_orders')
    .update({
      status: 'paid',
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', order.id)

  if (updateError) {
    console.error('[checkout payment] update order failed', updateError)
    return { ok: false, state: 'error', message: 'Could not update order status.' }
  }

  return { ok: true, state: 'confirmed' }
}

/**
 * Reconcile a product order against the provider's API.
 */
export async function reconcileProductOrderByBill(
  billId: string,
  providerName?: string | null,
): Promise<PaymentHandlingResult> {
  const provider =
    providerName !== undefined && providerName !== null
      ? getProviderByName(providerName)
      : getPaymentProvider()
  if (!provider?.fetchBillStatus) return { ok: false, state: 'error', message: 'Provider not queryable.' }

  const status = await provider.fetchBillStatus(billId).catch(() => null)
  if (!status) return { ok: false, state: 'error', message: 'Provider status unavailable.' }
  if (!status.paid) return { ok: true, state: 'not_found' }
  return markProductBillPaid(billId)
}
