import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import TicketStatusPill from './TicketStatusPill'
import TicketTopicChip from './TicketTopicChip'
import { previewBody, relativeTime } from '@/lib/support/format'
import type { TicketWithLatest } from '@/lib/support/queries'

interface TicketListItemProps {
  ticket: TicketWithLatest
}

export default function TicketListItem({ ticket }: TicketListItemProps) {
  const href = `/account/messages/${ticket.id}`
  const isUnread = ticket.unread_by_customer
  const preview = ticket.latest ? previewBody(ticket.latest.body) : 'No messages yet.'

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 overflow-hidden border-b border-[#006B3C]/6 bg-white px-5 py-4 transition-colors hover:bg-[#EDF4E7]/45 sm:px-6 last:border-b-0"
    >
      {/* Unread indicator dot */}
      <span
        aria-hidden
        className={`h-2 w-2 shrink-0 rounded-full ${
          isUnread ? 'bg-[#B58A3B]' : 'bg-transparent'
        }`}
      />

      <div className="flex flex-1 min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <TicketTopicChip topic={ticket.topic} />
          <TicketStatusPill status={ticket.status} />
          <span className="ml-auto font-body text-[11px] text-[#12372D]/45">
            {relativeTime(ticket.last_message_at)}
          </span>
        </div>
        <h3
          className={`truncate font-heading text-[14px] ${
            isUnread ? 'font-bold text-[#006B3C]' : 'font-semibold text-[#006B3C]/85'
          }`}
          style={{ letterSpacing: '-0.005em' }}
        >
          {ticket.subject}
        </h3>
        <p
          className="truncate font-body text-[12px] text-[#12372D]/60"
          style={{ lineHeight: 1.55 }}
        >
          {preview}
        </p>
      </div>

      <ArrowRight
        className="h-3.5 w-3.5 shrink-0 text-[#006B3C]/35 transition-all group-hover:translate-x-0.5 group-hover:text-[#B58A3B]"
        strokeWidth={2}
      />
    </Link>
  )
}
