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
      className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#B58A3B]/15 bg-[#FBF7EE]"
      style={{
        boxShadow:
          '0 1px 2px rgba(18,55,45,0.05), 0 26px 50px -34px rgba(60,45,20,0.45)',
      }}
    >
      <div className="flex items-center gap-2.5 border-b border-[#006B3C]/6 px-5 py-3 sm:px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#006B3C]/[0.06]">
          <Calendar className="h-3.5 w-3.5 text-[#12372D]" strokeWidth={1.8} />
        </span>
        <h2 className="font-heading text-[13px] font-semibold text-[#12372D]">
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
                  className="rounded-full border border-[#006B3C]/15 px-3 py-1.5 font-heading text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#12372D] transition-colors hover:border-[#006B3C]/35"
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
