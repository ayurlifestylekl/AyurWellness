'use server'

import { z } from 'zod'
import { createClient as createSb } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getPaymentProvider } from '@/lib/payments'
import { calculateShipping, getShippingZone } from '@/lib/shipping/zones'

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

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

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
}

const ShippingSchema = z.object({
  name: z.string().min(1, 'Full name is required.'),
  email: z.string().email('Valid email is required.'),
  phone: z.string().min(1, 'Phone number is required.'),
  line1: z.string().min(1, 'Address line 1 is required.'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required.'),
  postcode: z.string().min(1, 'Postcode is required.'),
  state: z.string().min(1, 'State is required.'),
  country: z.string().default('MY'),
})

const CartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
})

const CheckoutInputSchema = z.object({
  shipping: ShippingSchema,
  lines: z.array(CartLineSchema).min(1, 'Your cart is empty.'),
  guestCheckout: z.boolean().default(true),
  idempotencyKey: z.string().uuid(),
})

export interface CheckoutInput {
  shipping: z.infer<typeof ShippingSchema>
  lines: { productId: string; quantity: number }[]
  guestCheckout: boolean
  idempotencyKey: string
}

export interface CheckoutResult {
  orderId: string
  orderNumber: string
  billUrl: string
}

export async function createProductOrder(
  raw: unknown,
): Promise<ActionResult<CheckoutResult>> {
  const parsed = CheckoutInputSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const { shipping, lines, idempotencyKey } = parsed.data
  const sb = admin()

  // Idempotent order creation: return an existing checkout if the customer retries.
  const { data: existingOrder } = await sb
    .from('product_orders')
    .select('id, order_number, provider_bill_id, payment_url, status, payment_status')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  if (existingOrder) {
    if (existingOrder.status === 'paid' || existingOrder.payment_status === 'paid') {
      return {
        ok: true,
        data: {
          orderId: existingOrder.id,
          orderNumber: existingOrder.order_number,
          billUrl: `${siteUrl()}/checkout/success?order_id=${existingOrder.id}`,
        },
      }
    }
    if (existingOrder.payment_url) {
      return {
        ok: true,
        data: {
          orderId: existingOrder.id,
          orderNumber: existingOrder.order_number,
          billUrl: existingOrder.payment_url,
        },
      }
    }
    // Partially-created order without a bill; drop through to rebuild it.
    await sb.from('product_orders').delete().eq('id', existingOrder.id)
  }

  const me = await getCurrentUser()
  const isMember = !!me && me.role === 'customer'

  // Fetch the products the customer is buying. The cart stores the storefront
  // product id, which `rowToProduct` maps from the row's slug.
  const slugs = lines.map((l) => l.productId)
  const { data: products, error: productsError } = await sb
    .from('products')
    .select(
      'id, name, sku, slug, price_rm, sale_price_rm, member_price_rm, stock_qty, allow_backorder, status, weight_grams',
    )
    .in('slug', slugs)

  if (productsError) {
    console.error('[checkout] product lookup failed', productsError)
    return { ok: false, error: 'Could not load products. Please try again.' }
  }

  const productMap = new Map(products?.map((p) => [p.slug, p]))
  const orderItems: {
    product_id: string
    product_name: string
    product_sku: string | null
    quantity: number
    unit_price_rm: number
    line_total_rm: number
  }[] = []
  const reserveItems: { product_id: string; quantity: number; allow_backorder: boolean }[] = []

  let subtotal = 0
  let totalWeightGrams = 0
  for (const line of lines) {
    const p = productMap.get(line.productId)
    if (!p || p.status !== 'active') {
      return { ok: false, error: `Product ${line.productId} is no longer available.` }
    }

    const unitPrice =
      isMember && p.member_price_rm != null && Number(p.member_price_rm) > 0
        ? Number(p.member_price_rm)
        : p.sale_price_rm != null && Number(p.sale_price_rm) > 0
          ? Number(p.sale_price_rm)
          : Number(p.price_rm)

    const lineTotal = unitPrice * line.quantity
    subtotal += lineTotal
    totalWeightGrams += (p.weight_grams ? Number(p.weight_grams) : 0) * line.quantity

    orderItems.push({
      product_id: p.id,
      product_name: p.name,
      product_sku: p.sku,
      quantity: line.quantity,
      unit_price_rm: unitPrice,
      line_total_rm: lineTotal,
    })

    reserveItems.push({
      product_id: p.id,
      quantity: line.quantity,
      allow_backorder: p.allow_backorder ?? false,
    })
  }

  // Look up region-based shipping rate.
  const zone = await getShippingZone(sb, shipping.country)
  if (!zone) {
    return { ok: false, error: `We do not currently ship to ${shipping.country}.` }
  }
  const shippingQuote = calculateShipping(zone, subtotal, totalWeightGrams)
  const shippingRm = shippingQuote.rateRm
  const memberDiscount = 0 // reserved for future promo/voucher logic
  const total = Math.max(0, subtotal + shippingRm - memberDiscount)

  let orderId: string | null = null
  try {
    // Shipping address
    const { data: address, error: addressError } = await sb
      .from('product_order_addresses')
      .insert({
        name: shipping.name,
        email: shipping.email,
        phone: shipping.phone,
        line_1: shipping.line1,
        line_2: shipping.line2 ?? null,
        city: shipping.city,
        postcode: shipping.postcode,
        state: shipping.state,
        country: shipping.country,
      })
      .select('id')
      .single()

    if (addressError || !address) throw addressError ?? new Error('Address insert failed')

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)
    const provider = getPaymentProvider()
    const { data: order, error: orderError } = await sb
      .from('product_orders')
      .insert({
        order_number: (await sb.rpc('next_product_order_number')).data ?? 'ORD-TEMP',
        idempotency_key: idempotencyKey,
        customer_id: isMember ? me.authId : null,
        email: isMember ? (me.email ?? shipping.email) : shipping.email,
        phone: shipping.phone,
        status: 'awaiting_payment',
        payment_status: 'pending',
        payment_method: provider.name === 'hitpay' ? 'hitpay' : 'billplz',
        payment_provider: provider.name,
        subtotal_rm: subtotal,
        shipping_rm: shippingRm,
        member_discount_rm: memberDiscount,
        total_rm: total,
        shipping_address_id: address.id,
        shipping_zone_id: zone.id,
        shipping_country_code: shipping.country.toUpperCase(),
        total_weight_grams: totalWeightGrams,
        payment_expires_at: expiresAt.toISOString(),
      })
      .select('id, order_number')
      .single()

    if (orderError || !order) throw orderError ?? new Error('Order insert failed')
    orderId = order.id

    // Order line items
    const { error: itemsError } = await sb.from('product_order_items').insert(
      orderItems.map((item) => ({ ...item, product_order_id: order.id })),
    )
    if (itemsError) throw itemsError

    // Reserve stock atomically
    const { error: reserveError } = await sb.rpc('reserve_stock_for_product_order', {
      p_order_id: order.id,
      p_items: reserveItems,
    })
    if (reserveError) throw reserveError

    // Create payment bill
    const { billId, url } = await provider.createBill({
      appointmentId: order.order_number,
      amountRm: total,
      name: shipping.name,
      email: shipping.email,
      phone: shipping.phone,
      description: `Product order ${order.order_number}`,
      callbackUrl: `${siteUrl()}/api/payments/callback`,
      redirectUrl: `${siteUrl()}/checkout/success?order_id=${order.id}`,
    })

    // Persist bill reference
    const collectionId = process.env.HITPAY_COLLECTION_ID ?? null
    const { error: updateError } = await sb
      .from('product_orders')
      .update({
        provider_bill_id: billId,
        provider_collection_id: collectionId,
        payment_url: url,
      })
      .eq('id', order.id)

    if (updateError) throw updateError

    return {
      ok: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        billUrl: url,
      },
    }
  } catch (err) {
    console.error('[checkout] createProductOrder failed', err)
    if (orderId) {
      // Best-effort cleanup: release any reservation and cancel the order
      try {
        await sb.rpc('release_stock_for_product_order', { p_order_id: orderId })
      } catch (cleanupErr) {
        console.error('[checkout] cleanup release failed', cleanupErr)
      }
      try {
        await sb.from('product_orders').update({ status: 'cancelled' }).eq('id', orderId)
      } catch (cleanupErr) {
        console.error('[checkout] cleanup cancel failed', cleanupErr)
      }
    }
    return { ok: false, error: 'Checkout could not be completed. Please try again or WhatsApp us.' }
  }
}

const EstimateShippingSchema = z.object({
  countryCode: z.string().min(1, 'Country is required.'),
  lines: z.array(CartLineSchema).min(1, 'Your cart is empty.'),
})

export async function estimateShipping(
  raw: unknown,
): Promise<ActionResult<{ rateRm: number; zoneName: string; freeThresholdRm: number | null }>> {
  const parsed = EstimateShippingSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const { countryCode, lines } = parsed.data
  const sb = admin()
  const me = await getCurrentUser()
  const isMember = !!me && me.role === 'customer'

  const slugs = lines.map((l) => l.productId)
  const { data: products, error: productsError } = await sb
    .from('products')
    .select('slug, price_rm, sale_price_rm, member_price_rm, status, weight_grams')
    .in('slug', slugs)

  if (productsError || !products) {
    console.error('[checkout] estimate shipping product lookup failed', productsError)
    return { ok: false, error: 'Could not load products.' }
  }

  const productMap = new Map(products.map((p) => [p.slug, p]))
  let subtotal = 0
  let totalWeightGrams = 0
  for (const line of lines) {
    const p = productMap.get(line.productId)
    if (!p || p.status !== 'active') {
      return { ok: false, error: `Product ${line.productId} is not available.` }
    }
    const unitPrice =
      isMember && p.member_price_rm != null && Number(p.member_price_rm) > 0
        ? Number(p.member_price_rm)
        : p.sale_price_rm != null && Number(p.sale_price_rm) > 0
          ? Number(p.sale_price_rm)
          : Number(p.price_rm)
    subtotal += unitPrice * line.quantity
    totalWeightGrams += (p.weight_grams ? Number(p.weight_grams) : 0) * line.quantity
  }

  const zone = await getShippingZone(sb, countryCode)
  if (!zone) {
    return { ok: false, error: `We do not currently ship to ${countryCode}.` }
  }
  const quote = calculateShipping(zone, subtotal, totalWeightGrams)
  return {
    ok: true,
    data: {
      rateRm: quote.rateRm,
      zoneName: zone.name,
      freeThresholdRm: quote.freeThresholdRm,
    },
  }
}

const CancellationRequestSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(1, 'Please provide a reason.'),
})

export async function requestProductCancellation(raw: unknown): Promise<ActionResult> {
  const me = await getCurrentUser()
  if (!me) return { ok: false, error: 'You must be signed in to request a cancellation.' }

  const parsed = CancellationRequestSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  const { orderId, reason } = parsed.data

  const sb = admin()
  const { data: order } = await sb
    .from('product_orders')
    .select('id, status, payment_status, total_rm, customer_id, email')
    .eq('id', orderId)
    .single()

  if (!order) return { ok: false, error: 'Order not found.' }
  const isOwner = order.customer_id === me.authId || order.email === me.email
  if (!isOwner) return { ok: false, error: 'You can only cancel your own orders.' }

  if (order.status === 'cancelled' || order.status === 'refunded') {
    return { ok: false, error: 'This order has already been cancelled.' }
  }

  const { error: cancelError } = await sb.from('product_cancellations').insert({
    product_order_id: order.id,
    reason,
    status: 'requested',
  })
  if (cancelError) {
    // A partial unique index allows only one 'requested'/'processing' row
    // per order — a double-submit hits this instead of silently creating a
    // second cancellation request for the same order.
    if (cancelError.code === '23505') {
      return { ok: false, error: 'A cancellation request for this order is already pending.' }
    }
    console.error('[checkout] requestProductCancellation insert failed', cancelError)
    return { ok: false, error: 'Could not submit cancellation request.' }
  }

  if (order.payment_status === 'paid' || order.status === 'paid') {
    const { error: refundError } = await sb.from('product_refund_requests').insert({
      product_order_id: order.id,
      amount_rm: Number(order.total_rm),
      status: 'requested',
      customer_reason: reason,
      idempotency_key: `product-refund:${order.id}:full`,
    })
    if (refundError) {
      console.error('[checkout] requestProductCancellation refund insert failed', refundError)
      return { ok: false, error: 'Could not submit refund request.' }
    }
  }

  return { ok: true }
}
