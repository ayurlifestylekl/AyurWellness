import { Inbox, Sparkles } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { listTickets } from '@/lib/support/queries'
import { isActiveStatus, TOPIC_OPTIONS } from '@/lib/support/format'
import type { TopicKey } from '@/lib/support/format'

import SupportQuickActions from '@/components/account/SupportQuickActions'
import TicketListItem from '@/components/account/TicketListItem'
import NewTicketForm from '@/components/account/NewTicketForm'
import ClinicInfoCard from '@/components/account/ClinicInfoCard'

export const metadata = {
  title: 'Messages & Support',
}

type ConcreteTopic = Exclude<TopicKey, 'welcome'>

function resolvePrefillTopic(raw?: string): ConcreteTopic | undefined {
  if (!raw) return undefined
  const isValid = TOPIC_OPTIONS.some((t) => t.value === raw)
  return isValid ? (raw as ConcreteTopic) : undefined
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { topic?: string; subject?: string }
}) {
  const me = await getCurrentUser()
  const customerId = me?.authId ?? ''
  const firstName = me?.profile.full_name?.split(' ')[0] ?? 'there'

  const initialTopic = resolvePrefillTopic(searchParams.topic)
  const initialSubject = searchParams.subject?.slice(0, 120)

  const supabase = await createClient()
  const tickets = customerId ? await listTickets(supabase, customerId) : []

  const active = tickets.filter((t) => isActiveStatus(t.status))
  const resolved = tickets.filter((t) => !isActiveStatus(t.status))

  // Smart WhatsApp prefill — uses the most recent open ticket's topic.
  const mostRecentActive = active[0] ?? null
  const whatsappPrefill = mostRecentActive
    ? `Hi Ayurvedic Wellness Centre, I'd like to follow up on: "${mostRecentActive.subject}".`
    : undefined

  const unreadCount = active.filter((t) => t.unread_by_customer).length

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:gap-7">
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-2 font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
            <Inbox className="h-3.5 w-3.5 text-[#B58A3B]" strokeWidth={2} />
            Messages & Support
          </span>
          <h1
            className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C] sm:text-[36px]"
            style={{ letterSpacing: '-0.025em' }}
          >
            Hello, {firstName}.{' '}
            <span
              className="italic font-normal text-[#006B3C]/70"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              How can we help?
            </span>
          </h1>
          <p className="mt-2 max-w-xl font-body text-[13px] text-[#12372D]/60" style={{ lineHeight: 1.6 }}>
            Write to us through the portal for treatment questions and follow-ups — Vaidya replies within 24 hours on weekdays. For anything urgent, message us on WhatsApp.
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B58A3B]/30 bg-[#EDF4E7] px-3.5 py-1.5 font-heading text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#B58A3B]">
            <Sparkles className="h-3 w-3" strokeWidth={2} />
            {unreadCount} unread
          </span>
        )}
      </header>

      {/* ── QUICK CONTACT TILES ──────────────────────────────────── */}
      <SupportQuickActions whatsappPrefill={whatsappPrefill} />

      {/* ── NEW CONVERSATION ─────────────────────────────────────── */}
      <NewTicketForm initialTopic={initialTopic} initialSubject={initialSubject} />

      {/* ── ACTIVE TICKETS ───────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 font-heading text-[12px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
          Active conversations
          {active.length > 0 && (
            <span className="ml-2 font-mono text-[10.5px] text-[#006B3C]/45">
              {active.length}
            </span>
          )}
        </h2>
        {active.length === 0 ? (
          <div
            className="rounded-3xl border border-dashed border-[#006B3C]/12 bg-white px-5 py-6 text-center"
          >
            <p className="font-heading text-[13px] font-semibold text-[#006B3C]">
              No active conversations.
            </p>
            <p className="mt-1 font-body text-[12px] text-[#12372D]/55" style={{ lineHeight: 1.55 }}>
              Tap &ldquo;Start a new conversation&rdquo; above when you have a question.
            </p>
          </div>
        ) : (
          <ul
            className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
            style={{
              boxShadow:
                '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
            }}
          >
            {active.map((ticket) => (
              <TicketListItem key={ticket.id} ticket={ticket} />
            ))}
          </ul>
        )}
      </section>

      {/* ── RESOLVED TICKETS ─────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 font-heading text-[12px] font-semibold uppercase tracking-[0.22em] text-[#006B3C]/55">
          Resolved
          {resolved.length > 0 && (
            <span className="ml-2 font-mono text-[10.5px] text-[#006B3C]/45">
              {resolved.length}
            </span>
          )}
        </h2>
        {resolved.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-[#006B3C]/12 bg-white px-5 py-4 text-center font-body text-[12px] italic text-[#12372D]/55">
            No resolved conversations yet.
          </p>
        ) : (
          <ul
            className="overflow-hidden rounded-3xl border border-[#006B3C]/8 bg-white"
            style={{
              boxShadow:
                '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
            }}
          >
            {resolved.map((ticket) => (
              <TicketListItem key={ticket.id} ticket={ticket} />
            ))}
          </ul>
        )}
      </section>

      {/* ── CLINIC INFO ──────────────────────────────────────────── */}
      <ClinicInfoCard />
    </div>
  )
}
