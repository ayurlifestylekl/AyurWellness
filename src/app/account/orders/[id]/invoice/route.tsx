import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { createClient } from '@/lib/supabase/server'
import { getOrderById } from '@/lib/dashboard/order-queries'
import InvoiceDocument from '@/lib/invoice/InvoiceDocument'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function shortId(id: string): string {
  return id.slice(-6).toUpperCase()
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const me = await getCurrentUser()
  if (!me) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Only customers download their own receipts. Admins use a separate flow.
  if (me.role !== 'customer') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const id = params.id
  if (!id || id.length < 8) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const supabase = await createClient()
  const order = await getOrderById(supabase, me.authId, id)
  if (!order) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (order.payment_status !== 'paid') {
    return NextResponse.json(
      { error: 'receipt_unavailable', reason: 'Order is not yet paid.' },
      { status: 403 }
    )
  }

  const customer = {
    fullName: me.profile.full_name ?? 'Member',
    email: me.email ?? me.identifier ?? '',
  }

  const buffer = await renderToBuffer(
    <InvoiceDocument order={order} customer={customer} />
  )
  const body = new Uint8Array(buffer)

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="kal-receipt-${shortId(order.id)}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
