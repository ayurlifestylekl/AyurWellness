import { Calendar, Clock, Video, MapPin } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type AppointmentRow = Database['public']['Tables']['appointments']['Row']

interface AppointmentRowProps {
  appointment: AppointmentRow
}

const dayFormat = new Intl.DateTimeFormat('en-MY', { day: 'numeric' })
const monthFormat = new Intl.DateTimeFormat('en-MY', { month: 'short' })
const timeFormat = new Intl.DateTimeFormat('en-MY', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

export default function AppointmentRow({ appointment }: AppointmentRowProps) {
  const dt = new Date(appointment.appointment_date_time)
  const day = dayFormat.format(dt)
  const month = monthFormat.format(dt)
  const time = timeFormat.format(dt)
  const duration = appointment.duration_mins ?? 30
  const advance = appointment.advance_payment_rm

  return (
    <div className="flex items-start gap-4 px-5 py-4 sm:px-6">
      {/* Date block — magazine-style */}
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#B58A3B]/12">
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B58A3B]">
          {month}
        </span>
        <span
          className="font-heading text-[20px] font-bold leading-none text-[#006B3C]"
          style={{ letterSpacing: '-0.02em' }}
        >
          {day}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3
          className="font-heading text-[14.5px] font-semibold text-[#006B3C]"
          style={{ letterSpacing: '-0.005em' }}
        >
          {appointment.treatment_name}
        </h3>
        <p className="mt-0.5 font-body text-[11.5px] italic text-[#12372D]/55">
          with {appointment.doctor_name}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 font-body text-[11.5px] text-[#006B3C]/60">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {time} · {duration} min
          </span>
          {appointment.mode === 'virtual' ? (
            <span className="inline-flex items-center gap-1 text-[#006B3C]/85">
              <Video className="h-3 w-3" strokeWidth={2} />
              Virtual
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" strokeWidth={2} />
              Brickfields
            </span>
          )}
          {advance != null && Number(advance) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#006B3C]/25 bg-[#006B3C]/8 px-2 py-0.5 font-heading text-[10px] font-semibold uppercase tracking-[0.08em] text-[#006B3C]">
              Advance · RM {Number(advance).toFixed(0)}
            </span>
          )}
        </div>
      </div>

      <Calendar className="mt-1 h-3.5 w-3.5 shrink-0 text-[#006B3C]/25" strokeWidth={1.8} />
    </div>
  )
}
