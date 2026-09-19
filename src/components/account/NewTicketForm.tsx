'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { createTicket } from '@/actions/support/createTicket'
import { TOPIC_OPTIONS } from '@/lib/support/format'
import type { TopicKey } from '@/lib/support/format'

type ConcreteTopic = Exclude<TopicKey, 'welcome'>

interface NewTicketFormProps {
  /** Optional initial topic — when set, auto-opens the form. */
  initialTopic?: ConcreteTopic
  /** Optional initial subject — when set, auto-opens the form. */
  initialSubject?: string
}

export default function NewTicketForm({
  initialTopic,
  initialSubject,
}: NewTicketFormProps = {}) {
  const router = useRouter()
  const hasPrefill = Boolean(initialTopic || initialSubject)
  const [open, setOpen] = useState(hasPrefill)
  const [topic, setTopic] = useState<ConcreteTopic>(initialTopic ?? 'treatment')
  const [subject, setSubject] = useState(initialSubject ?? '')
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  function reset() {
    setTopic('treatment')
    setSubject('')
    setBody('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedSubject = subject.trim()
    const trimmedBody = body.trim()
    if (!trimmedSubject) {
      toast.error('Add a short subject line.')
      return
    }
    if (!trimmedBody) {
      toast.error('Write a message body.')
      return
    }

    startTransition(async () => {
      const res = await createTicket({
        topic,
        subject: trimmedSubject,
        body: trimmedBody,
      })
      if (res.ok && res.ticketId) {
        toast.success('Message sent', {
          description: 'Vaidya will reply within 24 hours on weekdays.',
        })
        reset()
        setOpen(false)
        router.push(`/account/messages/${res.ticketId}`)
      } else {
        toast.error(res.error ?? 'Could not send your message.')
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex h-12 w-full items-center justify-between gap-3 rounded-3xl border border-dashed border-[#006B3C]/15 bg-white px-5 transition-all hover:border-[#B58A3B]/45 hover:bg-[#EDF4E7]/35 sm:px-6"
      >
        <span className="inline-flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#B58A3B]/15">
            <Plus className="h-3.5 w-3.5 text-[#B58A3B]" strokeWidth={2.2} />
          </span>
          <span className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
            Start a new conversation
          </span>
        </span>
        <span className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#006B3C]/55 group-hover:text-[#B58A3B]">
          New message
        </span>
      </button>
    )
  }

  return (
    <section
      className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 18px 36px -22px rgba(0,107,60,0.22)',
      }}
    >
      <div className="flex items-center gap-2.5 border-b border-[#006B3C]/6 px-5 py-3 sm:px-6">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#B58A3B]/15">
          <Sparkles className="h-3.5 w-3.5 text-[#B58A3B]" strokeWidth={1.8} />
        </span>
        <h2 className="font-heading text-[13px] font-semibold text-[#006B3C]">
          New message
        </h2>
        <button
          type="button"
          onClick={() => {
            reset()
            setOpen(false)
          }}
          className="ml-auto inline-flex items-center gap-1 font-heading text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#006B3C]/55 transition-colors hover:text-red-700"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5 sm:px-6">
        {/* Topic */}
        <div>
          <label htmlFor="new-ticket-topic" className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55">
            Topic
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TOPIC_OPTIONS.map((opt) => {
              const isActive = topic === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTopic(opt.value)}
                  className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 font-heading text-[11.5px] font-semibold transition-all ${
                    isActive
                      ? 'border-[#B58A3B] bg-[#B58A3B] text-[#12372D]'
                      : 'border-[#006B3C]/12 bg-white text-[#006B3C]/65 hover:border-[#B58A3B]/40 hover:text-[#006B3C]'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <input id="new-ticket-topic" type="hidden" value={topic} readOnly />
        </div>

        {/* Subject */}
        <div>
          <label
            htmlFor="new-ticket-subject"
            className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55"
          >
            Subject
          </label>
          <input
            id="new-ticket-subject"
            name="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="A short line about your question"
            maxLength={120}
            disabled={isPending}
            className="mt-2 w-full rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-2.5 font-body text-[13.5px] text-[#006B3C] placeholder:text-[#12372D]/40 focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 disabled:opacity-50"
          />
        </div>

        {/* Body */}
        <div>
          <label
            htmlFor="new-ticket-body"
            className="block font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#006B3C]/55"
          >
            Message
          </label>
          <textarea
            id="new-ticket-body"
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share the details — symptoms, products, dates, anything that helps Vaidya respond well."
            maxLength={2000}
            rows={6}
            disabled={isPending}
            className="mt-2 w-full resize-y rounded-2xl border border-[#006B3C]/15 bg-white px-4 py-3 font-body text-[13.5px] text-[#006B3C] placeholder:text-[#12372D]/40 focus:border-[#B58A3B] focus:outline-none focus:ring-2 focus:ring-[#B58A3B]/30 disabled:opacity-50"
            style={{ lineHeight: 1.6 }}
          />
          <p className="mt-1 text-right font-body text-[10.5px] text-[#12372D]/45">
            {body.length} / 2000
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="font-body text-[11px] italic text-[#12372D]/55">
            Vaidya replies within 24 hours on weekdays.
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-[#006B3C] px-6 font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-all hover:bg-[#006B3C] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Sending…' : 'Send'}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </form>
    </section>
  )
}
