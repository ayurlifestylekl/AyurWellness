import Link from 'next/link'
import type { StaffAppointment } from '@/types/booking'
import StatusBadge from './StatusBadge'
import CheckInButtons from './CheckInButtons'
import { customerWaLink, customerTelLink } from '@/lib/booking/contact'

function timeOf(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit' }) : '—'
}

export default function TodayBoard({ appointments }: { appointments: StaffAppointment[] }) {
  if (appointments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-accent/30 bg-white/60 px-5 py-10 text-center font-body text-[14px] text-dark/50">
        No appointments scheduled for today.
      </p>
    )
  }

  return (
    <div className="divide-y divide-accent/10 overflow-hidden rounded-xl border border-accent/20 bg-white">
      {appointments.map((a) => {
        const wa = customerWaLink(a.patientPhone)
        const tel = customerTelLink(a.patientPhone)
        return (
          <div key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-cream/40">
            <div className="w-14 flex-none font-heading text-[15px] font-bold text-primary">{timeOf(a.appointmentDatetime)}</div>

            <div className="min-w-[140px] flex-1">
              <Link href={`/console/${a.id}`} className="font-semibold text-primary hover:underline">
                {a.patientName ?? '—'}
              </Link>
              <div className="flex items-center gap-2 text-[12px] text-dark/55">
                <span>{a.patientPhone ?? 'no phone'}</span>
                {wa && (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold text-green-600 hover:text-green-700">
                    WhatsApp
                  </a>
                )}
                {tel && <a href={tel} className="font-semibold text-accent hover:text-primary">Call</a>}
              </div>
            </div>

            <div className="min-w-[150px] flex-1 text-[13px]">
              <div className="text-dark/85">{a.treatmentName ?? '—'}</div>
              <div className="text-[11.5px] text-dark/50">
                {a.assignedTherapistName ? `${a.assignedTherapistName} (${a.assignedTherapistCode ?? '—'})` : 'No therapist'}
                {a.room ? ` · ${a.room}` : ''}
              </div>
            </div>

            <StatusBadge status={a.status} />
            <CheckInButtons
              id={a.id}
              status={a.status}
              bookingKind={a.bookingKind}
              assignedTherapistCode={a.assignedTherapistCode}
            />
          </div>
        )
      })}
    </div>
  )
}
