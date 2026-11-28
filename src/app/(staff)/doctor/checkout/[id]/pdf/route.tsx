import { requireStaff } from '@/lib/staff/guard'
import { receiptPdfResponse } from '@/lib/counter/receipt-pdf-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** The receipt as a PDF download, to send to the customer on WhatsApp. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { db } = await requireStaff(['admin', 'doctor'])
  return receiptPdfResponse(db, req, params.id)
}
