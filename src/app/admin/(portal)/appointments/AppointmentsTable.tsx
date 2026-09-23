import Link from 'next/link'
import { Video, MapPin } from 'lucide-react'
import type { AppointmentListItem } from '@/lib/admin/appointments/queries'
import { STATUS_LABELS } from '@/lib/admin/appointments/status-transitions'

const STATUS_CLASS: Record<string, string> = {
  pending:     'bg-amber-50 text-amber-700 border-amber-200',
  scheduled:   'bg-blue-50 text-blue-700 border-blue-200',
  confirmed:   'bg-blue-100 text-blue-800 border-blue-300',
  checked_in:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  in_progress: 'bg-violet-50 text-violet-700 border-violet-200',
  completed:   'bg-emerald-100 text-emerald-800 border-emerald-300',
  cancelled:   'bg-red-50 text-red-700 border-red-200',
  no_show:     'bg-orange-50 text-orange-700 border-orange-200',
  rescheduled: 'bg-slate-100 text-slate-700 border-slate-300',
}

export default function AppointmentsTable({
  items,
}: {
  items: AppointmentListItem[]
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#006B3C]/15 p-12 text-center font-body text-sm italic text-[#12372D]/55">
        No appointments match this filter.
      </div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#006B3C]/8 bg-white">
      <table className="min-w-[640px] w-full text-left text-[13px]">
        <thead className="bg-[#EDF4E7]/40 text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          <tr>
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Treatment</th>
            <th className="px-4 py-3">Mode</th>
            <th className="px-4 py-3">Vaidya</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Adv. pmt</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#006B3C]/6">
          {items.map((a) => {
            const dt = new Date(a.appointmentDateTime)
            return (
              <tr key={a.id} className="hover:bg-[#EDF4E7]/30">
                <td className="px-4 py-3 align-top">
                  <Link
                    href={`/admin/appointments/${a.id}`}
                    className="font-semibold text-[#006B3C] hover:text-[#B58A3B]"
                  >
                    {dt.toLocaleDateString('en-MY', {
                      timeZone: 'Asia/Kuala_Lumpur',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Link>
                  <div className="text-[11px] text-[#12372D]/55">
                    {dt.toLocaleTimeString('en-MY', {
                      timeZone: 'Asia/Kuala_Lumpur',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    · {a.durationMins} min
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{a.customerName ?? '—'}</div>
                  <div className="text-[11px] text-[#12372D]/55">
                    {a.customerPhone ?? a.customerEmail ?? ''}
                  </div>
                </td>
                <td className="px-4 py-3">{a.treatmentName}</td>
                <td className="px-4 py-3 text-[12px]">
                  {a.mode === 'virtual' ? (
                    <span className="inline-flex items-center gap-1 text-violet-700">
                      <Video className="h-3 w-3" /> Virtual
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[#006B3C]">
                      <MapPin className="h-3 w-3" /> {a.room ?? 'In-person'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[12px] text-[#12372D]/65">{a.doctorName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_CLASS[a.status] ?? ''}`}
                  >
                    {STATUS_LABELS[a.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {a.advancePaymentRm != null ? (
                    <span className="font-semibold">
                      RM {a.advancePaymentRm.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#12372D]/45">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {['pending', 'scheduled', 'awaiting_payment'].includes(a.status) ? (
                    <Link
                      href={`/console/${a.id}`}
                      className="font-heading text-[11px] font-bold uppercase tracking-[0.1em] text-[#B58A3B] hover:text-[#006B3C]"
                    >
                      Approve →
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/appointments/${a.id}`}
                      className="text-[11px] font-semibold text-[#006B3C]/60 hover:text-[#006B3C]"
                    >
                      View
                    </Link>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
