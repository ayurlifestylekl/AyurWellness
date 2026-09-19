import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import {
  listTickets,
  type TicketFilters,
  type TicketListItem,
} from '@/lib/admin/messages/queries'
import {
  DEMO_ADMIN_EMAIL,
  MOCK_TICKETS,
} from '@/lib/admin/messages/mocks'
import MessagesFilters from './MessagesFilters'
import MessagesList from './MessagesList'

export const metadata = { title: 'Messages · Admin' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { segment?: string; topic?: string; q?: string }
}

function filterMocks(items: TicketListItem[], filters: TicketFilters): TicketListItem[] {
  let arr = items
  if (filters.segment === 'unread') arr = arr.filter((t) => t.unreadByClinic)
  else if (filters.segment === 'open') arr = arr.filter((t) => t.status === 'open')
  else if (filters.segment === 'awaiting_customer')
    arr = arr.filter((t) => t.status === 'awaiting-customer')
  else if (filters.segment === 'resolved') arr = arr.filter((t) => t.status === 'resolved')
  else if (filters.segment === 'closed') arr = arr.filter((t) => t.status === 'closed')
  if (filters.topic) arr = arr.filter((t) => t.topic === filters.topic)
  if (filters.search) {
    const s = filters.search.toLowerCase()
    arr = arr.filter(
      (t) =>
        t.subject.toLowerCase().includes(s) ||
        (t.customerName ?? '').toLowerCase().includes(s) ||
        (t.customerEmail ?? '').toLowerCase().includes(s),
    )
  }
  return [...arr].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  )
}

export default async function AdminMessagesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const me = await getCurrentUser()
  const filters: TicketFilters = {
    segment: (searchParams.segment as TicketFilters['segment']) ?? 'unread',
    topic: searchParams.topic as TicketFilters['topic'] | undefined,
    search: searchParams.q,
    limit: 100,
  }
  const real = await listTickets(supabase, filters)

  const isDemoAdmin = me?.email === DEMO_ADMIN_EMAIL
  const showMocks = isDemoAdmin && real.items.length === 0
  const items = showMocks ? filterMocks(MOCK_TICKETS, filters) : real.items
  const total = showMocks ? items.length : real.total

  const unreadCount = (showMocks ? MOCK_TICKETS : real.items).filter(
    (t) => t.unreadByClinic,
  ).length

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <header>
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          Customer support
        </span>
        <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C]">
          Messages
        </h1>
        <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
          {total} ticket{total === 1 ? '' : 's'} in this view · {unreadCount} unread
          {showMocks ? ' · demo data' : ''}
        </p>
      </header>

      <MessagesFilters />
      <MessagesList items={items} />
    </div>
  )
}
