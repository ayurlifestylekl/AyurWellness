import Link from 'next/link'
import { requireStaff } from '@/lib/staff/guard'
import { getConsultationsToClear, redactContactList } from '@/lib/staff/appointments'
import StatusBadge from '@/components/staff/StatusBadge'
import AutoRefresh from '@/components/staff/AutoRefresh'

export const dynamic = 'force-dynamic'

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

export default async function DoctorConsultationsPage() {
  const { db, role } = await requireStaff(['admin', 'doctor'])
  const raw = await getConsultationsToClear(db)
  const list = role === 'doctor' ? redactContactList(raw) : raw

  return (
    <div>
      <AutoRefresh />
      <h1 className="font-heading text-[22px] font-extrabold text-primary">Consultations to clear</h1>
      <p className="mb-5 font-body text-[13px] text-dark/55">
        Open each one to record the outcome and clear the patient for treatment. Until cleared, the treatment booking stays locked.
      </p>

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-accent/30 bg-white/60 px-5 py-10 text-center font-body text-[14px] text-dark/50">
          Nothing waiting — all consultations are cleared. 🎉
        </p>
      ) : (
        <div className="divide-y divide-accent/10 overflow-hidden rounded-xl border border-accent/20 bg-white">
          {list.map((c) => (
            <Link key={c.id} href={`/doctor/${c.id}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-cream/60">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-primary">{c.patientName ?? '—'}</div>
                <div className="truncate text-[12.5px] text-dark/55">
                  {[c.treatmentName ?? 'Consultation', fmt(c.appointmentDatetime), c.patientPhone].filter(Boolean).join(' · ')}
                </div>
              </div>
              <StatusBadge status={c.status} />
              <span className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-accent">Clear →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
