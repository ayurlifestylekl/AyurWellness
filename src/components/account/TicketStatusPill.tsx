import { statusLabel } from '@/lib/support/format'
import type { TicketStatus } from '@/lib/support/format'

interface TicketStatusPillProps {
  status: TicketStatus
}

const STYLES: Record<TicketStatus, { bg: string; text: string }> = {
  open: {
    bg: 'bg-[#006B3C]/10',
    text: 'text-[#006B3C]',
  },
  'awaiting-customer': {
    bg: 'bg-[#B58A3B]/15',
    text: 'text-[#B58A3B]',
  },
  resolved: {
    bg: 'bg-[#006B3C]/[0.08]',
    text: 'text-[#006B3C]/65',
  },
  closed: {
    bg: 'bg-[#006B3C]/[0.06]',
    text: 'text-[#12372D]/50',
  },
}

export default function TicketStatusPill({ status }: TicketStatusPillProps) {
  const s = STYLES[status] ?? STYLES.open
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-heading text-[10px] font-semibold uppercase tracking-[0.14em] ${s.bg} ${s.text}`}
    >
      {statusLabel(status)}
    </span>
  )
}
