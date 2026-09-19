import Link from 'next/link'
import {
  Clock,
  MapPin,
  Video,
  ExternalLink,
  CalendarPlus,
  Navigation,
  RefreshCcw,
  ArrowRight,
} from 'lucide-react'
import AppointmentStatusPill from './AppointmentStatusPill'
import { findTherapyByName } from '@/data/therapies'
import {
  appointmentBucket,
  isJoinableNow,
} from '@/lib/appointments/policy'
import type { AppointmentRow } from '@/lib/dashboard/appointment-queries'

interface AppointmentListCardProps {
  appointment: AppointmentRow
}

const CLINIC_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Ayurvedic+Wellness+Centre+Brickfields+Kuala+Lumpur'

const dayFormat = new Intl.DateTimeFormat('en-MY', { weekday: 'short' })
const monthFormat = new Intl.DateTimeFormat('en-MY', { month: 'short' })
const dayNumFormat = new Intl.DateTimeFormat('en-MY', { day: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('en-MY', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})
const yearFormat = new Intl.DateTimeFormat('en-MY', { year: 'numeric' })

export default function AppointmentListCard({ appointment }: AppointmentListCardProps) {
  const start = new Date(appointment.appointment_date_time)
  const bucket = appointmentBucket(appointment)
  const therapy = findTherapyByName(appointment.treatment_name)
  const isVirtual = appointment.mode === 'virtual'
  // Cast: the hand-maintained DB type predates awaiting_payment.
  const status = appointment.status as string
  const needsAction = status === 'awaiting_payment'
  const isFuture = (bucket === 'upcoming' || bucket === 'today') && !needsAction
  const canJoin =
    isFuture &&
    isVirtual &&
    Boolean(appointment.meeting_link) &&
    isJoinableNow(appointment.appointment_date_time, appointment.duration_mins)

  const followUpHref = therapy
    ? `/book/treatment?slug=${therapy.slug}`
    : '/book/treatment'

  return (
    <article
      className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white transition-all hover:-translate-y-0.5 hover:border-[#B58A3B]/35"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      <div className="flex items-stretch gap-4 px-5 py-4 sm:gap-5 sm:px-6 sm:py-5">
        {/* Date block */}
        <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl bg-[#EDF4E7] px-3 py-2.5 text-center min-w-[64px] sm:min-w-[72px]">
          <span className="font-heading text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#006B3C]/55">
            {dayFormat.format(start)}
          </span>
          <span
            className="mt-0.5 font-heading text-[22px] font-bold leading-none text-[#006B3C] sm:text-[24px]"
            style={{ letterSpacing: '-0.02em' }}
          >
            {dayNumFormat.format(start)}
          </span>
          <span className="mt-0.5 font-heading text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#006B3C]/55">
            {monthFormat.format(start)} {yearFormat.format(start)}
          </span>
        </div>

        {/* Main info */}
        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <AppointmentStatusPill bucket={bucket} />
            {isVirtual ? (
              <span className="inline-flex items-center gap-1 font-body text-[11.5px] text-[#006B3C]/85">
                <Video className="h-3 w-3" strokeWidth={2} />
                Virtual
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-body text-[11.5px] text-[#006B3C]/55">
                <MapPin className="h-3 w-3" strokeWidth={2} />
                Brickfields, KL
              </span>
            )}
          </div>
          <h3
            className="truncate font-heading text-[15px] font-bold text-[#006B3C]"
            style={{ letterSpacing: '-0.005em' }}
          >
            {appointment.treatment_name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-body text-[12px] text-[#12372D]/60">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeFormat.format(start)} · {appointment.duration_mins} min
            </span>
            <span className="text-[#B58A3B]">·</span>
            <span>{appointment.doctor_name}</span>
          </div>
        </div>

        {/* Right side: advance payment */}
        {appointment.advance_payment_rm != null && (
          <div className="hidden shrink-0 flex-col items-end justify-center sm:flex">
            <span className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#006B3C]/45">
              Advance
            </span>
            <span
              className="font-heading text-[15px] font-bold leading-none text-[#006B3C]"
              style={{ letterSpacing: '-0.01em' }}
            >
              RM {Number(appointment.advance_payment_rm).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Footer actions row — state-driven */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#006B3C]/6 px-5 py-2.5 sm:px-6">
        {needsAction && (
          <>
            <Link
              href={`/book/request/${appointment.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#B58A3B] px-3.5 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#12372D] transition-all hover:bg-[#B58A3B]/90"
            >
              Pay now
              <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
            </Link>
            <Link
              href={`/book/request/${appointment.id}/manage`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#006B3C]/15 bg-white px-3.5 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#006B3C] transition-all hover:border-[#006B3C]/35"
            >
              Manage booking
            </Link>
          </>
        )}

        {isFuture && (
          <>
            {canJoin && appointment.meeting_link && (
              <a
                href={appointment.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 rounded-full bg-[#B58A3B] px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#12372D] transition-all hover:bg-[#B58A3B]"
              >
                <Video className="h-3 w-3" strokeWidth={2.2} />
                Join call
              </a>
            )}
            {!isVirtual && (
              <a
                href={CLINIC_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#006B3C]/12 bg-white px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#006B3C]/65 transition-all hover:border-[#006B3C]/25 hover:text-[#006B3C]"
              >
                <Navigation className="h-3 w-3" strokeWidth={2} />
                Directions
              </a>
            )}
            <a
              href={`/account/appointments/${appointment.id}/ics`}
              download
              className="inline-flex items-center gap-1.5 rounded-full border border-[#006B3C]/12 bg-white px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#006B3C]/65 transition-all hover:border-[#006B3C]/25 hover:text-[#006B3C]"
            >
              <CalendarPlus className="h-3 w-3" strokeWidth={2} />
              Calendar
            </a>
            <Link
              href={`/book/request/${appointment.id}/manage`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#006B3C]/12 bg-white px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#006B3C] transition-all hover:border-[#006B3C]/30"
            >
              Manage booking
            </Link>
          </>
        )}

        {bucket === 'past' && (
          <>
            <Link
              href="#aftercare"
              scroll
              className="inline-flex items-center gap-1.5 rounded-full border border-[#006B3C]/12 bg-white px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-[#006B3C]/65 transition-all hover:border-[#006B3C]/25"
            >
              View aftercare
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href={followUpHref}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#006B3C] px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-all hover:bg-[#006B3C]"
            >
              <RefreshCcw className="h-3 w-3" strokeWidth={2} />
              Book follow-up
            </Link>
          </>
        )}

        {bucket === 'cancelled' && (
          <Link
            href={followUpHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#006B3C] px-3 py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-all hover:bg-[#006B3C]"
          >
            <RefreshCcw className="h-3 w-3" strokeWidth={2} />
            Re-book
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </article>
  )
}
