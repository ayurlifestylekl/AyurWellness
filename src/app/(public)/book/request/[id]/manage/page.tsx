import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import ManageBookingPanel from '@/components/booking/ManageBookingPanel'
import { canManageBooking } from '@/lib/booking/management-access'
import { getBookingManagementModel } from '@/lib/booking/management'

export const metadata: Metadata = {
  title: 'Manage booking — Ayurvedic Wellness Centre',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function ManageBookingPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { t?: string }
}) {
  const token = searchParams.t
  const model = await getBookingManagementModel(params.id, token)
  if (!model || !(await canManageBooking(params.id, model.customerId, token))) notFound()

  const tokenQuery = token ? `?t=${encodeURIComponent(token)}` : ''

  return (
    <section className="relative min-h-[70vh] overflow-hidden bg-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(55% 45% at 12% 0%, rgba(181,138,59,0.12) 0%, transparent 60%), radial-gradient(50% 40% at 100% 100%, rgba(0,107,60,0.07) 0%, transparent 65%)',
        }}
      />
      <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <Link
          href={`/book/request/${params.id}${tokenQuery}`}
          className="group inline-flex items-center gap-1.5 font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary/55 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
          Back to booking status
        </Link>
        <div className="mt-8">
          <ManageBookingPanel model={model} />
        </div>
      </div>
    </section>
  )
}
