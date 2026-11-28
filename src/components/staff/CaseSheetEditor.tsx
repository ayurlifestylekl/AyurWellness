'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SHEETS, type CaseSheetData, type CaseSheetKind, type PrescriptionRow } from '@/lib/staff/case-sheets'
import { saveCaseSheet } from '@/lib/staff/patient-file-actions'

interface Props {
  patientId: string
  kind: CaseSheetKind
  sheetId?: string
  initialDate: string
  initialData: CaseSheetData
  today: string
  header: { name: string; ageGender: string; registrationNo: string | null }
  cancelHref: string
  /** Where to go after saving; gets the sheet id appended. */
  viewBase: string
  /** Product names offered while typing a medicine, so the front desk can bill it. */
  medicineOptions?: string[]
}

/** Fill in or edit a primary / follow-up case sheet, laid out like the doctors' paper form. */
export default function CaseSheetEditor({ patientId, kind, sheetId, initialDate, initialData, today, header, cancelHref, viewBase, medicineOptions = [] }: Props) {
  const router = useRouter()
  const sheet = SHEETS[kind]
  const [date, setDate] = useState(initialDate)
  const [data, setData] = useState<CaseSheetData>(initialData)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  // Don't lose a half-written sheet to a stray tab close.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const setText = (key: string, value: string) => { setData((d) => ({ ...d, [key]: value })); setDirty(true) }
  const setCell = (key: string, i: number, col: keyof PrescriptionRow, value: string) => {
    setData((d) => {
      const rows = [...((d[key] as PrescriptionRow[]) ?? [])]
      rows[i] = { ...rows[i], [col]: value }
      return { ...d, [key]: rows }
    })
    setDirty(true)
  }

  const save = () => {
    setError(null)
    start(async () => {
      const res = await saveCaseSheet({ id: sheetId, patientId, kind, sheetDate: date, data })
      if (!res.ok) { setError(res.error); return }
      setDirty(false)
      router.push(`${viewBase}/${res.id}`)
      router.refresh()
    })
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-center font-heading text-[22px] font-extrabold uppercase tracking-wide text-primary">{sheet.title}</h1>

      <dl className="mt-4 grid gap-x-6 border-y border-accent/20 py-2 font-body text-[13.5px] sm:grid-cols-2">
        <Row label="Patient name">{header.name}</Row>
        <Row label="Age / Gender">{header.ageGender || '—'}</Row>
        <Row label="Registration no">{header.registrationNo ?? '—'}</Row>
        <Row label="Date">
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => { setDate(e.target.value); setDirty(true) }}
            className="rounded-md border border-accent/30 bg-white px-2 py-1 font-body text-[13.5px] focus:border-accent focus:outline-none"
          />
        </Row>
      </dl>

      <div className="mt-6 space-y-6">
        {sheet.sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 font-heading text-[13px] font-bold uppercase tracking-[0.06em] text-primary">{section.title}</h2>
            {section.kind === 'prescription' ? (
              <div className="overflow-x-auto rounded-lg border border-accent/25">
                <table className="w-full min-w-[560px] border-collapse font-body text-[13px]">
                  <thead>
                    <tr className="bg-primary text-left text-white">
                      <th className="w-12 px-3 py-2 font-semibold">S.No.</th>
                      <th className="px-3 py-2 font-semibold">Medicine / Formulation name</th>
                      <th className="px-3 py-2 font-semibold">Dose &amp; timing (Anupana)</th>
                      <th className="w-36 px-3 py-2 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Products the centre sells, suggested while typing: picking one lets the front desk bill it in one tap. */}
                    {medicineOptions.length > 0 && (
                      <tr className="hidden"><td><datalist id="centre-medicines">{medicineOptions.map((m) => <option key={m} value={m} />)}</datalist></td></tr>
                    )}
                    {((data[section.key] as PrescriptionRow[]) ?? []).map((r, i) => (
                      <tr key={i} className="border-t border-accent/15">
                        <td className="px-3 py-1.5 text-dark/50">{i + 1}.</td>
                        {(['medicine', 'dose', 'duration'] as const).map((col) => (
                          <td key={col} className="px-1.5 py-1">
                            <input
                              value={r[col]}
                              onChange={(e) => setCell(section.key, i, col, e.target.value)}
                              aria-label={`Row ${i + 1} ${col}`}
                              list={col === 'medicine' && medicineOptions.length ? 'centre-medicines' : undefined}
                              className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 hover:border-accent/20 focus:border-accent focus:bg-white focus:outline-none"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : section.kind === 'pariksha' ? (
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {section.fields.map((f) => (
                  <label key={f.key} className="flex items-center gap-3 border-b border-accent/15 py-1">
                    <span className="w-44 flex-none font-body text-[13px] text-dark/70">{f.label}</span>
                    <input
                      value={(data[f.key] as string) ?? ''}
                      onChange={(e) => setText(f.key, e.target.value)}
                      className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 font-body text-[13.5px] hover:border-accent/20 focus:border-accent focus:bg-white focus:outline-none"
                    />
                  </label>
                ))}
              </div>
            ) : (
              <div className={`grid gap-4 ${section.fields.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                {section.fields.map((f) => (
                  <label key={f.key} className="block">
                    {section.fields.length > 1 && <span className="mb-1 block font-body text-[12.5px] font-semibold text-dark/70">• {f.label}</span>}
                    <textarea
                      rows={f.rows ?? 4}
                      value={(data[f.key] as string) ?? ''}
                      onChange={(e) => setText(f.key, e.target.value)}
                      aria-label={f.label}
                      className="w-full rounded-lg border border-primary/40 bg-white px-3 py-2 font-body text-[14px] leading-relaxed text-dark focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                    />
                  </label>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {error && <p className="mt-6 rounded-lg border border-red-300 bg-red-50 px-3 py-2 font-body text-[13px] text-red-700">{error}</p>}

      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-3 border-t border-accent/20 bg-cream/95 py-3 backdrop-blur">
        <button onClick={save} disabled={pending} className="rounded-lg bg-accent px-6 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-white hover:bg-accent/90 disabled:opacity-60">
          {pending ? 'Saving…' : sheetId ? 'Save changes' : 'Save sheet'}
        </button>
        <Link href={cancelHref} className="rounded-lg border border-accent/30 px-5 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-dark/60 hover:text-primary">
          Cancel
        </Link>
        {dirty && <span className="font-body text-[12px] italic text-dark/50">Unsaved changes</span>}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-accent/10 py-1.5 last:border-0 sm:[&:nth-last-child(2)]:border-0">
      <dt className="w-32 flex-none font-semibold text-primary">{label}:</dt>
      <dd className="text-dark">{children}</dd>
    </div>
  )
}
