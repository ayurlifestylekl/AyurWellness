import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient as createSb } from '@supabase/supabase-js'
import ClearCart from './ClearCart'

export const metadata: Metadata = {
  title: 'Order Confirmation | Kerala Ayurvedic Lifestyle',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

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

interface PageProps {
  searchParams: Promise<{ order_id?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { order_id } = await searchParams

  if (!order_id) {
    return <ErrorState message="Order reference is missing." />
  }

  const sb = admin()
  const { data: order, error } = await sb
    .from('product_orders')
    .select(
      'id, order_number, status, payment_status, total_rm, subtotal_rm, shipping_rm, paid_at, product_order_items(id, product_name, quantity, unit_price_rm, line_total_rm), product_order_addresses(name, line_1, line_2, city, postcode, state, country)',
    )
    .eq('id', order_id)
    .single()

  if (error || !order) {
    console.error('[checkout success] order lookup failed', error)
    return <ErrorState message="We couldn't find your order. Please check your email or contact us." />
  }

  const isPaid = order.status === 'paid' || order.payment_status === 'paid'

  const items = order.product_order_items as unknown as Array<{
    id: string
    product_name: string
    quantity: number
    unit_price_rm: number
    line_total_rm: number
  }>
  const address = (order.product_order_addresses as unknown as Array<{
    name: string
    line_1: string
    line_2: string | null
    city: string
    postcode: string
    state: string
    country: string
  }>)[0]

  return (
    <section className="relative min-h-screen bg-cream">
      <ClearCart />
      <div className="relative mx-auto max-w-2xl px-6 py-16 sm:py-24">
        <div className="rounded-3xl border border-[#12372D]/10 bg-white p-8 text-center shadow-sm">
          {isPaid ? (
            <CheckCircle2 className="mx-auto h-14 w-14 text-[#12372D]" />
          ) : (
            <AlertCircle className="mx-auto h-14 w-14 text-amber-600" />
          )}
          <h1 className="mt-5 font-heading text-[26px] font-bold text-[#12372D]">
            {isPaid ? 'Thank you for your order' : 'We are confirming your payment'}
          </h1>
          <p className="mx-auto mt-2 max-w-md font-body text-[14px] text-[#12372D]/65">
            {isPaid
              ? `Your order ${order.order_number} has been received and is being prepared.`
              : `Your order ${order.order_number} is still being confirmed. You will receive an email once payment is verified.`}
          </p>

          <div className="mt-6 text-left">
            <h2 className="font-heading text-[14px] font-bold uppercase tracking-wider text-[#12372D]/70">
              Order items
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between text-[13px]">
                  <span>
                    {item.product_name} × {item.quantity}
                  </span>
                  <span className="font-heading font-semibold text-[#12372D]">
                    RM {Number(item.line_total_rm).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-[#12372D]/10 pt-4 text-[13px]">
              <div className="flex justify-between text-[#12372D]/70">
                <span>Subtotal</span>
                <span>RM {Number(order.subtotal_rm).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#12372D]/70">
                <span>Shipping</span>
                <span>RM {Number(order.shipping_rm).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-heading text-[16px] font-bold text-[#12372D]">
                <span>Total</span>
                <span>RM {Number(order.total_rm).toFixed(2)}</span>
              </div>
            </div>

            {address && (
              <div className="mt-6 text-[13px] text-[#12372D]/65">
                <p className="font-semibold text-[#12372D]">Shipping to</p>
                <p>
                  {address.name}
                  <br />
                  {address.line_1}
                  {address.line_2 && <>, {address.line_2}</>}
                  <br />
                  {address.postcode} {address.city}, {address.state}, {address.country}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#12372D] px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-white hover:bg-[#12372D]/90"
            >
              Continue shopping
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#12372D]/20 bg-white px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-[#12372D] hover:bg-[#F7F2E8]/60"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="relative min-h-screen bg-cream">
      <div className="relative mx-auto max-w-2xl px-6 py-16 text-center sm:py-24">
        <h1 className="font-heading text-[26px] font-bold text-[#12372D]">Order not found</h1>
        <p className="mt-2 font-body text-[14px] text-[#12372D]/65">{message}</p>
        <Link
          href="/products"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#12372D] px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-white"
        >
          Shop products
        </Link>
      </div>
    </section>
  )
}
