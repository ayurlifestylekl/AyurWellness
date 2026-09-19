import Link from 'next/link'
import { CalendarDays, Video, MapPin } from 'lucide-react'
import type { ConsultationToday } from '@/lib/admin/queries'

const TIME_FMT = new Intl.DateTimeFormat('en-MY', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

export default function TodayConsultationsCard({
  consultations,
}: {
  consultations: ConsultationToday[]
}) {
  return (
    <article
      className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      <header className="flex items-center justify-between border-b border-[#006B3C]/6 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#B58A3B]/12">
            <CalendarDays className="h-3.5 w-3.5 text-[#B58A3B]" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="font-heading text-[13px] font-semibold text-[#006B3C]">
              Today&apos;s consultations
            </h2>
            <p className="font-body text-[10.5px] text-[#12372D]/55">
              {consultations.length === 0
                ? 'Nothing booked'
                : `${consultations.length} scheduled`}
            </p>
          </div>
        </div>
        <Link
          href="/admin/appointments?filter=today"
          className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#006B3C]/55 hover:text-[#B58A3B]"
        >
          View all →
        </Link>
      </header>
      {consultations.length === 0 ? (
        <p className="px-5 py-8 text-center font-body text-[13px] italic text-[#12372D]/55">
          Calendar is clear today.
        </p>
      ) : (
        <ul className="divide-y divide-[#006B3C]/6">
          {consultations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/appointments/${c.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-[#EDF4E7]/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-mono text-[12px] font-semibold tabular-nums text-[#006B3C]">
                    {TIME_FMT.format(new Date(c.startsAt))}
                  </span>
                  <span className="h-4 w-px bg-[#006B3C]/10" />
                  <div className="min-w-0">
                    <p className="truncate font-heading text-[12.5px] font-semibold text-[#006B3C]">
                      {c.treatmentName}
                    </p>
                    <p className="truncate font-body text-[11px] text-[#12372D]/55">
                      {c.customerName ?? 'Walk-in'}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#006B3C]/[0.06] px-2 py-0.5 font-heading text-[10px] font-semibold text-[#006B3C]">
                  {c.mode === 'virtual' ? (
                    <Video className="h-2.5 w-2.5" />
                  ) : (
                    <MapPin className="h-2.5 w-2.5" />
                  )}
                  {c.mode === 'virtual' ? 'Virtual' : 'In-person'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
