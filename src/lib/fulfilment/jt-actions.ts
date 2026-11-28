'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireProductManagementSession } from '@/lib/product-management/actions'
import { matchWaybills, readTable } from './jt'
import { serviceDb } from './jt-server'

export interface WaybillMatch {
  orderNumber: string
  waybill: string
  orderId: string | null
  /** 'ready' = will be marked shipped; otherwise why not. */
  state: 'ready' | 'already_shipped' | 'not_found' | 'not_paid' | 'cancelled'
  recipient: string | null
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

const MAX_BYTES = 5 * 1024 * 1024

/** Reads J&T's export and shows which website orders each waybill belongs to. Nothing is changed yet. */
export async function previewJtWaybills(form: FormData): Promise<Result<WaybillMatch[]>> {
  await requireProductManagementSession()
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Choose the file exported from J&T.' }
  if (file.size > MAX_BYTES) return { ok: false, error: 'That file is too large (5 MB at most).' }

  const table = readTable(file.name, new Uint8Array(await file.arrayBuffer()))
  if ('error' in table) return { ok: false, error: table.error }
  const matched = matchWaybills(table)
  if ('error' in matched) return { ok: false, error: matched.error }

  const { data, error } = await serviceDb()
    .from('product_orders')
    .select('id, order_number, status, payment_status, tracking_number, product_order_addresses(name)')
    .in('order_number', matched.pairs.map((p) => p.orderNumber))
  if (error) return { ok: false, error: 'Could not look up the orders. Please try again.' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byNo = new Map((data ?? []).map((o: any) => [o.order_number, o]))

  return {
    ok: true,
    data: matched.pairs.map((p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const o: any = byNo.get(p.orderNumber)
      const addr = o ? (Array.isArray(o.product_order_addresses) ? o.product_order_addresses[0] : o.product_order_addresses) : null
      const state: WaybillMatch['state'] = !o
        ? 'not_found'
        : o.status === 'cancelled'
          ? 'cancelled'
          : o.payment_status !== 'paid'
            ? 'not_paid'
            : ['shipped', 'delivered'].includes(o.status)
              ? 'already_shipped'
              : 'ready'
      return { orderNumber: p.orderNumber, waybill: p.waybill, orderId: o?.id ?? null, state, recipient: addr?.name ?? null }
    }),
  }
}

const ApplySchema = z.array(z.object({ orderId: z.string().uuid(), waybill: z.string().trim().min(5).max(80) })).min(1).max(300)

/** Marks the matched orders shipped with J&T and their waybill numbers. */
export async function applyJtWaybills(raw: unknown): Promise<Result<{ shipped: number; skipped: number }>> {
  await requireProductManagementSession()
  const parsed = ApplySchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Nothing to update.' }
  const db = serviceDb()
  const now = new Date().toISOString()
  let shipped = 0
  for (const { orderId, waybill } of parsed.data) {
    // Same rule as "Mark shipped": only paid orders that are waiting to ship.
    const { data, error } = await db
      .from('product_orders')
      .update({ status: 'shipped', courier: 'J&T Express', tracking_number: waybill, shipped_at: now })
      .eq('id', orderId)
      .eq('payment_status', 'paid')
      .in('status', ['paid', 'processing'])
      .select('id')
    if (error) console.error('[jt] mark shipped failed', orderId, error.message)
    else shipped += data?.length ?? 0
  }
  revalidatePath('/product-management/fulfillment')
  revalidatePath('/product-management/orders')
  return { ok: true, data: { shipped, skipped: parsed.data.length - shipped } }
}
