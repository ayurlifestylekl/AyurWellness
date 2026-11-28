import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import type { ServiceDb } from '@/lib/staff/guard'
import { getBill } from '@/lib/counter/queries'
import { getPatientRecord } from '@/lib/staff/patients'
import { formatPatientNo } from '@/lib/staff/patient-id'
import { billNoText } from '@/lib/counter/rules'
import BillReceiptDocument from '@/lib/counter/BillReceiptDocument'

/** The receipt as a PDF download, to send to the customer on WhatsApp (front desk and doctor portals). */
export async function receiptPdfResponse(db: ServiceDb, req: Request, id: string) {
  const bill = await getBill(db, id)
  if (!bill) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const record = bill.patientId ? await getPatientRecord(db, bill.patientId) : null
  // Fonts and the logo are read from this site's own /public folder.
  const assetBase = new URL(req.url).origin
  const buf = await renderToBuffer(<BillReceiptDocument bill={bill} patientNo={formatPatientNo(record?.patientNo)} assetBase={assetBase} />)
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Receipt-${billNoText(bill.billNo)}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
