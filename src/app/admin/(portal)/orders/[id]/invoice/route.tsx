import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { requireAdminSession } from '@/lib/admin/orders/actions'
import { getAdminOrderById } from '@/lib/admin/orders/queries'
import { createClient } from '@/lib/supabase/server'
import InvoiceDocument from '@/lib/invoice/InvoiceDocument'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminSession()
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const order = await getAdminOrderById(supabase, params.id)
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o: any = order
  const cust = Array.isArray(o.customer) ? o.customer[0] : o.customer

  const buf = await renderToBuffer(
    <InvoiceDocument
      order={o}
      customer={{
        fullName: cust?.full_name ?? 'Customer',
        email: cust?.email ?? '',
      }}
    />
  )

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${o.id.slice(-6)}.pdf"`,
    },
  })
}
