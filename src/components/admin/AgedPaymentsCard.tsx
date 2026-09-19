import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import type { AgedPendingOrder } from '@/lib/admin/queries'

function ago(iso: string): string {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  if (hours < 48) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function AgedPaymentsCard({ orders }: { orders: AgedPendingOrder[] }) {
  if (orders.length === 0) return null
  return (
    <article
      className="overflow-hidden rounded-3xl border border-amber-200 bg-amber-50/40"
      style={{
        boxShadow:
          '0 1px 0 0 rgba(0,107,60,0.04), 0 12px 30px -16px rgba(0,107,60,0.18)',
      }}
    >
      <header className="flex items-center gap-2.5 border-b border-amber-200/70 px-5 py-3.5">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
        <div>
          <h2 className="font-heading text-[13px] font-semibold text-amber-900">
            Aged pending payments
          </h2>
          <p className="font-body text-[10.5px] text-amber-800/70">
            More than 24 hours old · likely abandoned
          </p>
        </div>
      </header>
      <ul className="divide-y divide-amber-200/70">
        {orders.map((o) => (
          <li key={o.id}>
            <Link
              href={`/admin/orders/${o.id}`}
              className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-amber-50/70"
            >
              <div className="min-w-0 flex-1">
                <p className="font-heading text-[12.5px] font-semibold text-amber-900">
                  #{o.shortId} · {o.customerName ?? 'Unknown'}
                </p>
                <p className="font-body text-[11px] text-amber-800/70">
                  {ago(o.createdAt)} · RM {o.totalRm.toFixed(2)}
                </p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-amber-700/55" />
            </Link>
          </li>
        ))}
      </ul>
    </article>
  )
}
