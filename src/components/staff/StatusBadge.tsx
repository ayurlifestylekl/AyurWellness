import type { BookingStatus } from '@/types/booking'
import { STATUS_LABEL } from '@/lib/booking/status'

const TONE: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  scheduled: 'bg-sky-100 text-sky-800 border-sky-200',
  awaiting_payment: 'bg-orange-100 text-orange-800 border-orange-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  checked_in: 'bg-teal-100 text-teal-800 border-teal-200',
  in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  completed: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  no_show: 'bg-red-100 text-red-700 border-red-200',
  rescheduled: 'bg-purple-100 text-purple-800 border-purple-200',
}

export default function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TONE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
