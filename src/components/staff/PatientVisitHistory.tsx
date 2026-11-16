import Link from 'next/link'
import StatusBadge from '@/components/staff/StatusBadge'
import type { PatientVisit } from '@/lib/staff/patients'

function fmt(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'
}

/**
 * Every visit by the same patient. Practitioner views pass `showClinical` to
 * include the Vaidya's notes and consultation outcomes; front desk doesn't
 * see clinical notes.
 */
export default function PatientVisitHistory({
  visits,
  currentId,
  patientName,
  linkBase,
  showClinical = false,
}: {
  visits: PatientVisit[]
  currentId: string
  patientName: string | null
  linkBase: string
  showClinical?: boolean
}) {
  const others = visits.filter((v) => v.id !== currentId)

  return (
    <div className="rounded-xl border border-accent/30 bg-white p-5">
      <h3 className="font-heading text-[12px] font-bold uppercase tracking-[0.16em] text-accent">
        Visit history {visits.length > 0 && <span className="text-dark/40">· {visits.length} booking{visits.length === 1 ? '' : 's'}</span>}
      </h3>
      {others.length === 0 ? (
        <p className="mt-2 font-body text-[13px] text-dark/55">
          {visits.length === 0 ? 'No bookings yet.' : 'First visit — no earlier bookings for this patient.'}
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-accent/10">
          {visits.map((v) => {
            const current = v.id === currentId
            return (
              <li key={v.id} className={`py-3 ${current ? 'opacity-60' : ''}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-heading text-[12.5px] font-bold text-primary">{fmt(v.whenISO)}</span>
                  <StatusBadge status={v.status} />
                  {current && <span className="font-heading text-[10px] uppercase tracking-[0.12em] text-dark/45">this booking</span>}
                </div>
                <div className="mt-0.5 font-body text-[13px] text-dark/75">
                  {v.bookingKind === 'consultation' ? 'Consultation' : v.treatmentName ?? 'Treatment'}
                  {v.therapistName && <span className="text-dark/50"> · {v.therapistName}</span>}
                  {v.patientName && v.patientName.trim().toLowerCase() !== (patientName ?? '').trim().toLowerCase() && (
                    <span className="text-dark/50"> · booked as “{v.patientName}”</span>
                  )}
                  {!current && (
                    <Link href={`${linkBase}/${v.id}`} className="ml-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.1em] text-accent hover:text-primary">
                      Open →
                    </Link>
                  )}
                </div>
                {showClinical && v.consultationOutcome && (
                  <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-emerald-50 px-3 py-2 font-body text-[12.5px] text-emerald-900">
                    <span className="font-semibold">Outcome: </span>
                    {v.consultationOutcome}
                  </p>
                )}
                {showClinical && v.clinicalNotes && (
                  <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-cream/70 px-3 py-2 font-body text-[12.5px] text-dark/75">
                    <span className="font-semibold">Notes: </span>
                    {v.clinicalNotes}
                  </p>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
