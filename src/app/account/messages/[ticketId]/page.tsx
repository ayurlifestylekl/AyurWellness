import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { getTicketWithMessages } from '@/lib/support/queries'

import TicketTopicChip from '@/components/account/TicketTopicChip'
import TicketStatusPill from '@/components/account/TicketStatusPill'
import MessageBubble from '@/components/account/MessageBubble'
import TicketReplyForm from '@/components/account/TicketReplyForm'

export const metadata = {
  title: 'Conversation',
}

const longDate = new Intl.DateTimeFormat('en-MY', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default async function TicketThreadPage({
  params,
}: {
  params: { ticketId: string }
}) {
  const me = await getCurrentUser()
  const customerId = me?.authId ?? ''
  const customerName = me?.profile.full_name ?? null

  if (!params.ticketId || params.ticketId.length < 8) {
    notFound()
  }

  const supabase = await createClient()
  const data = await getTicketWithMessages(supabase, customerId, params.ticketId)

  if (!data) notFound()
  const { ticket, messages } = data

  const isClosed = ticket.status === 'closed'

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Back link */}
      <Link
        href="/account/messages"
        className="group inline-flex w-fit items-center gap-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55 transition-colors hover:text-[#B58A3B]"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        All conversations
      </Link>

      {/* Ticket header */}
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <TicketTopicChip topic={ticket.topic} />
          <TicketStatusPill status={ticket.status} />
          <span className="font-body text-[11px] italic text-[#12372D]/55">
            Started {longDate.format(new Date(ticket.created_at))}
          </span>
        </div>
        <h1
          className="mt-2 font-heading text-[24px] font-bold leading-tight text-[#006B3C] sm:text-[28px]"
          style={{ letterSpacing: '-0.02em' }}
        >
          {ticket.subject}
        </h1>
      </header>

      {/* Message thread */}
      <section
        className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
        style={{
          boxShadow:
            '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
        }}
      >
        <ul className="flex flex-col gap-4 px-5 py-6 sm:px-7 sm:py-7">
          {messages.length === 0 ? (
            <li className="text-center font-body text-[12px] italic text-[#12372D]/55">
              No messages yet.
            </li>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                customerName={customerName}
              />
            ))
          )}
        </ul>
      </section>

      {/* Reply form */}
      <TicketReplyForm ticket={ticket} />

      {isClosed && (
        <p className="text-center font-body text-[12px] italic text-[#12372D]/55">
          This conversation is closed. Start a new one from the inbox for new
          questions.
        </p>
      )}
    </div>
  )
}
