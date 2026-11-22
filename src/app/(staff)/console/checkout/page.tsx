import Link from 'next/link'
import { requireStaff } from '@/lib/staff/guard'
import { listCounterBills, type Bill } from '@/lib/counter/queries'
import { billNoText, paymentLabel, rm, toSen } from '@/lib/counter/rules'
import { mytDayKey } from '@/lib/datetime'
import NewWalkInBill from '@/components/staff/NewWalkInBill'

export const dynamic = 'force-dynamic'

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: 'numeric', minute: '2-digit' })

/** The counter: bills in progress and today's paid bills. */
export default async function CheckoutPage() {
  const { db } = await requireStaff(['admin', 'front_desk'])
  const startOfToday = new Date(`${mytDayKey(new Date())}T00:00:00+08:00`).toISOString()
  const { ready, open, paidToday } = await listCounterBills(db, startOfToday)
  const takenSen = paidToday.reduce((s, b) => s + toSen(b.totalRm), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[22px] font-extrabold text-primary">Checkout</h1>
          <p className="font-body text-[13px] text-dark/55">Bill services, products and package sessions together, then take payment and give the receipt.</p>
        </div>
        <Link href="/console/checkout/day" className="inline-flex h-10 items-center rounded-lg border border-primary/40 px-4 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary hover:bg-cream/60">
          Day open / close
        </Link>
      </div>

      {!ready ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 font-body text-[13.5px] text-amber-800">
          Checkout isn’t set up on the database yet. Please ask your developer to finish the setup.
        </p>
      ) : (
        <>
          <NewWalkInBill />
          <BillTable title="In progress" empty="No open bills." bills={open} href={(b) => `/console/checkout/${b.id}`} when={(b) => time(b.createdAt)} />
          <BillTable
            title={`Paid today · ${paidToday.length} bill${paidToday.length === 1 ? '' : 's'} · ${rm(takenSen / 100)}`}
            empty="Nothing paid yet today."
            bills={paidToday}
            href={(b) => `/console/checkout/${b.id}/receipt`}
            when={(b) => (b.paidAt ? time(b.paidAt) : '')}
            showMethod
          />
        </>
      )}
    </div>
  )
}

function BillTable({ title, empty, bills, href, when, showMethod }: { title: string; empty: string; bills: Bill[]; href: (b: Bill) => string; when: (b: Bill) => string; showMethod?: boolean }) {
  return (
    <section>
      <h2 className="mb-2 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-dark/60">{title}</h2>
      {bills.length === 0 ? (
        <p className="rounded-xl border border-dashed border-accent/30 px-4 py-5 text-center font-body text-[13px] italic text-dark/45">{empty}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-accent/20 bg-white">
          <table className="w-full font-body text-[13px]">
            <tbody className="divide-y divide-accent/10">
              {bills.map((b) => (
                <tr key={b.id} className="hover:bg-cream/40">
                  <td className="px-3 py-2.5"><Link href={href(b)} className="font-semibold text-primary hover:underline">{b.customerName}</Link></td>
                  <td className="px-3 py-2.5 text-dark/55">{billNoText(b.billNo)}</td>
                  <td className="px-3 py-2.5 text-dark/55">{b.items.length} item{b.items.length === 1 ? '' : 's'}</td>
                  {showMethod && <td className="px-3 py-2.5 text-dark/55">{paymentLabel(b.paymentMethod)}</td>}
                  <td className="px-3 py-2.5 text-dark/55">{when(b)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{rm(b.status === 'paid' ? b.totalRm : b.items.reduce((s, i) => s + i.lineTotalRm, 0) - b.discountRm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
