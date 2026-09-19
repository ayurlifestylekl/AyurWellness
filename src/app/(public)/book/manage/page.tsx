import type { Metadata } from 'next'
import Link from 'next/link'
import GuestBookingRecovery from '@/components/booking/GuestBookingRecovery'
import { hasActiveManagementGrant } from '@/lib/booking/management-access'

export const metadata: Metadata = {
  title: 'Manage your booking — Ayurvedic Wellness Centre',
  description: 'Securely recover access to a guest booking.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function ManageBookingPage({ searchParams }: { searchParams: { t?: string } }) {
  const recovered = searchParams.t ? await hasActiveManagementGrant(searchParams.t) : false
  return (
    <section className="min-h-[70vh] bg-cream">
      <div className="mx-auto max-w-xl px-6 py-14 sm:py-20">
        <Link href="/book" className="font-heading text-xs font-semibold uppercase tracking-[0.18em] text-primary/60 hover:text-primary">
          ← Back to booking
        </Link>
        <div className="mb-7 mt-6">
          <p className="font-heading text-xs font-bold uppercase tracking-[0.22em] text-accent">Guest booking</p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold text-primary">Manage your booking</h1>
          <p className="mt-3 font-body text-dark/70">Recover your private management link without creating an account.</p>
        </div>
        <GuestBookingRecovery recovered={recovered} />
      </div>
    </section>
  )
}
