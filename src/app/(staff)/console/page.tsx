import Link from 'next/link'
import { requireStaff } from '@/lib/staff/guard'
import {
  listAppointments,
  getTodayAppointments,
  getRefundExceptions,
} from '@/lib/staff/appointments'
import { sweepExpiredBookingsSafe } from '@/lib/booking/expiry'
import type { BookingStatus } from '@/types/booking'
import BookingQueue from '@/components/staff/BookingQueue'
import TodayBoard from '@/components/staff/TodayBoard'
import StatCard from '@/components/staff/StatCard'
import StatusBadge from '@/components/staff/StatusBadge'
import AutoRefresh from '@/components/staff/AutoRefresh'

export const dynamic = 'force-dynamic'

const TABS: { key: string; label: string; status?: BookingStatus | BookingStatus[]; unassignedOnly?: boolean }[] = [
  { key: 'today', label: 'Today' },
  { key: 'needs-therapist', label: 'Needs therapist', status: ['confirmed', 'checked_in', 'in_progress'], unassignedOnly: true },
  { key: 'new', label: 'New requests', status: 'pending' },
  { key: 'awaiting', label: 'Awaiting payment', status: 'awaiting_payment' },
  { key: 'confirmed', label: 'Confirmed', status: ['confirmed', 'checked_in', 'in_progress'] },
  { key: 'refunds', label: 'Refunds' },
  { key: 'all', label: 'All' },
]

function timeOf(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit' }) : '—'
}

export default async function ConsolePage({
  searchParams,
}: {
  searchParams: { tab?: string; q?: string }
}) {
  const { db } = await requireStaff(['admin', 'front_desk'])
  // Expire overdue payment holds before rendering, so the console never shows a
  // stale "awaiting payment" — the page auto-refreshes, keeping this current.
  await sweepExpiredBookingsSafe()
  const q = (searchParams.q ?? '').trim()
  const hasTab = !!searchParams.tab
  const tab = TABS.find((t) => t.key === searchParams.tab)

  const heading = q ? 'Search' : tab ? tab.label : 'Overview'

  return (
    <div>
      <AutoRefresh />
      <div className="mb-5">
        <h1 className="font-heading text-[22px] font-extrabold text-primary">{heading}</h1>
        <p className="font-body text-[13px] text-dark/55">Assign therapists to paid bookings, check guests in, and manage the day.</p>
      </div>

      {/* Search — always available, overrides the view when present. */}
      <form method="get" className="mb-5 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or phone…"
          className="w-full max-w-sm rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-accent/90">
          Search
        </button>
        {q && (
          <Link href="/console" className="rounded-lg border border-accent/30 px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-dark/55 hover:text-primary">
            Clear
          </Link>
        )}
      </form>

      {q ? <SearchResults db={db} q={q} /> : hasTab && tab ? <TabView db={db} tab={tab} /> : <Overview db={db} />}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function Overview({ db }: { db: any }) {
  const [awaiting, confirmed, unassigned, today, refunds] = await Promise.all([
    listAppointments(db, { status: 'awaiting_payment' }),
    listAppointments(db, { status: ['confirmed', 'checked_in', 'in_progress'] }),
    listAppointments(db, { status: ['confirmed', 'checked_in', 'in_progress'], unassignedOnly: true }),
    getTodayAppointments(db),
    getRefundExceptions(db),
  ])
  const consultationsToday = today.filter((a) => a.bookingKind === 'consultation').length

  return (
    <div>
      {/* Order matches the operational workflow: therapist assignment and today's
          schedule are the primary loop; awaiting payment is a read-only view of
          customers mid-checkout; therapist availability closes the loop. Manual
          "pending" requests from staff-created bookings are rare/internal and are
          discoverable via the "All" tab rather than surfaced here. */}
      <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Needs therapist" value={unassigned.length} href="/console?tab=needs-therapist" tone={unassigned.length > 0 ? 'alert' : 'default'} hint="Paid, no one assigned" />
        <StatCard label="Today" value={today.length} href="/console?tab=today" hint="Appointments today" />
        <StatCard label="Confirmed" value={confirmed.length} href="/console?tab=confirmed" hint="Paid and on the books" />
        <StatCard label="Awaiting payment" value={awaiting.length} href="/console?tab=awaiting" hint="Customer mid-checkout" />
        <StatCard label="Consultations today" value={consultationsToday} href="/console/doctors" tone={consultationsToday > 0 ? 'good' : 'default'} hint="View Vaidya schedule" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-accent">Today&apos;s schedule</h2>
            <Link href="/console?tab=today" className="font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-dark/50 hover:text-primary">View all →</Link>
          </div>
          {today.length === 0 ? (
            <p className="rounded-xl border border-dashed border-accent/30 bg-white/60 px-5 py-8 text-center font-body text-[13.5px] text-dark/50">No appointments today.</p>
          ) : (
            <div className="divide-y divide-accent/10 overflow-hidden rounded-xl border border-accent/20 bg-white">
              {today.slice(0, 6).map((a) => (
                <Link key={a.id} href={`/console/${a.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-cream/50">
                  <span className="w-14 flex-none font-heading text-[13px] font-bold text-primary">{timeOf(a.appointmentDatetime)}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-dark">{a.patientName ?? '—'}</span>
                  <StatusBadge status={a.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-accent">Needs attention</h2>
          <div className="space-y-2">
            <AttentionRow href="/console?tab=needs-therapist" label="paid booking(s) with no therapist assigned" count={unassigned.length} />
            <AttentionRow href="/console?tab=awaiting" label="awaiting customer payment" count={awaiting.length} />
            <AttentionRow href="/console?tab=refunds" label="refunds requiring staff attention" count={refunds.length} />
            {awaiting.length === 0 && unassigned.length === 0 && refunds.length === 0 && (
              <p className="rounded-xl border border-green-200 bg-green-50/60 px-4 py-3 font-body text-[13.5px] text-green-800">All clear — nothing waiting. 🎉</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function AttentionRow({ href, label, count }: { href: string; label: string; count: number }) {
  if (count === 0) return null
  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 transition-colors hover:bg-amber-100">
      <span className="font-body text-[13.5px] text-amber-900"><strong>{count}</strong> {label}</span>
      <span className="font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">Open →</span>
    </Link>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function TabView({ db, tab }: { db: any; tab: { key: string; status?: BookingStatus | BookingStatus[]; unassignedOnly?: boolean } }) {
  if (tab.key === 'today') {
    const today = await getTodayAppointments(db)
    return <TodayBoard appointments={today} />
  }
  if (tab.key === 'refunds') {
    const exceptions = await getRefundExceptions(db)
    return (
      <div className="space-y-3">
        {exceptions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-accent/30 bg-white/60 px-5 py-8 text-center font-body text-[13.5px] text-dark/50">
            No refunds require attention right now.
          </p>
        ) : (
          exceptions.map((r) => (
            <Link key={r.id} href={`/console/${r.appointmentId}`} className="flex flex-col gap-1 rounded-xl border border-accent/20 bg-white p-4 transition hover:bg-cream/50">
              <div className="flex items-center justify-between">
                <span className="font-heading text-[14px] font-bold text-primary">{r.patientName ?? 'Guest'} — {r.treatmentName ?? 'Treatment'}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wider text-amber-800">{r.status}</span>
              </div>
              <p className="font-body text-[13px] text-dark/60">
                RM{r.amountRm} via {r.provider}. Requested {new Date(r.createdAt).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short' })}
                {r.bankCode && r.bankAccountLast4 && (
                  <> — refund recipient <strong>{r.bankCode} •••• {r.bankAccountLast4}</strong></>
                )}
              </p>
            </Link>
          ))
        )}
      </div>
    )
  }
  // "All" reads like an activity log — the most recently touched booking first.
  const appointments = await listAppointments(db, {
    status: tab.status,
    unassignedOnly: tab.unassignedOnly,
    orderBy: tab.key === 'all' ? 'activity' : 'requested',
  })
  return (
    <BookingQueue
      appointments={appointments}
      linkBase="/console"
      emptyLabel={tab.key === 'needs-therapist' ? 'Every paid booking has a therapist assigned. 🎉' : 'Nothing in this view yet.'}
    />
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function SearchResults({ db, q }: { db: any; q: string }) {
  const results = await listAppointments(db, { search: q })
  return (
    <div>
      <p className="mb-3 font-body text-[12.5px] text-dark/55">
        {results.length} result{results.length === 1 ? '' : 's'} for “{q}”.
      </p>
      <BookingQueue appointments={results} linkBase="/console" emptyLabel={`No bookings match “${q}”.`} />
    </div>
  )
}
