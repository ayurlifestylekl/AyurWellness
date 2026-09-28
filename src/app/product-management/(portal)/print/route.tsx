import { NextResponse } from 'next/server'
import { requireProductManagementSession } from '@/lib/product-management/actions'
import { getProductOrderById } from '@/lib/product-management/queries'
import { parsePrintParams, pdfResponse, renderProductOrderPdf } from '@/lib/product-management/print'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: Request) {
  try {
    await requireProductManagementSession()
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const ids = Array.from(new Set((url.searchParams.get('ids') ?? '').split(',').filter((id) => UUID.test(id))))
  if (ids.length === 0) return NextResponse.json({ error: 'no_ids' }, { status: 400 })
  if (ids.length > 100) return NextResponse.json({ error: 'too_many_ids' }, { status: 400 })

  const orders = (await Promise.all(ids.map((id) => getProductOrderById(id)))).filter((o) => o !== null)
  const { type, format } = parsePrintParams(url)
  const { pdf, count } = await renderProductOrderPdf(orders, type, format)
  if (count === 0) return NextResponse.json({ error: 'nothing_printable' }, { status: 404 })
  return pdfResponse(pdf, `${type}s-${count}.pdf`)
}
