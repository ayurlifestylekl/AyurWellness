import Link from 'next/link'
import { requireStaff } from '@/lib/staff/guard'
import { getPatientDirectory } from '@/lib/staff/appointments'

export const dynamic = 'force-dynamic'

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium' }) : '—'
}

export default async function DoctorPatientsPage({ searchParams }: { searchParams: { q?: string } }) {
  const { db, role } = await requireStaff(['admin', 'doctor'])
  const hideContact = role === 'doctor' // doctors may not see contact details (PDPA)
  const all = await getPatientDirectory(db)
  const q = (searchParams.q ?? '').trim().toLowerCase()
  const list = q
    ? all.filter(
        (p) =>
          (p.name ?? '').toLowerCase().includes(q) ||
          (!hideContact && (p.phone ?? '').toLowerCase().includes(q)),
      )
    : all

  return (
    <div>
      <h1 className="font-heading text-[22px] font-extrabold text-primary">Patients</h1>
      <p className="mb-5 font-body text-[13px] text-dark/55">Everyone who has booked. Search by {hideContact ? 'name' : 'name or phone'}, then open the latest visit for full history.</p>

      <form method="get" className="mb-5 flex gap-2">
        <input
          name="q"
          defaultValue={searchParams.q ?? ''}
          placeholder={hideContact ? 'Search by name…' : 'Search name or phone…'}
          className="w-full max-w-sm rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-accent/90">
          Search
        </button>
        {q && (
          <Link href="/doctor/patients" className="rounded-lg border border-accent/30 px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-dark/55 hover:text-primary">
            Clear
          </Link>
        )}
      </form>

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-accent/30 bg-white/60 px-5 py-10 text-center font-body text-[14px] text-dark/50">
          {q ? `No patients match “${searchParams.q}”.` : 'No patients yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-accent/20 bg-white">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-accent/20 font-heading text-[10px] uppercase tracking-[0.12em] text-dark/45">
              <tr>
                <th className="px-4 py-3">Patient</th>
                {!hideContact && <th className="px-4 py-3">Phone</th>}
                <th className="px-4 py-3 text-center">Visits</th>
                <th className="px-4 py-3">Last visit</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-accent/10">
              {list.map((p) => (
                <tr key={p.key} className="hover:bg-cream/60">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-primary">{p.name ?? '—'}</span>
                    {p.isGuest && <span className="ml-2 text-[11px] uppercase tracking-wide text-dark/40">guest</span>}
                  </td>
                  {!hideContact && <td className="px-4 py-3 text-dark/70">{p.phone ?? '—'}</td>}
                  <td className="px-4 py-3 text-center text-dark/70">{p.visits}</td>
                  <td className="px-4 py-3 text-dark/70">{fmtDate(p.lastVisitISO)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/doctor/${p.latestAppointmentId}`} className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-accent hover:text-primary">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
