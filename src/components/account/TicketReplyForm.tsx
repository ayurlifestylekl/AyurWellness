'use client'

import { useState, useTransition } from 'react'
import { ArrowRight, MessageCircle, CheckCircle2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { postReply } from '@/actions/support/postReply'
import { markResolved } from '@/actions/support/markResolved'
import { prefillWhatsApp } from '@/lib/support/format'
import type { SupportTicket } from '@/lib/support/format'

interface TicketReplyFormProps {
  ticket: SupportTicket
}

export default function TicketReplyForm({ ticket }: TicketReplyFormProps) {
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isResolving, startResolveTransition] = useTransition()

  const isClosed = ticket.status === 'closed'
  const isResolved = ticket.status === 'resolved'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) {
      toast.error('Write a message first.')
      return
    }
    startTransition(async () => {
      const res = await postReply(ticket.id, trimmed)
      if (res.ok) {
        setBody('')
        toast.success(isResolved ? 'Re-opened with your reply.' : 'Reply sent')
      } else {
        toast.error(res.error ?? 'Could not send your reply.')
      }
    })
  }

  function handleResolve() {
    startResolveTransition(async () => {
      const res = await markResolved(ticket.id)
      if (res.ok) {
        toast.success('Marked as resolved.', {
          description: 'Re-open it any time by posting a new reply.',
        })
      } else {
        toast.error(res.error ?? 'Could not update status.')
      }
    })
  }

  return (
    <section
      className="overflow-hidden rounded-3xl border border-[#B58A3B]/15 bg-[#FBF7EE]"
      style={{
        boxShadow:
          '0 1px 2px rgba(18,55,45,0.05), 0 26px 50px -34px rgba(60,45,20,0.45)',
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 py-4 sm:px-6 sm:py-5">
        <label htmlFor={`reply-${ticket.id}`} className="sr-only">
          Reply to {ticket.subject}
        </label>
        <textarea
          id={`reply-${ticket.id}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            isClosed
              ? 'This conversation is closed.'
              : isResolved
                ? 'Send a new message to re-open this conversation.'
                : 'Write your reply…'
          }
          maxLength={2000}
          rows={3}
          disabled={isPending || isClosed}
          className="resize-y rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-3 font-body text-[13.5px] text-[#12372D] placeholder:text-[#12372D]/40 focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 disabled:cursor-not-allowed disabled:bg-[#006B3C]/[0.03] disabled:opacity-60"
          style={{ lineHeight: 1.6 }}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a
              href={prefillWhatsApp(ticket)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.16em] text-[#12372D]/55 transition-colors hover:text-[#B58A3B]"
              title="For urgent matters"
            >
              <MessageCircle className="h-3 w-3" strokeWidth={2} />
              Or WhatsApp Vaidya
              <ExternalLink className="h-3 w-3" />
            </a>
            {!isResolved && !isClosed && (
              <button
                type="button"
                onClick={handleResolve}
                disabled={isResolving}
                className="inline-flex items-center gap-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.16em] text-[#12372D]/55 transition-colors hover:text-[#12372D] disabled:opacity-50"
              >
                <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                {isResolving ? 'Resolving…' : 'Mark as resolved'}
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending || isClosed || !body.trim()}
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-[#12372D] px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-all hover:bg-[#006B3C] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Sending…' : isResolved ? 'Send & re-open' : 'Send'}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </form>
    </section>
  )
}
