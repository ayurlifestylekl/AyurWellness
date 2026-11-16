import Link from 'next/link'
import type { PatientListEntry } from '@/lib/staff/patients'

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium' }) : '—'
}

const SHOW = 200

/** Searchable patient list shared by the console and doctor portal. */
export default function PatientDirectory({
  patients,
  total,
  query,
  basePath,
  hideContact,
}: {
  patients: PatientListEntry[]
  total: number
  query: string
  basePath: string
  hideContact: boolean
}) {
  const shown = patients.slice(0, SHOW)
  return (
    <div>
      <form method="get" className="mb-4 flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder={hideContact ? 'Search by name…' : 'Search name or phone…'}
          className="w-full max-w-sm rounded-lg border border-accent/30 bg-white px-3 py-2 font-body text-[14px] text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-accent/90">
          Search
        </button>
        {query && (
          <Link href={basePath} className="rounded-lg border border-accent/30 px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-dark/55 hover:text-primary">
            Clear
          </Link>
        )}
      </form>

      <p className="mb-3 font-body text-[12.5px] text-dark/55">
        {query ? `${patients.length} of ${total} patients match “${query}”.` : `${total} patients.`}
        {patients.length > SHOW && ` Showing the ${SHOW} most recent — search to find others.`}
      </p>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-accent/30 bg-white/60 px-5 py-10 text-center font-body text-[14px] text-dark/50">
          {query ? `No patients match “${query}”.` : 'No patients yet.'}
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
                <th className="px-4 py-3">Next visit</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-accent/10">
              {shown.map((p) => (
                <tr key={p.key} className="hover:bg-cream/60">
                  <td className="px-4 py-3">
                    <Link href={`${basePath}/${p.anchorId}`} className="font-semibold text-primary hover:underline">
                      {p.name}
                    </Link>
                    {p.gender && <span className="ml-2 text-[11px] text-dark/45">{p.gender === 'male' ? 'M' : 'F'}</span>}
                    {p.isGuest && <span className="ml-2 text-[11px] uppercase tracking-wide text-dark/40">guest</span>}
                  </td>
                  {!hideContact && <td className="px-4 py-3 text-dark/70">{p.phone ?? '—'}</td>}
                  <td className="px-4 py-3 text-center text-dark/70">{p.visits}</td>
                  <td className="px-4 py-3 text-dark/70">{fmtDate(p.lastVisitISO)}</td>
                  <td className="px-4 py-3 text-dark/70">{p.nextVisitISO ? <span className="font-semibold text-emerald-700">{fmtDate(p.nextVisitISO)}</span> : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`${basePath}/${p.anchorId}`} className="font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-accent hover:text-primary">
                      Open →
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
