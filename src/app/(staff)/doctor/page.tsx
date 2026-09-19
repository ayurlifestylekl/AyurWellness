import Link from 'next/link'
import { requireStaff } from '@/lib/staff/guard'
import {
  getTodayAppointments,
  getIncomingRequests,
  getConsultationsToClear,
  getPatientDirectory,
} from '@/lib/staff/appointments'
import StatCard from '@/components/staff/StatCard'
import StatusBadge from '@/components/staff/StatusBadge'
import AutoRefresh from '@/components/staff/AutoRefresh'
import { sweepExpiredBookingsSafe } from '@/lib/booking/expiry'

export const dynamic = 'force-dynamic'

function timeOf(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit' }) : '—'
}

export default async function DoctorOverviewPage() {
  const { db } = await requireStaff(['admin', 'doctor'])
  // Expire overdue payment holds before rendering so the list is never stale.
  await sweepExpiredBookingsSafe()
  const [today, requests, toClear, patients] = await Promise.all([
    getTodayAppointments(db),
    getIncomingRequests(db),
    getConsultationsToClear(db),
    getPatientDirectory(db),
  ])
  const pending = requests.filter((r) => r.status === 'pending')

  return (
    <div>
      <AutoRefresh />
      <h1 className="font-heading text-[22px] font-extrabold text-primary">Overview</h1>
      <p className="mb-5 font-body text-[13px] text-dark/55">
        {new Date().toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's patients" value={today.length} href="/doctor/schedule" hint="Booked for today" />
        <StatCard label="New requests" value={pending.length} href="/doctor/requests" tone={pending.length > 0 ? 'alert' : 'default'} hint="Awaiting approval" />
        <StatCard label="To clear" value={toClear.length} href="/doctor/consultations" tone={toClear.length > 0 ? 'alert' : 'default'} hint="Consultations" />
        <StatCard label="Total patients" value={patients.length} href="/doctor/patients" hint="Have booked before" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's schedule preview */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-accent">Today&apos;s schedule</h2>
            <Link href="/doctor/schedule" className="font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-dark/50 hover:text-primary">View all →</Link>
          </div>
          {today.length === 0 ? (
            <p className="rounded-xl border border-dashed border-accent/30 bg-white/60 px-5 py-8 text-center font-body text-[13.5px] text-dark/50">No appointments today.</p>
          ) : (
            <div className="divide-y divide-accent/10 overflow-hidden rounded-xl border border-accent/20 bg-white">
              {today.slice(0, 6).map((a) => (
                <Link key={a.id} href={`/doctor/${a.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-cream/50">
                  <span className="w-14 flex-none font-heading text-[13px] font-bold text-primary">{timeOf(a.appointmentDatetime)}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-dark">{a.patientName ?? '—'}</span>
                  <StatusBadge status={a.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Needs attention */}
        <section>
          <h2 className="mb-2 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-accent">Needs your attention</h2>
          <div className="space-y-2">
            <AttentionRow href="/doctor/requests" label="Requests awaiting approval" count={pending.length} />
            <AttentionRow href="/doctor/consultations" label="Consultations to clear" count={toClear.length} />
            {pending.length === 0 && toClear.length === 0 && (
              <p className="rounded-xl border border-green-200 bg-green-50/60 px-4 py-3 font-body text-[13.5px] text-green-800">All caught up — nothing waiting. 🎉</p>
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
