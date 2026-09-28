import { NextResponse } from 'next/server'
import { requireProductManagementSession } from '@/lib/product-management/actions'
import { getProductOrderById } from '@/lib/product-management/queries'
import { parsePrintParams, pdfResponse, renderProductOrderPdf } from '@/lib/product-management/print'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireProductManagementSession()
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const order = await getProductOrderById(params.id)
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (!order.address) return NextResponse.json({ error: 'no_shipping_address' }, { status: 400 })

  const { type, format } = parsePrintParams(new URL(req.url))
  const { pdf } = await renderProductOrderPdf([order], type, format)
  return pdfResponse(pdf, `${type}-${order.order_number}.pdf`)
}
