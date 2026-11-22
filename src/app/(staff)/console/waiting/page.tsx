import Link from 'next/link'
import { Monitor } from 'lucide-react'
import { requireStaff } from '@/lib/staff/guard'
import { getWaitingBoard, publicName, type WaitingGuest } from '@/lib/staff/waiting'
import { mytDayKey } from '@/lib/datetime'
import AutoRefresh from '@/components/staff/AutoRefresh'
import CheckInButtons from '@/components/staff/CheckInButtons'

export const dynamic = 'force-dynamic'

const time = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: 'numeric', minute: '2-digit' }) : '—')
const minsSince = (iso: string | null, now: number) => (iso ? Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000)) : null)

/**
 * The waiting room: who is arriving, who is waiting (longest first) and who is
 * in treatment. ?screen=1 is a lobby display with first names only.
 */
export default async function WaitingRoomPage({ searchParams }: { searchParams: { screen?: string } }) {
  const { db } = await requireStaff(['admin', 'front_desk'])
  const now = Date.now()
  const board = await getWaitingBoard(db, mytDayKey(new Date()), now)
  const screen = searchParams.screen === '1'

  if (screen) {
    return (
      <div className="min-h-[80vh] rounded-3xl bg-primary p-8 text-white">
        <AutoRefresh intervalMs={15000} />
        <div className="flex items-baseline justify-between">
          <h1 className="font-heading text-[34px] font-extrabold">Waiting room</h1>
          <span className="font-body text-[20px] opacity-80">{time(new Date(now).toISOString())}</span>
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <ScreenList title="Please wait — we’ll call you shortly" guests={board.waiting} line={(g) => (g.therapistName ? `with ${g.therapistName.split(' ')[0]}` : '')} />
          <ScreenList title="In treatment" guests={board.inTreatment} line={(g) => (g.room ? `Room ${g.room}` : '')} />
        </div>
        <Link href="/console/waiting" className="mt-10 inline-block font-body text-[13px] text-white/50 underline">Back to front desk view</Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <AutoRefresh intervalMs={20000} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[22px] font-extrabold text-primary">Waiting room</h1>
          <p className="font-body text-[13px] text-dark/55">
            {board.waiting.length} waiting · {board.inTreatment.length} in treatment · {board.doneToday} done today. Updates on its own.
          </p>
        </div>
        <Link href="/console/waiting?screen=1" className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-primary/40 px-4 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary hover:bg-cream/60">
          <Monitor className="h-4 w-4" /> Lobby screen
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Column title="Arriving soon" empty="No one due in the next hour." guests={board.arriving} now={now} detail={(g) => `Due ${time(g.startsAt)}`} />
        <Column
          title="Waiting"
          empty="No one waiting."
          guests={board.waiting}
          now={now}
          detail={(g) => {
            const m = minsSince(g.checkedInAt, now)
            return m == null ? 'Checked in' : `Waiting ${m} min · checked in ${time(g.checkedInAt)}`
          }}
          warn={(g) => (minsSince(g.checkedInAt, now) ?? 0) >= 15}
        />
        <Column
          title="In treatment"
          empty="No treatments running."
          guests={board.inTreatment}
          now={now}
          detail={(g) => {
            const start = g.startedAt ?? g.startsAt
            if (!start) return 'In progress'
            const end = new Date(new Date(start).getTime() + g.durationMins * 60000).toISOString()
            return `${g.startedAt ? 'Started' : 'Booked'} ${time(start)} · ends about ${time(end)}`
          }}
        />
      </div>
    </div>
  )
}

function Column({ title, empty, guests, detail, warn }: { title: string; empty: string; guests: WaitingGuest[]; now: number; detail: (g: WaitingGuest) => string; warn?: (g: WaitingGuest) => boolean }) {
  return (
    <section className="rounded-2xl border border-accent/20 bg-white p-3">
      <h2 className="mb-2 flex items-center justify-between px-1 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-dark/60">
        {title} <span className="rounded-full bg-cream px-2 py-0.5 text-primary">{guests.length}</span>
      </h2>
      {guests.length === 0 ? (
        <p className="px-1 py-4 font-body text-[13px] italic text-dark/45">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {guests.map((g) => (
            <li key={g.id} className={`rounded-xl border p-3 ${warn?.(g) ? 'border-amber-300 bg-amber-50' : 'border-accent/15 bg-cream/30'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/console/${g.id}`} className="font-body text-[14px] font-semibold text-primary hover:underline">{g.patientName}</Link>
                  <p className="font-body text-[12.5px] text-dark/65">
                    {g.bookingKind === 'consultation' ? 'Consultation' : g.treatmentName ?? 'Treatment'}
                    {g.therapistName ? ` · ${g.therapistName}` : g.bookingKind === 'consultation' ? '' : ' · no therapist yet'}
                    {g.room ? ` · Room ${g.room}` : ''}
                  </p>
                  <p className={`font-body text-[12px] ${warn?.(g) ? 'font-semibold text-amber-800' : 'text-dark/50'}`}>{detail(g)}</p>
                </div>
              </div>
              <div className="mt-2">
                <CheckInButtons id={g.id} status={g.status} bookingKind={g.bookingKind} assignedTherapistCode={g.therapistCode} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ScreenList({ title, guests, line }: { title: string; guests: WaitingGuest[]; line: (g: WaitingGuest) => string }) {
  return (
    <section>
      <h2 className="font-heading text-[16px] font-bold uppercase tracking-[0.14em] text-white/70">{title}</h2>
      {guests.length === 0 ? (
        <p className="mt-4 font-body text-[22px] text-white/50">—</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {guests.map((g, i) => (
            <li key={g.id} className="flex items-baseline gap-4 rounded-2xl bg-white/10 px-5 py-4">
              <span className="font-heading text-[22px] font-extrabold text-white/50">{i + 1}</span>
              <span className="font-heading text-[28px] font-bold">{publicName(g.patientName)}</span>
              <span className="ml-auto font-body text-[18px] text-white/70">{line(g)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
