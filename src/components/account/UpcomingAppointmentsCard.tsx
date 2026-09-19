import Link from 'next/link'
import { Calendar } from 'lucide-react'
import AppointmentRow from './AppointmentRow'
import EmptyState from './EmptyState'
import type { Database } from '@/lib/database.types'

type AppointmentRowType = Database['public']['Tables']['appointments']['Row']

interface UpcomingAppointmentsCardProps {
  appointments: AppointmentRowType[]
}

export default function UpcomingAppointmentsCard({
  appointments,
}: UpcomingAppointmentsCardProps) {
  return (
    <section
      className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      <div className="flex items-center gap-2.5 border-b border-[#006B3C]/6 px-5 py-3 sm:px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#006B3C]/[0.06]">
          <Calendar className="h-3.5 w-3.5 text-[#006B3C]" strokeWidth={1.8} />
        </span>
        <h2 className="font-heading text-[13px] font-semibold text-[#006B3C]">
          Upcoming consultations
        </h2>
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No consultations scheduled"
          body="Book your first session with our Vaidya — a personalised Ayurvedic consultation."
          ctaLabel="Book a session"
          ctaHref="/book/consultation"
        />
      ) : (
        <ul className="divide-y divide-[#006B3C]/6">
          {appointments.map((apt) => (
            <li key={apt.id}>
              <AppointmentRow appointment={apt} />
              <div className="flex items-center justify-end gap-2 px-5 pb-4 sm:px-6">
                {(apt.status as string) === 'awaiting_payment' && (
                  <Link
                    href={`/book/request/${apt.id}`}
                    className="rounded-full bg-[#B58A3B] px-3 py-1.5 font-heading text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#12372D]"
                  >
                    Pay now
                  </Link>
                )}
                <Link
                  href={`/book/request/${apt.id}/manage`}
                  className="rounded-full border border-[#006B3C]/15 px-3 py-1.5 font-heading text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#006B3C] transition-colors hover:border-[#006B3C]/35"
                >
                  Manage booking
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
