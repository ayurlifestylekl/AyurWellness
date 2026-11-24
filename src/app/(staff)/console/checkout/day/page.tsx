import Link from 'next/link'
import { requireStaff } from '@/lib/staff/guard'
import { getDayReport, recentDays } from '@/lib/counter/day-queries'
import { cashDifference, type DaySummary } from '@/lib/counter/day'
import { rm } from '@/lib/counter/rules'
import { mytDayKey } from '@/lib/datetime'
import { BILL_ISSUER } from '@/lib/counter/issuer'
import PrintButton from '@/components/staff/PrintButton'
import { CloseDayForm, OpenDayForm, ReopenDayButton } from '@/components/staff/DayCloseForms'

export const dynamic = 'force-dynamic'

const longDay = (d: string) => new Date(`${d}T12:00:00+08:00`).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const shortDay = (d: string) => new Date(`${d}T12:00:00+08:00`).toLocaleDateString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', weekday: 'short', day: 'numeric', month: 'short' })
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: 'numeric', minute: '2-digit' })

/** Open and close the counter for a day: cash float, money taken, cash count. */
export default async function DayClosePage({ searchParams }: { searchParams: { date?: string } }) {
  const { db, role } = await requireStaff(['admin', 'front_desk'])
  const today = mytDayKey(new Date())
  const day = searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date) && searchParams.date <= today ? searchParams.date : today
  const [report, days] = await Promise.all([getDayReport(db, day), recentDays(db)])
  const rec = report.record
  const closed = !!rec?.closedAt
  const figures: DaySummary = closed && rec?.summary ? rec.summary : report.live

  return (
    <div className="space-y-6">
      <style>{`@media print { body * { visibility: hidden !important; } .day-report, .day-report * { visibility: visible !important; } .day-report { position: absolute; inset: 0 auto auto 0; width: 100%; } .no-print { display: none !important; } @page { size: A4; margin: 14mm; } }`}</style>
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/console/checkout" className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-dark/50 hover:text-primary">← Checkout</Link>
          <h1 className="mt-2 font-heading text-[22px] font-extrabold text-primary">Day close</h1>
          <p className="font-body text-[13px] text-dark/55">Open the counter with the cash float, then count the cash at closing.</p>
        </div>
        <form className="flex items-center gap-2">
          <input type="date" name="date" defaultValue={day} max={today} className="rounded-lg border border-accent/30 bg-white px-3 py-1.5 font-body text-[13px]" />
          <button className="rounded-lg border border-accent/30 px-3 py-1.5 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary hover:bg-cream/60">Show</button>
        </form>
      </div>

      {!report.ready ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 font-body text-[13.5px] text-amber-800">
          Day close isn’t set up on the database yet. Please ask your developer to finish the setup.
        </p>
      ) : (
        <>
          <section className="no-print rounded-2xl border border-accent/20 bg-white p-4">
            {!rec ? (
              <>
                <h2 className="mb-3 font-heading text-[15px] font-bold text-primary">{longDay(day)} — not opened yet</h2>
                <OpenDayForm day={day} />
              </>
            ) : closed ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-body text-[13.5px] text-dark/70">
                  Closed {time(rec.closedAt!)}{rec.closedByName ? ` by ${rec.closedByName}` : ''}.
                  {report.paidAfterClose > 0 && <span className="ml-1 font-semibold text-amber-800">{report.paidAfterClose} bill{report.paidAfterClose > 1 ? 's were' : ' was'} paid after closing — reopen and close again to include {report.paidAfterClose > 1 ? 'them' : 'it'}.</span>}
                </p>
                <div className="flex gap-2">
                  <PrintButton />
                  {role === 'admin' && <ReopenDayButton day={day} />}
                </div>
              </div>
            ) : (
              <>
                <h2 className="mb-3 font-heading text-[15px] font-bold text-primary">Close {longDay(day)}</h2>
                <CloseDayForm day={day} expectedRm={report.expectedCashRm} />
              </>
            )}
          </section>

          <article className="day-report rounded-2xl border border-accent/20 bg-white p-6">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-accent/15 pb-3">
              <div>
                <p className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-accent">{BILL_ISSUER.tradingName}</p>
                <h2 className="font-heading text-[18px] font-extrabold text-primary">Day report · {longDay(day)}</h2>
              </div>
              <span className={`rounded-full px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-[0.14em] ${closed ? 'bg-emerald-100 text-emerald-800' : rec ? 'bg-amber-100 text-amber-800' : 'bg-cream text-dark/55'}`}>
                {closed ? 'Closed' : rec ? 'Open' : 'Not opened'}
              </span>
            </header>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <Stat label="Bills paid" value={String(figures.billCount)} />
              <Stat label={figures.depositsRm ? `Sales · + ${rm(figures.depositsRm)} deposits` : 'Sales'} value={rm(figures.salesRm)} />
              <Stat label="Money taken" value={rm(figures.takenRm)} />
              <Stat label="Cash taken" value={rm(figures.cashInRm)} />
            </div>

            <h3 className="mt-6 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-dark/60">Money taken by method</h3>
            {figures.takenByMethod.length === 0 ? (
              <p className="mt-2 font-body text-[13px] italic text-dark/45">Nothing taken.</p>
            ) : (
              <table className="mt-2 w-full font-body text-[13px]">
                <thead>
                  <tr className="border-b border-accent/20 text-left text-dark/55">
                    <th className="py-1.5 font-semibold">Method</th>
                    <th className="py-1.5 text-right font-semibold">Bills</th>
                    <th className="py-1.5 text-right font-semibold">Deposits, gift cards, settled</th>
                    <th className="py-1.5 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {figures.takenByMethod.map((m) => (
                    <tr key={m.method} className="border-b border-accent/10">
                      <td className="py-1.5">{m.label}</td>
                      <td className="py-1.5 text-right tabular-nums">{rm(m.billsRm)}</td>
                      <td className="py-1.5 text-right tabular-nums">{rm(m.otherRm)}</td>
                      <td className="py-1.5 text-right font-semibold tabular-nums">{rm(m.totalRm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <dl className="mt-6 grid gap-x-8 gap-y-1.5 font-body text-[13px] sm:grid-cols-2">
              <Line k="Discounts given" v={rm(figures.discountRm)} />
              <Line k="Paid from patient balances" v={rm(figures.balanceUsedRm)} />
              <Line k="Left to pay later (owed)" v={rm(figures.outstandingAddedRm)} />
              <Line k="Services" v={String(figures.servicesCount)} />
              <Line k="Package sessions redeemed" v={String(figures.packageSessions)} />
            </dl>

            {figures.productsSold.length > 0 && (
              <>
                <h3 className="mt-6 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-dark/60">Products sold</h3>
                <table className="mt-2 w-full font-body text-[13px]">
                  <tbody>
                    {figures.productsSold.map((p) => (
                      <tr key={p.name} className="border-b border-accent/10">
                        <td className="py-1.5">{p.name}</td>
                        <td className="py-1.5 text-right tabular-nums">× {p.quantity}</td>
                        <td className="w-32 py-1.5 text-right tabular-nums">{rm(p.amountRm)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {rec && (
              <>
                <h3 className="mt-6 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-dark/60">Cash drawer</h3>
                <dl className="mt-2 grid gap-x-8 gap-y-1.5 font-body text-[13px] sm:grid-cols-2">
                  <Line k={`Opening float${rec.openedByName ? ` (${rec.openedByName}, ${time(rec.openedAt)})` : ''}`} v={rm(rec.openingFloatRm)} />
                  <Line k="Cash taken" v={rm(figures.cashInRm)} />
                  <Line k="Expected in drawer" v={rm(closed ? rec.expectedCashRm ?? 0 : report.expectedCashRm)} />
                  {closed && <Line k="Counted" v={rm(rec.countedCashRm ?? 0)} />}
                  {closed && (
                    <Line
                      k="Difference"
                      v={(() => {
                        const d = cashDifference(rec.countedCashRm ?? 0, rec.expectedCashRm ?? 0)
                        return d === 0 ? 'Balanced' : `${d > 0 ? 'Over' : 'Short'} ${rm(Math.abs(d))}`
                      })()}
                    />
                  )}
                </dl>
                {rec.notes && <p className="mt-3 rounded-lg bg-cream/60 px-3 py-2 font-body text-[13px] text-dark/75">Notes: {rec.notes}</p>}
              </>
            )}
          </article>

          {days.length > 0 && (
            <section className="no-print">
              <h2 className="mb-2 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-dark/60">Recent days</h2>
              <ul className="flex flex-wrap gap-2">
                {days.map((d) => {
                  const diff = d.closed && d.countedCashRm != null && d.expectedCashRm != null ? cashDifference(d.countedCashRm, d.expectedCashRm) : null
                  return (
                    <li key={d.day}>
                      <Link
                        href={`/console/checkout/day?date=${d.day}`}
                        className={`block rounded-lg border px-3 py-1.5 font-body text-[12.5px] ${d.day === day ? 'border-accent bg-cream' : 'border-accent/20 bg-white hover:bg-cream/50'}`}
                      >
                        {shortDay(d.day)} · {d.closed ? (diff === 0 ? 'balanced' : diff != null ? `${diff > 0 ? 'over' : 'short'} ${rm(Math.abs(diff))}` : 'closed') : 'open'}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-accent/15 bg-cream/40 px-4 py-3">
      <div className="font-heading text-[9.5px] font-bold uppercase tracking-[0.14em] text-dark/55">{label}</div>
      <div className="mt-1 font-heading text-[18px] font-extrabold tabular-nums text-primary">{value}</div>
    </div>
  )
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-accent/10 py-1">
      <dt className="text-dark/60">{k}</dt>
      <dd className="font-semibold tabular-nums">{v}</dd>
    </div>
  )
}
