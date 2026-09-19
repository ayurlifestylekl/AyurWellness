import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { listLeads, sourceLabel } from '@/lib/admin/leads/queries'

export const metadata = { title: 'Leads · Admin' }
export const dynamic = 'force-dynamic'

function fmt(iso: string) {
  return iso ? new Date(iso).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

export default async function LeadsPage() {
  const supabase = await createClient()
  const leads = await listLeads(supabase)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-[22px] font-extrabold text-primary">Leads</h1>
          <p className="font-body text-[13px] text-dark/55">
            Details captured by the website welcome popup and the WhatsApp button. {leads.length} total.
          </p>
        </div>
        {leads.length > 0 && (
          <a
            href="/admin/leads/export"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-heading text-[11px] font-bold uppercase tracking-[0.16em] text-white hover:bg-accent/90"
          >
            <Download className="h-4 w-4" /> Download (Excel)
          </a>
        )}
      </div>

      {leads.length === 0 ? (
        <p className="rounded-xl border border-dashed border-accent/30 bg-white/60 px-5 py-12 text-center font-body text-[14px] text-dark/50">
          No leads captured yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-accent/20 bg-white">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-accent/20 font-heading text-[10px] uppercase tracking-[0.12em] text-dark/45">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent/10">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-cream/60">
                  <td className="px-4 py-3 font-semibold text-primary">{l.name ?? '—'}</td>
                  <td className="px-4 py-3 text-dark/70">{l.email ?? '—'}</td>
                  <td className="px-4 py-3 text-dark/70">{l.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-accent/25 px-2 py-0.5 font-heading text-[9.5px] uppercase tracking-[0.1em] text-dark/60">
                      {sourceLabel(l.source)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dark/70">{fmt(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
