import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getTicketById } from '@/lib/admin/messages/queries'
import {
  DEMO_ADMIN_EMAIL,
  isMockTicketId,
  MOCK_TICKETS,
  MOCK_THREADS,
} from '@/lib/admin/messages/mocks'
import ReplyForm from './ReplyForm'
import TicketControls from './TicketControls'
import InternalNotesPanel from './InternalNotesPanel'

export const metadata = { title: 'Ticket · Admin' }
export const dynamic = 'force-dynamic'

const STATUS_CLASS: Record<string, string> = {
  open:                'bg-amber-50 text-amber-700 border-amber-200',
  'awaiting-customer': 'bg-blue-50 text-blue-700 border-blue-200',
  resolved:            'bg-emerald-100 text-emerald-800 border-emerald-300',
  closed:              'bg-slate-100 text-slate-700 border-slate-300',
}

export default async function AdminTicketDetailPage({
  params,
}: {
  params: { ticketId: string }
}) {
  const supabase = await createClient()
  const me = await getCurrentUser()
  const isDemoAdmin = me?.email === DEMO_ADMIN_EMAIL
  const useMock = isDemoAdmin && isMockTicketId(params.ticketId)

  let ticket
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let messages: any[] = []

  if (useMock) {
    const mockList = MOCK_TICKETS.find((t) => t.id === params.ticketId)
    const thread = MOCK_THREADS[params.ticketId]
    if (!mockList) notFound()
    ticket = {
      id: mockList.id,
      customer_id: mockList.customerId,
      topic: mockList.topic,
      subject: mockList.subject,
      status: mockList.status,
      last_message_at: mockList.lastMessageAt,
      created_at: mockList.createdAt,
      unread_by_customer: false,
      unread_by_clinic: mockList.unreadByClinic,
      internal_notes: null,
      assigned_to_admin_id: null,
      customer: thread?.customer ?? {
        id: mockList.customerId,
        full_name: mockList.customerName,
        email: mockList.customerEmail,
        phone_number: mockList.customerPhone,
        allergies: null,
        medical_conditions: null,
      },
      assignee: null,
    }
    messages = thread?.messages ?? []
  } else {
    const res = await getTicketById(supabase, params.ticketId)
    if (!res || !res.ticket) notFound()
    ticket = res.ticket
    messages = res.messages
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t: any = ticket
  const cust = Array.isArray(t.customer) ? t.customer[0] : t.customer
  const assignee = Array.isArray(t.assignee) ? t.assignee[0] : t.assignee

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <Link
        href="/admin/messages"
        className="text-[11px] uppercase tracking-wider text-[#006B3C]/55 hover:text-[#B58A3B]"
      >
        ← Back to inbox
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-[24px] font-bold text-[#006B3C]">
              {t.subject}
            </h1>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_CLASS[t.status] ?? ''}`}
            >
              {t.status}
            </span>
            {useMock ? (
              <span className="rounded-full border border-[#B58A3B]/40 bg-[#EDF4E7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#B58A3B]">
                Demo data
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[12px] text-[#12372D]/65">
            Opened {new Date(t.created_at).toLocaleString('en-MY')} ·{' '}
            <span className="capitalize">{t.topic}</span>
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          {/* Thread */}
          <article className="overflow-hidden rounded-2xl border border-[#006B3C]/8 bg-white">
            <header className="border-b border-[#006B3C]/6 px-5 py-3 font-heading text-[13px] font-semibold text-[#006B3C]">
              Conversation ({messages.length})
            </header>
            {messages.length === 0 ? (
              <p className="px-5 py-6 text-center text-[12.5px] italic text-[#12372D]/55">
                No messages yet.
              </p>
            ) : (
              <ul className="divide-y divide-[#006B3C]/6">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {messages.map((m: any) => {
                  const isClinic = m.sender_kind === 'clinic'
                  const isSystem = m.sender_kind === 'system'
                  return (
                    <li
                      key={m.id}
                      className={`flex flex-col gap-1 px-5 py-3 ${
                        isClinic ? 'bg-[#EDF4E7]/30' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-wider ${
                            isClinic
                              ? 'text-[#B58A3B]'
                              : isSystem
                                ? 'text-[#12372D]/55'
                                : 'text-[#006B3C]/70'
                          }`}
                        >
                          {isClinic
                            ? 'Clinic reply'
                            : isSystem
                              ? 'System'
                              : cust?.full_name ?? 'Customer'}
                        </span>
                        <span className="text-[10.5px] text-[#12372D]/55">
                          {new Date(m.created_at).toLocaleString('en-MY')}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-[13px] text-[#006B3C]">
                        {m.body}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </article>

          <ReplyForm ticketId={t.id} />
        </div>

        <aside className="flex flex-col gap-4">
          {/* Customer card */}
          <article className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
            <h3 className="font-heading text-[12.5px] font-semibold text-[#006B3C]">
              Customer
            </h3>
            {cust ? (
              <>
                <p className="mt-2 text-[13px] font-semibold">{cust.full_name ?? '—'}</p>
                <p className="text-[12px] text-[#12372D]/65">{cust.email}</p>
                <p className="text-[12px] text-[#12372D]/65">{cust.phone_number}</p>
                {cust.allergies || cust.medical_conditions ? (
                  <div className="mt-3 border-t border-[#006B3C]/6 pt-3 text-[11.5px]">
                    {cust.allergies ? (
                      <p>
                        <span className="text-[#12372D]/55">Allergies: </span>
                        {cust.allergies}
                      </p>
                    ) : null}
                    {cust.medical_conditions ? (
                      <p>
                        <span className="text-[#12372D]/55">Conditions: </span>
                        {cust.medical_conditions}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <Link
                  href={`/admin/customers/${t.customer_id}`}
                  className="mt-3 inline-block text-[11.5px] font-semibold text-[#B58A3B] hover:text-[#006B3C]"
                >
                  View full profile →
                </Link>
              </>
            ) : (
              <p className="mt-2 text-[12px] italic text-[#12372D]/55">No customer linked.</p>
            )}
          </article>

          <TicketControls
            ticketId={t.id}
            status={t.status}
            topic={t.topic}
            assignedToAdminId={t.assigned_to_admin_id}
            currentAdminId={me?.authId ?? ''}
            assigneeName={assignee?.full_name ?? null}
            unreadByClinic={t.unread_by_clinic}
          />

          <InternalNotesPanel ticketId={t.id} initial={t.internal_notes} />
        </aside>
      </section>
    </div>
  )
}
