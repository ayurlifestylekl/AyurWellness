'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { parseProductsCsv } from '@/lib/admin/products/csv'
import { importProductsFromCsvText } from '@/lib/admin/products/actions'

export default function CsvImportForm() {
  const router = useRouter()
  const [csv, setCsv] = useState('')
  const [previewErrors, setPreviewErrors] = useState<string[]>([])
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      setCsv(text)
      preview(text)
    }
    reader.readAsText(file)
  }

  function preview(text: string) {
    const { rows, errors } = parseProductsCsv(text)
    setPreviewCount(rows.length)
    setPreviewErrors(errors.map((e) => `Line ${e.line}: ${e.message}`))
  }

  function submit() {
    setResult(null)
    startTransition(async () => {
      const r = await importProductsFromCsvText(csv)
      if (!r.ok) {
        setResult(`Failed: ${r.error}`)
        return
      }
      const d = (r as { ok: true; data?: { imported: number; failed: number; errors: string[] } }).data
      setResult(
        `Imported ${d?.imported ?? 0}, failed ${d?.failed ?? 0}.` +
          (d?.errors.length ? '\n\n' + d.errors.join('\n') : ''),
      )
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <h2 className="font-heading text-[13px] font-semibold text-[#006B3C]">
          Required columns
        </h2>
        <p className="mt-1 text-[12px] text-[#12372D]/65">
          <code>name, sku, price_rm, stock_qty, status</code> — all rows missing any of these
          will be rejected. Optional columns: <code>category, short_description, description,
          ingredients, dosage_instructions, contraindications, certifications,
          dosha_indication, sale_price_rm, member_price_rm, weight_grams,
          low_stock_threshold, expiry_date, tags, meta_title, meta_description, featured,
          allow_backorder, image_url</code>.
        </p>
        <p className="mt-2 text-[12px] text-[#12372D]/65">
          Easiest path: export the current catalog first, edit the CSV, then re-import.
        </p>
      </section>

      <section className="rounded-2xl border border-[#006B3C]/8 bg-white p-4">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          Upload CSV file
        </label>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
          className="mt-2 block w-full text-[12.5px]"
        />
        <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wider text-[#006B3C]/70">
          …or paste CSV text
        </label>
        <textarea
          value={csv}
          onChange={(e) => {
            setCsv(e.target.value)
            preview(e.target.value)
          }}
          rows={6}
          className="mt-2 w-full rounded-lg border border-[#006B3C]/15 px-3 py-2 font-mono text-[11.5px]"
          placeholder="name,sku,price_rm,stock_qty,status&#10;Kesha Oil,KSH-100,85,42,active&#10;…"
        />
        {previewCount !== null ? (
          <p className="mt-2 text-[12px] text-[#12372D]/65">
            Preview: <strong>{previewCount}</strong> valid row{previewCount === 1 ? '' : 's'}
            {previewErrors.length > 0 ? `, ${previewErrors.length} error${previewErrors.length === 1 ? '' : 's'}` : ''}.
          </p>
        ) : null}
        {previewErrors.length > 0 ? (
          <ul className="mt-2 list-disc pl-5 text-[11.5px] text-red-700">
            {previewErrors.slice(0, 10).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
            {previewErrors.length > 10 ? <li>+{previewErrors.length - 10} more…</li> : null}
          </ul>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={pending || !csv || (previewCount ?? 0) === 0}
            onClick={submit}
            className="rounded-lg bg-[#006B3C] px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-[#006B3C] disabled:opacity-50"
          >
            {pending ? 'Importing…' : `Import ${previewCount ?? 0} row(s)`}
          </button>
        </div>

        {result ? (
          <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-[#EDF4E7]/40 p-3 text-[11.5px] text-[#006B3C]">
            {result}
          </pre>
        ) : null}
      </section>
    </div>
  )
}
