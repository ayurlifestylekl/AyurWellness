import Link from 'next/link'
import { Calendar, Stethoscope, Sparkles } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import {
  listAppointments,
  getAppointmentStats,
} from '@/lib/dashboard/appointment-queries'
import {
  appointmentBucket,
  countdownLabel,
} from '@/lib/appointments/policy'

import NextAppointmentHero from '@/components/account/NextAppointmentHero'
import AppointmentSummary from '@/components/account/AppointmentSummary'
import AppointmentFilterTabs, {
  type AppointmentFilter,
} from '@/components/account/AppointmentFilterTabs'
import AppointmentListCard from '@/components/account/AppointmentListCard'
import AftercarePanel from '@/components/account/AftercarePanel'
import EmptyState from '@/components/account/EmptyState'

export const metadata = {
  title: 'My Appointments',
}

const monthYearFormat = new Intl.DateTimeFormat('en-MY', {
  month: 'short',
  year: 'numeric',
})

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: { view?: string }
}) {
  const me = await getCurrentUser()
  const customerId = me?.authId ?? ''
  const firstName = me?.profile.full_name?.split(' ')[0] ?? 'there'
  const memberSinceLabel = me?.profile.created_at
    ? monthYearFormat.format(new Date(me.profile.created_at))
    : '—'

  const supabase = await createClient()
  const [appointments, stats] = await Promise.all([
    listAppointments(supabase, customerId),
    getAppointmentStats(supabase, customerId),
  ])

  // Bucket each appointment once
  const bucketed = appointments.map((a) => ({
    row: a,
    bucket: appointmentBucket(a),
  }))

  // Counts for the filter tabs
  const counts: Record<AppointmentFilter, number> = {
    all: appointments.length,
    upcoming: 0,
    past: 0,
    cancelled: 0,
  }
  for (const { bucket } of bucketed) {
    if (bucket === 'upcoming' || bucket === 'today') counts.upcoming += 1
    else if (bucket === 'past') counts.past += 1
    else if (bucket === 'cancelled') counts.cancelled += 1
  }

  const active: AppointmentFilter = (
    ['upcoming', 'past', 'cancelled'] as AppointmentFilter[]
  ).includes(searchParams.view as AppointmentFilter)
    ? (searchParams.view as AppointmentFilter)
    : 'all'

  const filtered = bucketed.filter(({ bucket }) => {
    if (active === 'all') return true
    if (active === 'upcoming') return bucket === 'upcoming' || bucket === 'today'
    if (active === 'past') return bucket === 'past'
    if (active === 'cancelled') return bucket === 'cancelled'
    return true
  })

  // Find the next upcoming appointment for the hero (closest to now in the future)
  const futureSorted = bucketed
    .filter(({ bucket }) => bucket === 'upcoming' || bucket === 'today')
    .map(({ row }) => row)
    .sort(
      (a, b) =>
        new Date(a.appointment_date_time).getTime() -
        new Date(b.appointment_date_time).getTime()
    )
  const next = futureSorted[0] ?? null
  const nextCountdown = next ? countdownLabel(next.appointment_date_time) : null

  // Find the most recent completed appointment for the aftercare panel
  const completedSorted = appointments
    .filter((a) => a.status === 'completed')
    .sort(
      (a, b) =>
        new Date(b.appointment_date_time).getTime() -
        new Date(a.appointment_date_time).getTime()
    )
  const lastCompleted = completedSorted[0] ?? null

  const isEmptyOverall = appointments.length === 0
  const isEmptyInFilter = filtered.length === 0 && !isEmptyOverall

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
            <Calendar className="h-3.5 w-3.5 text-[#B58A3B]" strokeWidth={2} />
            Bookings & care
          </span>
          <h1
            className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C] sm:text-[36px]"
            style={{ letterSpacing: '-0.025em' }}
          >
            Hello, {firstName}.{' '}
            <span
              className="italic font-normal text-[#006B3C]/70"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Your visits.
            </span>
          </h1>
        </div>
        {nextCountdown && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B58A3B]/30 bg-[#EDF4E7] px-3.5 py-1.5 font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#B58A3B]">
            <Sparkles className="h-3 w-3" strokeWidth={2} />
            Next visit {nextCountdown.toLowerCase()}
          </span>
        )}
      </header>

      {/* ── NEXT APPOINTMENT HERO ────────────────────────────────── */}
      {next && <NextAppointmentHero appointment={next} />}

      {/* ── SUMMARY TILES ────────────────────────────────────────── */}
      <AppointmentSummary
        upcomingCount={stats.upcomingCount}
        completedThisYear={stats.completedThisYear}
        memberSinceLabel={memberSinceLabel}
      />

      {/* ── FILTER TABS ──────────────────────────────────────────── */}
      {!isEmptyOverall && <AppointmentFilterTabs active={active} counts={counts} />}

      {/* ── APPOINTMENT LIST / EMPTY STATES ──────────────────────── */}
      {isEmptyOverall ? (
        <div
          className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
          style={{
            boxShadow:
              '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
          }}
        >
          <EmptyState
            icon={Stethoscope}
            title="No bookings yet"
            body="Start with a consultation, or browse our Ayurvedic treatments. our Vaidya will build a routine personal to you."
            ctaLabel="Book a consultation"
            ctaHref="/book/consultation"
            secondaryCtaLabel="Browse treatments"
            secondaryCtaHref="/book/treatment"
          />
        </div>
      ) : isEmptyInFilter ? (
        <div
          className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
          style={{
            boxShadow:
              '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
          }}
        >
          <EmptyState
            icon={Calendar}
            title={`No ${active} appointments`}
            body="Try a different filter, or book your next visit."
          />
        </div>
      ) : (
        <ul className="flex flex-col gap-3 sm:gap-4">
          {filtered.map(({ row }) => (
            <li key={row.id}>
              <AppointmentListCard appointment={row} />
            </li>
          ))}
        </ul>
      )}

      {/* ── AFTERCARE PANEL ──────────────────────────────────────── */}
      <AftercarePanel lastCompleted={lastCompleted} />

      {/* ── POLICY + SUPPORT ─────────────────────────────────────── */}
      <div className="flex flex-col gap-2 pt-1 text-center">
        <p className="font-body text-[12px] text-[#12372D]/55">
          To reschedule, cancel, or ask about a refund, message us on WhatsApp and our team will assist you directly.
        </p>
        {/* Quick links to book again */}
        {!isEmptyOverall && (
          <p className="font-body text-[11.5px] text-[#12372D]/45">
            Or{' '}
            <Link
              href="/book/consultation"
              className="font-semibold text-[#006B3C]/70 underline-offset-4 transition-colors hover:text-[#B58A3B] hover:underline"
            >
              book a new consultation
            </Link>
            {' · '}
            <Link
              href="/book/treatment"
              className="font-semibold text-[#006B3C]/70 underline-offset-4 transition-colors hover:text-[#B58A3B] hover:underline"
            >
              book a treatment
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
