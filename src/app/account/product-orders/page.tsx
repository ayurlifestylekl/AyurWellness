import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Package, ShoppingBag } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { listCustomerProductOrders } from '@/lib/product-management/queries'

export const metadata = { title: 'My Orders' }
export const dynamic = 'force-dynamic'

const fmt = (d: string) => new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))

const STATUS: Record<string, { label: string; cls: string }> = {
  awaiting_payment: { label: 'Awaiting payment', cls: 'bg-[#FBF6EC] text-[#8A6420] border-[#B58A3B]/25' },
  paid: { label: 'Being prepared', cls: 'bg-[#EDF4E7] text-[#006B3C] border-[#006B3C]/15' },
  processing: { label: 'Being packed', cls: 'bg-[#EDF4E7] text-[#006B3C] border-[#006B3C]/15' },
  shipped: { label: 'On its way', cls: 'bg-[#12372D] text-[#E4C384] border-transparent' },
  delivered: { label: 'Delivered', cls: 'bg-[#EDF4E7] text-[#006B3C] border-[#006B3C]/15' },
  cancelled: { label: 'Cancelled', cls: 'bg-[#F4ECE8] text-[#8A3B3B] border-[#8A3B3B]/15' },
  refunded: { label: 'Refunded', cls: 'bg-[#F1F2EC] text-[#12372D]/70 border-[#12372D]/10' },
}

export default async function AccountProductOrdersPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/auth/login?next=/account/product-orders')

  const orders = await listCustomerProductOrders(me.authId, me.email ?? '')

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header>
        <span className="inline-flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          <Package className="h-3.5 w-3.5" /> Apothecary
        </span>
        <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#12372D] sm:text-[36px]" style={{ letterSpacing: '-0.025em' }}>
          My orders. <span className="font-display font-normal italic text-[#12372D]/70">Herbal care, delivered.</span>
        </h1>
      </header>

      {orders.length === 0 ? (
        <section
          className="relative overflow-hidden rounded-[26px] border border-[#B58A3B]/15 bg-gradient-to-br from-[#F4ECDD] to-[#FAF6EE] p-8 text-center sm:p-12"
          style={{ boxShadow: '0 1px 2px rgba(18,55,45,0.05), 0 26px 50px -34px rgba(60,45,20,0.45)' }}
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#12372D] text-[#E4C384]">
            <ShoppingBag className="h-6 w-6" strokeWidth={1.7} />
          </span>
          <h2 className="mt-5 font-heading text-[20px] font-bold text-[#12372D]">No orders yet</h2>
          <p className="mx-auto mt-2 max-w-md font-body text-[14px] leading-relaxed text-[#12372D]/60">
            Our herbal oils and remedies are prepared by hand from classical formulations. When you order, you&apos;ll be able to follow
            each parcel here.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#12372D] px-5 font-heading text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#0E2C24]"
          >
            Explore remedies <ArrowRight className="h-4 w-4 text-[#E4C384]" />
          </Link>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((o) => {
            const s = STATUS[o.status] ?? { label: o.status.replace(/_/g, ' '), cls: 'bg-[#F1F2EC] text-[#12372D]/70 border-[#12372D]/10' }
            return (
              <li key={o.id}>
                <Link
                  href={`/account/product-orders/${o.id}`}
                  className="group flex items-center gap-4 rounded-[22px] border border-[#B58A3B]/15 bg-[#FBF7EE] p-4 transition hover:-translate-y-0.5 hover:border-[#B58A3B]/40 sm:p-5"
                  style={{ boxShadow: '0 1px 2px rgba(18,55,45,0.05), 0 20px 40px -32px rgba(60,45,20,0.45)' }}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4ECDD] text-[#8A6420]">
                    <Package className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-[15px] font-semibold text-[#12372D]">{o.order_number}</p>
                    <p className="mt-0.5 font-body text-[12.5px] text-[#12372D]/55">
                      {fmt(o.created_at)} · {o.item_count} item{o.item_count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-heading text-[15px] font-bold text-[#12372D]">RM {o.total_rm.toFixed(2)}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 font-heading text-[10.5px] font-semibold ${s.cls}`}>{s.label}</span>
                  </div>
                  <ArrowRight className="hidden h-4 w-4 shrink-0 text-[#12372D]/30 transition-transform group-hover:translate-x-0.5 group-hover:text-[#B58A3B] sm:block" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
