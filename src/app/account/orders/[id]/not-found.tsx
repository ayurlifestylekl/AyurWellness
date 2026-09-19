import Link from 'next/link'
import { Package, ArrowRight } from 'lucide-react'

export default function OrderNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12 text-center sm:py-16">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#006B3C]/[0.06]">
        <Package className="h-6 w-6 text-[#006B3C]" strokeWidth={1.6} />
      </span>
      <h1
        className="mt-5 font-heading text-[22px] font-bold text-[#006B3C]"
        style={{ letterSpacing: '-0.02em' }}
      >
        Order not found.
      </h1>
      <p
        className="mt-2 font-body text-[13.5px] text-[#12372D]/65"
        style={{ lineHeight: 1.6 }}
      >
        We couldn&apos;t find that order. It may have been removed, or the link
        might belong to someone else.
      </p>
      <Link
        href="/account/orders"
        className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[#B58A3B] px-6 py-3 font-heading text-[12.5px] font-bold uppercase tracking-[0.16em] text-[#12372D] transition-all hover:bg-[#B58A3B] active:scale-[0.98]"
      >
        Back to my orders
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </div>
  )
}
