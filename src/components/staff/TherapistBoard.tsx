import type { TherapistStatus } from '@/lib/staff/appointments'

function timeOf(iso: string | null) {
  return iso ? new Date(iso).toLocaleTimeString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit' }) : '—'
}

export default function TherapistBoard({ board }: { board: TherapistStatus[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {board.map(({ therapist, busy, freeAtISO, withPatient, remainingToday }) => (
        <div
          key={therapist.code}
          className={`rounded-xl border bg-white p-4 ${busy ? 'border-amber-300' : 'border-accent/20'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-heading text-[14px] font-bold text-primary">{therapist.name}</div>
              <div className="font-heading text-[10.5px] font-semibold uppercase tracking-[0.14em] text-dark/45">
                {therapist.code} · {therapist.gender}
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-[0.1em] ${
                busy ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${busy ? 'bg-amber-500' : 'bg-green-500'}`} />
              {busy ? 'Busy' : 'Free'}
            </span>
          </div>

          <div className="mt-3 border-t border-accent/10 pt-2 font-body text-[12.5px] text-dark/65">
            {busy ? (
              <>
                <div>With <strong className="text-dark/80">{withPatient ?? 'a patient'}</strong></div>
                <div>Free at <strong className="text-dark/80">{timeOf(freeAtISO)}</strong> (incl. buffer)</div>
              </>
            ) : (
              <div>Available now</div>
            )}
            <div className="mt-1 text-dark/45">
              {remainingToday} appointment{remainingToday === 1 ? '' : 's'} left today
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
