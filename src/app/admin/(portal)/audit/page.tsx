import Link from 'next/link'
import {
  ClipboardList,
  Boxes,
  Sparkles,
  Banknote,
  Star,
  Activity,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  listAuditEntries,
  type AuditEntityType,
} from '@/lib/admin/audit/queries'
import AuditFilterBar from './AuditFilterBar'

export const metadata = { title: 'Audit · Admin' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { entity?: string }
}

const ICONS: Record<AuditEntityType, typeof Activity> = {
  order: ClipboardList,
  stock: Boxes,
  commission: Sparkles,
  payout: Banknote,
  review: Star,
}

const ICON_BG: Record<AuditEntityType, string> = {
  order: 'bg-amber-50 text-amber-700',
  stock: 'bg-blue-50 text-blue-700',
  commission: 'bg-purple-50 text-purple-700',
  payout: 'bg-emerald-50 text-emerald-700',
  review: 'bg-pink-50 text-pink-700',
}

export default async function AdminAuditPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const entity = (searchParams.entity as AuditEntityType | 'all') ?? 'all'
  const entries = await listAuditEntries(supabase, { entity, limit: 200 })

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <header>
        <span className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B58A3B]">
          Activity ledger
        </span>
        <h1 className="mt-2 font-heading text-[28px] font-bold leading-tight text-[#006B3C]">
          Audit log
        </h1>
        <p className="mt-1 font-body text-[13px] text-[#12372D]/65">
          Unified timeline of order events, stock movements, commissions, payouts,
          and review moderations. Read-only.
        </p>
      </header>

      <AuditFilterBar active={entity} />

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#006B3C]/15 p-12 text-center font-body text-sm italic text-[#12372D]/55">
          No events in this view.
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
          {entries.map((e) => {
            const Icon = ICONS[e.entity] ?? Activity
            const bg = ICON_BG[e.entity] ?? 'bg-slate-50 text-slate-700'
            return (
              <li
                key={`${e.entity}-${e.id}`}
                className="flex items-start gap-3 rounded-2xl border border-[#006B3C]/8 bg-white p-3.5"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-heading text-[13px] font-semibold text-[#006B3C]">
                      {e.title}
                    </h3>
                    <time className="text-[11px] text-[#12372D]/55">
                      {new Date(e.createdAt).toLocaleString('en-MY')}
                    </time>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-[#12372D]/75">{e.detail}</p>
                  {e.actorName || e.href ? (
                    <p className="mt-1 text-[11px] text-[#12372D]/55">
                      {e.actorName ? <>by <strong>{e.actorName}</strong></> : null}
                      {e.actorName && e.href ? ' · ' : null}
                      {e.href ? (
                        <Link href={e.href} className="font-semibold text-[#B58A3B] hover:underline">
                          Open →
                        </Link>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
