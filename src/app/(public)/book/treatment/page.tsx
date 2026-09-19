import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'

import BookingPolicyStrip from '@/components/booking/BookingPolicyStrip'
import BookingTreatmentOrchestrator from '@/components/booking/BookingTreatmentOrchestrator'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import {
  getTreatmentCategoriesIndex,
  getTreatmentsFlat,
} from '@/lib/storefront/treatments'
import { getBookingForEdit } from '@/lib/booking/actions'
import type { Treatment, TreatmentCategory } from '@/types/treatments'

export const metadata: Metadata = {
  title: 'Book a Treatment — traditional Ayurveda Therapies',
  description:
    'Book an authentic traditional Ayurveda therapy session at Ayurvedic Wellness Centre in Brickfields, Kuala Lumpur. Pick from 60+ protocols — Abhyanga, Shirodhara, Panchakarma, and more.',
  alternates: { canonical: '/book/treatment' },
  openGraph: {
    title: 'Book a Treatment — Ayurvedic Wellness Centre',
    description:
      'Pick from 60+ authentic traditional Ayurveda protocols and book with our Vaidyas in Brickfields, Kuala Lumpur.',
    url: 'https://ayurvedawellness.com.my/book/treatment',
    type: 'website',
  },
}

// Reads auth cookies (Supabase server client) → render on demand, not ISR.
export const dynamic = 'force-dynamic'

async function loadCatalogue(): Promise<{
  categories: TreatmentCategory[]
  treatments: Treatment[]
}> {
  try {
    const supabase = await createClient()
    const [categories, treatments] = await Promise.all([
      getTreatmentCategoriesIndex(supabase),
      getTreatmentsFlat(supabase),
    ])
    return { categories, treatments }
  } catch (err) {
    console.error('[book/treatment] catalogue fetch failed:', err)
    return { categories: [], treatments: [] }
  }
}

export default async function BookTreatmentPage({
  searchParams,
}: {
  searchParams: { edit?: string; t?: string }
}) {
  const { categories, treatments } = await loadCatalogue()
  const user = await getCurrentUser()
  const account = user ? { email: user.email, signedIn: true } : null
  const editBookingId = searchParams.edit ?? null
  const editToken = searchParams.t ?? null
  const editBooking = editBookingId ? await getBookingForEdit(editBookingId, editToken) : null

  return (
    <>
      <BookingPolicyStrip />

      <section
        aria-labelledby="book-treatment-heading"
        className="relative overflow-hidden bg-cream"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 8% 0%, rgba(181, 138, 59,0.14) 0%, transparent 40%), radial-gradient(ellipse at 92% 100%, rgba(20, 148, 71,0.05) 0%, transparent 45%)',
          }}
        />

        <div className="relative mx-auto flex max-w-7xl flex-col px-6 py-12 sm:px-10 sm:py-16 lg:px-12 lg:py-20">
          <Link
            href="/book"
            className="group inline-flex w-fit items-center gap-2 font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary/55 transition-colors hover:text-primary focus-visible:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            <ArrowLeft
              className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-0.5"
              strokeWidth={2.2}
            />
            Back to booking
          </Link>

          <div className="mt-8 flex flex-col gap-5 lg:max-w-3xl">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="h-[2px] w-10 rounded-full bg-accent"
              />
              <span className="font-heading text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
                {treatments.length > 0
                  ? `${treatments.length}+ Therapies`
                  : 'Treatment Library'}
              </span>
            </div>
            <h1
              id="book-treatment-heading"
              className="font-heading font-extrabold leading-[1.05] text-primary"
              style={{
                fontSize: 'clamp(2rem, 4.5vw, 3rem)',
                letterSpacing: '-0.03em',
              }}
            >
              Pick your{' '}
              <span className="font-body font-normal italic text-accent">
                therapy.
              </span>
            </h1>
            <p className="max-w-2xl font-body text-[15px] leading-[1.75] text-dark/65 sm:text-[16px]">
              Choose a treatment from our Ayurveda treatment library and the
              calendar will load with our Vaidyas&apos; available times.
              Treatments flagged &ldquo;consultation required&rdquo; route
              through a free assessment first — that&apos;s by design.
            </p>
          </div>

          <div className="mt-10 lg:mt-12">
            <Suspense fallback={<OrchestratorFallback />}>
              <BookingTreatmentOrchestrator
                categories={categories}
                treatments={treatments}
                account={account}
                editBookingId={editBookingId}
                editToken={editToken}
                editBooking={editBooking}
              />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  )
}

function OrchestratorFallback() {
  return (
    <div
      aria-hidden
      className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-primary/15 bg-white/60 backdrop-blur"
    >
      <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/40">
        Loading treatments…
      </span>
    </div>
  )
}
