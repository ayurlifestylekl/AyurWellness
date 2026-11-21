import { SHEETS, type CaseSheetData, type CaseSheetKind, type PrescriptionRow } from '@/lib/staff/case-sheets'
import { CLINIC_NAME } from '@/lib/clinic'

/**
 * A saved case sheet, laid out like the doctors' paper form. When printed
 * only the sheet prints (the dashboard around it is hidden).
 */
export default function CaseSheetView({
  kind,
  data,
  sheetDate,
  header,
}: {
  kind: CaseSheetKind
  data: CaseSheetData
  sheetDate: string
  header: { name: string; ageGender: string; registrationNo: string | null }
}) {
  const sheet = SHEETS[kind]
  const date = new Date(`${sheetDate}T12:00:00+08:00`).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <article className="case-sheet-print mx-auto max-w-4xl rounded-2xl border border-accent/20 bg-white p-6 sm:p-8">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .case-sheet-print, .case-sheet-print * { visibility: visible !important; }
          .case-sheet-print { position: absolute; inset: 0 auto auto 0; width: 100%; border: 0 !important; padding: 0 !important; }
          @page { size: A4; margin: 14mm; }
        }
      `}</style>
      <p className="text-center font-body text-[11px] uppercase tracking-[0.18em] text-dark/45">{CLINIC_NAME}</p>
      <h1 className="mt-1 text-center font-heading text-[20px] font-extrabold uppercase tracking-wide text-primary">{sheet.title}</h1>

      <dl className="mt-4 grid gap-x-8 border-y border-accent/25 font-body text-[13px] sm:grid-cols-2">
        {[
          ['Patient name', header.name],
          ['Age / Gender', header.ageGender || '—'],
          ['Registration no', header.registrationNo ?? '—'],
          ['Date', date],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-3 border-b border-accent/10 py-1.5">
            <dt className="w-32 flex-none font-semibold text-primary">{k}:</dt>
            <dd className="text-dark">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 space-y-5">
        {sheet.sections.map((section) => (
          <section key={section.title} className="break-inside-avoid">
            <h2 className="mb-1.5 font-heading text-[12.5px] font-bold uppercase tracking-[0.05em] text-primary">{section.title}</h2>
            {section.kind === 'prescription' ? (
              <PrescriptionTable rows={(data[section.key] as PrescriptionRow[]) ?? []} />
            ) : section.kind === 'pariksha' ? (
              <div className="grid gap-x-8 sm:grid-cols-2">
                {section.fields.map((f) => (
                  <div key={f.key} className="flex gap-3 border-b border-accent/15 py-1.5 font-body text-[13px]">
                    <span className="w-40 flex-none text-dark/65">{f.label}:</span>
                    <span className="text-dark">{(data[f.key] as string) || '—'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`grid gap-3 rounded-lg border border-primary/40 p-3 ${section.fields.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                {section.fields.map((f) => (
                  <div key={f.key}>
                    {section.fields.length > 1 && <p className="mb-1 font-body text-[12px] font-semibold text-dark/70">• {f.label}</p>}
                    <p className="min-h-[3rem] whitespace-pre-wrap font-body text-[13.5px] leading-relaxed text-dark">
                      {(data[f.key] as string) || <span className="italic text-dark/35">—</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </article>
  )
}

function PrescriptionTable({ rows }: { rows: PrescriptionRow[] }) {
  const filled = rows.map((r, i) => ({ ...r, n: i + 1 })).filter((r) => r.medicine.trim() || r.dose.trim() || r.duration.trim())
  if (!filled.length) return <p className="font-body text-[13px] italic text-dark/40">No medicines prescribed.</p>
  return (
    <table className="w-full border-collapse font-body text-[13px]">
      <thead>
        <tr className="bg-primary text-left text-white">
          <th className="w-12 px-3 py-1.5 font-semibold">S.No.</th>
          <th className="px-3 py-1.5 font-semibold">Medicine / Formulation name</th>
          <th className="px-3 py-1.5 font-semibold">Dose &amp; timing (Anupana)</th>
          <th className="w-32 px-3 py-1.5 font-semibold">Duration</th>
        </tr>
      </thead>
      <tbody>
        {filled.map((r) => (
          <tr key={r.n} className="border-b border-primary/25">
            <td className="px-3 py-1.5 text-dark/50">{r.n}.</td>
            <td className="px-3 py-1.5">{r.medicine}</td>
            <td className="px-3 py-1.5">{r.dose}</td>
            <td className="px-3 py-1.5">{r.duration}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
