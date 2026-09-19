import type { AppointmentBucket } from '@/lib/appointments/policy'

interface AppointmentStatusPillProps {
  bucket: AppointmentBucket
}

const STYLES: Record<AppointmentBucket, { bg: string; text: string; label: string }> = {
  today: {
    bg: 'bg-[#B58A3B]/15',
    text: 'text-[#B58A3B]',
    label: 'Today',
  },
  upcoming: {
    bg: 'bg-[#006B3C]/10',
    text: 'text-[#006B3C]',
    label: 'Upcoming',
  },
  past: {
    bg: 'bg-[#006B3C]/[0.08]',
    text: 'text-[#006B3C]/65',
    label: 'Completed',
  },
  cancelled: {
    bg: 'bg-red-50',
    text: 'text-red-700/75',
    label: 'Cancelled',
  },
}

export default function AppointmentStatusPill({ bucket }: AppointmentStatusPillProps) {
  const s = STYLES[bucket]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-heading text-[10.5px] font-semibold uppercase tracking-[0.14em] ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  )
}
