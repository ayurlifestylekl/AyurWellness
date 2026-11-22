import Image from 'next/image'
import type { Bill } from '@/lib/counter/queries'
import { BALANCE_LABEL, billNoText, cashChange, paymentLabel, rm } from '@/lib/counter/rules'
import { BILL_ISSUER, receiptLineName } from '@/lib/counter/issuer'

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', ...opts })

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #bill-receipt, #bill-receipt * { visibility: visible !important; }
  #bill-receipt { position: absolute; inset: 0 auto auto 0; width: 100%; border: none !important; box-shadow: none !important; border-radius: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: A4; margin: 12mm; }
}`

/** A counter bill as the customer's receipt, in the centre's receipt layout. */
export default function BillReceipt({ bill, patientNo }: { bill: Bill; patientNo: string | null }) {
  const paid = bill.status === 'paid'
  const change = bill.paymentMethod === 'cash' && bill.amountReceivedRm != null ? cashChange(bill.amountPaidRm, bill.amountReceivedRm) : null
  const stamp = paid && bill.outstandingRm > 0
    ? { label: 'BALANCE DUE', cls: 'border-amber-600 text-amber-600' }
    : paid
    ? { label: 'PAID', cls: 'border-emerald-700 text-emerald-700' }
    : bill.status === 'void'
      ? { label: 'VOID', cls: 'border-red-600 text-red-600' }
      : { label: 'NOT PAID', cls: 'border-amber-600 text-amber-600' }

  return (
    <article id="bill-receipt" className="relative overflow-hidden rounded-2xl border border-primary/10 bg-white text-dark shadow-sm">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div className="h-2 bg-primary" />
      <div className="h-[3px] bg-accent" />

      <div className="px-7 py-8 sm:px-10">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Image src={BILL_ISSUER.logo.src} alt={BILL_ISSUER.tradingName} width={BILL_ISSUER.logo.width} height={BILL_ISSUER.logo.height} style={{ width: BILL_ISSUER.logo.displayWidth, height: 'auto' }} priority />
              {BILL_ISSUER.logo.withName && <span className="font-heading text-[20px] font-bold leading-tight text-primary">{BILL_ISSUER.tradingName}</span>}
            </div>
            <div className="mt-3 font-body text-[11.5px] leading-[1.55] text-dark/65">
              <div className="font-semibold text-dark">{BILL_ISSUER.legalName}</div>
              <div>Reg. No: {BILL_ISSUER.regNo}</div>
              {BILL_ISSUER.addressLines.map((l) => <div key={l}>{l}</div>)}
              <div>{BILL_ISSUER.phones.join(' · ')}</div>
              <div>{BILL_ISSUER.email}</div>
            </div>
          </div>
          <div className="sm:text-right">
            <div className="font-heading text-[28px] font-extrabold tracking-[0.08em] text-primary">RECEIPT</div>
            <dl className="mt-2 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 font-body text-[12.5px] sm:justify-end">
              <dt className="text-dark/50">Receipt No.</dt>
              <dd className="font-semibold">{billNoText(bill.billNo)}</dd>
              <dt className="text-dark/50">Date</dt>
              <dd className="font-semibold">{fmt(bill.paidAt ?? bill.createdAt, { dateStyle: 'medium' })}</dd>
            </dl>
            <div className={`mt-3 inline-block -rotate-3 rounded-md border-2 px-3 py-1 font-heading text-[13px] font-extrabold tracking-[0.2em] ${stamp.cls}`}>{stamp.label}</div>
          </div>
        </header>

        <div className="mt-8 grid gap-6 border-t border-dark/10 pt-6 sm:grid-cols-2">
          <div>
            <div className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Billed to</div>
            <div className="mt-1.5 font-body text-[13.5px] leading-[1.6]">
              <div className="font-semibold">{bill.customerName}</div>
              {bill.customerPhone && <div className="text-dark/70">{bill.customerPhone}</div>}
            </div>
          </div>
          {patientNo && (
            <div>
              <div className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Patient ID</div>
              <div className="mt-1.5 font-body text-[13.5px] leading-[1.6]">
                <div className="font-semibold">{patientNo}</div>
                <div className="text-dark/70">Please quote this ID when you book or call us.</div>
              </div>
            </div>
          )}
        </div>

        <table className="mt-8 w-full border-collapse font-body text-[13px]">
          <thead>
            <tr className="bg-primary text-left text-white">
              <th className="px-3 py-2 font-heading text-[10.5px] font-bold uppercase tracking-[0.14em]">Description</th>
              <th className="px-3 py-2 text-center font-heading text-[10.5px] font-bold uppercase tracking-[0.14em]">Qty</th>
              <th className="px-3 py-2 text-right font-heading text-[10.5px] font-bold uppercase tracking-[0.14em]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((i) => (
              <tr key={i.id} className="border-b border-dark/10 align-top">
                <td className="px-3 py-2.5">
                  <div className="font-semibold">{receiptLineName(i.kind, i.description)}</div>
                  {i.kind === 'package' ? (
                    <div className="mt-0.5 text-[12px] text-dark/65">Package session — no charge</div>
                  ) : i.quantity > 1 ? (
                    <div className="mt-0.5 text-[12px] text-dark/65">{i.quantity} × {rm(i.unitPriceRm)}</div>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 text-center">{i.quantity}</td>
                <td className="px-3 py-2.5 text-right">{rm(i.lineTotalRm)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td />
              <td className="px-3 pt-3 text-right text-dark/60">Subtotal</td>
              <td className="px-3 pt-3 text-right">{rm(bill.subtotalRm)}</td>
            </tr>
            {bill.discountRm > 0 && (
              <tr>
                <td />
                <td className="px-3 pt-1 text-right text-dark/60">Discount</td>
                <td className="px-3 pt-1 text-right">− {rm(Math.min(bill.discountRm, bill.subtotalRm))}</td>
              </tr>
            )}
            <tr>
              <td />
              <td className="px-3 pt-1 text-right font-heading text-[14px] font-bold text-primary">Total</td>
              <td className="px-3 pt-1 text-right font-heading text-[16px] font-extrabold text-primary">{rm(bill.totalRm)}</td>
            </tr>
          </tfoot>
        </table>

        {paid && (
          <div className="mt-8 grid gap-6 rounded-xl bg-cream/70 p-5 font-body text-[12.5px] sm:grid-cols-2">
            <Details
              title="Payment"
              rows={[
                ...bill.balanceUses.map((u) => [`Paid from ${BALANCE_LABEL[u.kind].toLowerCase()}`, rm(u.amount)] as [string, string]),
                ...(bill.amountPaidRm > 0 || (!bill.balanceUses.length && !bill.outstandingRm)
                  ? ([['Method', paymentLabel(bill.paymentMethod)], ...(bill.balanceUses.length ? [['Amount paid', rm(bill.amountPaidRm)]] : [])] as [string, string][])
                  : []),
                ...(bill.outstandingRm > 0 ? ([['Left to pay later', rm(bill.outstandingRm)]] as [string, string][]) : []),
                ...(bill.amountReceivedRm != null ? ([['Cash received', rm(bill.amountReceivedRm)], ['Change', rm(change ?? 0)]] as [string, string][]) : []),
                ...(bill.paidAt ? ([['Paid on', fmt(bill.paidAt, { dateStyle: 'medium', timeStyle: 'short' })]] as [string, string][]) : []),
                ...(bill.paidByName ? ([['Served by', bill.paidByName]] as [string, string][]) : []),
              ]}
            />
            {bill.items.some((i) => i.kind === 'package') && (
              <Details
                title="Package"
                rows={bill.items
                  .filter((i) => i.kind === 'package')
                  .map((i) => [i.description.replace(/\s+—\s+session redeemed$/, ''), `${i.quantity} session${i.quantity > 1 ? 's' : ''} used`] as [string, string])}
              />
            )}
          </div>
        )}

        <footer className="mt-8 border-t border-dark/10 pt-4 text-center font-body text-[11px] leading-[1.6] text-dark/55">
          <div className="font-semibold text-primary">Thank you for choosing {BILL_ISSUER.tradingName}.</div>
          <div>{BILL_ISSUER.bookingLine}</div>
          <div>This is a computer-generated receipt — no signature is required. · {BILL_ISSUER.website}</div>
        </footer>
      </div>
    </article>
  )
}

function Details({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div>
      <div className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-accent">{title}</div>
      <dl className="mt-2 space-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-dark/55">{k}</dt>
            <dd className="text-right font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
