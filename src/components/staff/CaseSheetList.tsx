import Link from 'next/link'
import { FilePlus2 } from 'lucide-react'
import { SHEETS, sheetSummary } from '@/lib/staff/case-sheets'
import type { CaseSheet } from '@/lib/staff/patient-files'

const fmtDay = (ymd: string) =>
  new Date(`${ymd}T12:00:00+08:00`).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric' })

/** The patient's case sheets, newest first, with buttons to start a primary or follow-up sheet. */
export default function CaseSheetList({ patientId, sheets }: { patientId: string; sheets: CaseSheet[] }) {
  const hasPrimary = sheets.some((s) => s.kind === 'primary')
  const btn = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-heading text-[10px] font-bold uppercase tracking-[0.12em]'
  return (
    <section className="rounded-2xl border border-accent/20 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-[15px] font-bold text-primary">Case sheets</h2>
        <div className="flex flex-wrap gap-2">
          <Link href={`/doctor/case-sheets/new?patient=${patientId}&kind=primary`} className={`${btn} ${hasPrimary ? 'border border-accent/30 text-primary hover:bg-cream/60' : 'bg-accent text-white hover:bg-accent/90'}`}>
            <FilePlus2 className="h-4 w-4" /> Primary sheet
          </Link>
          <Link href={`/doctor/case-sheets/new?patient=${patientId}&kind=follow_up`} className={`${btn} ${hasPrimary ? 'bg-accent text-white hover:bg-accent/90' : 'border border-accent/30 text-primary hover:bg-cream/60'}`}>
            <FilePlus2 className="h-4 w-4" /> Follow-up sheet
          </Link>
        </div>
      </div>
      {sheets.length === 0 ? (
        <p className="mt-3 font-body text-[13px] italic text-dark/45">No case sheets yet. Start with the primary case sheet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-accent/10">
          {sheets.map((s) => (
            <li key={s.id}>
              <Link href={`/doctor/case-sheets/${s.id}`} className="flex items-start gap-3 py-2.5 hover:bg-cream/40">
                <span className="w-24 flex-none font-heading text-[12px] font-bold text-primary">{fmtDay(s.sheetDate)}</span>
                <span className="min-w-0">
                  <span className={`mr-2 inline-block rounded-full px-2 py-0.5 font-heading text-[9.5px] font-bold uppercase tracking-wide ${s.kind === 'primary' ? 'bg-primary text-white' : 'bg-accent/15 text-accent'}`}>
                    {SHEETS[s.kind].short}
                  </span>
                  <span className="font-body text-[13px] text-dark/70">{sheetSummary(s.kind, s.data) || 'No notes yet'}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
