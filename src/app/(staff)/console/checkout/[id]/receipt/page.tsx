import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Download } from 'lucide-react'
import { requireStaff } from '@/lib/staff/guard'
import { getBill } from '@/lib/counter/queries'
import { getPatientRecord } from '@/lib/staff/patients'
import { formatPatientNo } from '@/lib/staff/patient-id'
import BillReceipt from '@/components/staff/BillReceipt'
import PrintButton from '@/components/staff/PrintButton'

export const dynamic = 'force-dynamic'

export default async function BillReceiptPage({ params }: { params: { id: string } }) {
  const { db } = await requireStaff(['admin', 'front_desk'])
  const bill = await getBill(db, params.id)
  if (!bill) notFound()
  const record = bill.patientId ? await getPatientRecord(db, bill.patientId) : null

  return (
    <div className="mx-auto max-w-[820px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/console/checkout" className="font-heading text-[11px] font-semibold uppercase tracking-[0.12em] text-dark/50 hover:text-primary">← Checkout</Link>
        <div className="flex flex-wrap gap-2">
          {bill.status === 'open' && (
            <Link href={`/console/checkout/${bill.id}`} className="inline-flex h-10 items-center rounded-lg border border-accent/30 px-4 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary hover:bg-cream/60">
              Back to bill
            </Link>
          )}
          <PrintButton />
          <a
            href={`/console/checkout/${bill.id}/pdf`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent px-4 font-heading text-[10.5px] font-bold uppercase tracking-[0.12em] text-white hover:bg-accent/90"
          >
            <Download className="h-4 w-4" /> Download PDF
          </a>
        </div>
      </div>
      <BillReceipt bill={bill} patientNo={formatPatientNo(record?.patientNo)} />
      {record && (
        <p className="mt-3 text-center font-body text-[12.5px] text-dark/55">
          Saved to <Link href={`/console/patients/${record.id}`} className="text-accent underline">{record.fullName}’s profile</Link>.
        </p>
      )}
    </div>
  )
}
