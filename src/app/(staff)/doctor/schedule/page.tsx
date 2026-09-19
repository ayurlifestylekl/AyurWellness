import Link from 'next/link'
import { requireStaff } from '@/lib/staff/guard'
import { getDoctorPatients, getConsultationsToClear, redactContactList } from '@/lib/staff/appointments'
import BookingQueue from '@/components/staff/BookingQueue'
import AutoRefresh from '@/components/staff/AutoRefresh'
import { mytDayKey } from '@/lib/datetime'

export const dynamic = 'force-dynamic'

export default async function DoctorSchedulePage() {
  const { db, role } = await requireStaff(['admin', 'doctor'])
  const [rawPatients, toClear] = await Promise.all([getDoctorPatients(db), getConsultationsToClear(db)])
  const patients = role === 'doctor' ? redactContactList(rawPatients) : rawPatients

  const todayStr = mytDayKey(new Date())
  const today = patients.filter((p) => p.appointmentDatetime && mytDayKey(p.appointmentDatetime) === todayStr)
  const upcoming = patients.filter((p) => !p.appointmentDatetime || mytDayKey(p.appointmentDatetime) !== todayStr)

  return (
    <div>
      <AutoRefresh />
      <h1 className="font-heading text-[22px] font-extrabold text-primary">Schedule</h1>
      <p className="mb-5 font-body text-[13px] text-dark/55">Your booked patients. Open one for health details and clinical notes.</p>

      {toClear.length > 0 && (
        <Link
          href="/doctor/consultations"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 transition-colors hover:bg-amber-100"
        >
          <span className="font-body text-[13.5px] text-amber-900">
            <strong>{toClear.length}</strong> consultation{toClear.length > 1 ? 's' : ''} awaiting your clearance before treatment.
          </span>
          <span className="font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">Review →</span>
        </Link>
      )}

      <section className="mb-8">
        <h2 className="mb-2 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-accent">Today</h2>
        <BookingQueue appointments={today} linkBase="/doctor" emptyLabel="No appointments today." />
      </section>

      <section>
        <h2 className="mb-2 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-accent">Upcoming</h2>
        <BookingQueue appointments={upcoming} linkBase="/doctor" emptyLabel="No upcoming appointments." />
      </section>
    </div>
  )
}
