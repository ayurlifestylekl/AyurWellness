import { NextResponse } from 'next/server'
import { requireProductManagementSession } from '@/lib/product-management/actions'
import { buildJtIntlRows, buildJtIntlWorkbook, buildJtRows, buildJtWorkbook } from '@/lib/fulfilment/jt'
import { loadJtOrders } from '@/lib/fulfilment/jt-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** J&T import file for the ticked orders: Malaysia (default) or international (?kind=intl). */
export async function GET(req: Request) {
  try {
    await requireProductManagementSession()
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const ids = Array.from(new Set((new URL(req.url).searchParams.get('ids') ?? '').split(',').filter((id) => UUID.test(id))))
  if (ids.length === 0) return NextResponse.json({ error: 'no_ids' }, { status: 400 })
  if (ids.length > 300) return NextResponse.json({ error: 'too_many_ids' }, { status: 400 })

  const intl = new URL(req.url).searchParams.get('kind') === 'intl'
  const orders = await loadJtOrders(ids)
  const { rows, skipped } = intl ? buildJtIntlRows(orders) : buildJtRows(orders)
  if (rows.length === 0) {
    const why = skipped.map((s) => `${s.orderNumber}: ${s.reason}`).join('\n') || 'None of these orders are paid.'
    return new NextResponse(`No orders could go in the J&T file.\n\n${why}`, { status: 422, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' })
  // Same name ending as J&T's own template (an .xlsx file named .xls), which its importer accepts.
  const file = intl ? buildJtIntlWorkbook(rows) : buildJtWorkbook(rows)
  return new NextResponse(Buffer.from(file), {
    headers: {
      'Content-Type': 'application/vnd.ms-excel',
      'Content-Disposition': `attachment; filename="JT-${intl ? 'international' : 'bulk-import'}-${day}-${rows.length}-orders.xls"`,
      'Cache-Control': 'no-store',
      'X-JT-Skipped': String(skipped.length),
    },
  })
}
