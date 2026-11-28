import Link from 'next/link'
import type { Bill } from '@/lib/counter/queries'
import { billNoText, rm } from '@/lib/counter/rules'

const day = (iso: string) => new Date(iso).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', day: 'numeric', month: 'short', year: 'numeric' })

/** Bills for a patient or a visit: what was bought, and the receipt. */
export default function BillsList({ bills, title = 'Bills', action, base = '/console' }: { bills: Bill[]; title?: string; action?: React.ReactNode; base?: '/console' | '/doctor' }) {
  return (
    <section className="rounded-2xl border border-accent/20 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-[15px] font-bold text-primary">{title}</h2>
        {action}
      </div>
      {bills.length === 0 ? (
        <p className="mt-3 font-body text-[13px] italic text-dark/45">No bills yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-accent/10">
          {bills.map((b) => (
            <li key={b.id}>
              <Link href={b.status === 'open' ? `${base}/checkout/${b.id}` : `${base}/checkout/${b.id}/receipt`} className="block py-2.5 hover:bg-cream/40">
                <div className="flex items-center justify-between gap-3 font-body text-[13px]">
                  <span>
                    <span className="font-semibold text-primary">{day(b.paidAt ?? b.createdAt)}</span>
                    <span className="ml-2 text-dark/50">{billNoText(b.billNo)}</span>
                    {b.status === 'open' && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 font-heading text-[9.5px] font-bold uppercase tracking-wide text-amber-800">Not paid</span>}
                  </span>
                  <span className="font-semibold tabular-nums">{rm(b.status === 'paid' ? b.totalRm : Math.max(0, b.items.reduce((s, i) => s + i.lineTotalRm, 0) - b.discountRm))}</span>
                </div>
                <p className="mt-0.5 font-body text-[12px] text-dark/55">
                  {b.items.map((i) => (i.quantity > 1 ? `${i.description} ×${i.quantity}` : i.description)).join(' · ') || 'No items'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
