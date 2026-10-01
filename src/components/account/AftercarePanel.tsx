import { ScrollText, Sparkles } from 'lucide-react'
import type { AppointmentRow } from '@/lib/dashboard/appointment-queries'

interface AftercarePanelProps {
  /** The most recent appointment with status='completed'. Pass null when none. */
  lastCompleted: AppointmentRow | null
}

const longDate = new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default function AftercarePanel({ lastCompleted }: AftercarePanelProps) {
  if (!lastCompleted) return null

  const hasNotes = Boolean(lastCompleted.notes && lastCompleted.notes.trim().length > 0)
  const dateLabel = longDate.format(new Date(lastCompleted.appointment_date_time))

  return (
    <section
      id="aftercare"
      className="overflow-hidden rounded-3xl border border-[#B58A3B]/15 bg-[#FBF7EE]"
      style={{
        boxShadow:
          '0 1px 2px rgba(18,55,45,0.05), 0 26px 50px -34px rgba(60,45,20,0.45)',
      }}
    >
      <div className="flex items-center gap-2.5 border-b border-[#006B3C]/6 px-5 py-3 sm:px-6">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#006B3C]/[0.06]">
          <ScrollText className="h-3.5 w-3.5 text-[#12372D]" strokeWidth={1.8} />
        </span>
        <h2 className="font-heading text-[13px] font-semibold text-[#12372D]">
          Aftercare
        </h2>
        <span className="ml-auto font-body text-[11.5px] text-[#12372D]/50">
          {lastCompleted.treatment_name} · {dateLabel}
        </span>
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6">
        {hasNotes ? (
          <article>
            <p
              className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#12372D]/55"
            >
              From your last visit with {lastCompleted.doctor_name}
            </p>
            <div
              className="mt-3 font-body text-[14px] text-[#12372D]/80 whitespace-pre-line"
              style={{ lineHeight: 1.7 }}
            >
              {lastCompleted.notes}
            </div>
          </article>
        ) : (
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#B58A3B]/[0.12]">
              <Sparkles className="h-3.5 w-3.5 text-[#B58A3B]" strokeWidth={1.8} />
            </span>
            <div>
              <p className="font-heading text-[13px] font-semibold text-[#12372D]">
                Vaidya will add personal notes after your next visit.
              </p>
              <p
                className="mt-1 font-body text-[12.5px] text-[#12372D]/60"
                style={{ lineHeight: 1.55 }}
              >
                Your aftercare — recommended oils, daily practices, and follow-up
                timing — appears here when {lastCompleted.doctor_name} writes it
                into your record.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
