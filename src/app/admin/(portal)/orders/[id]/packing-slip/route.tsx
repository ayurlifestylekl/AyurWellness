import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { requireAdminSession } from '@/lib/admin/orders/actions'
import { getAdminOrderById } from '@/lib/admin/orders/queries'
import { createClient } from '@/lib/supabase/server'
import PackingSlipDocument from '@/lib/invoice/PackingSlipDocument'

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
  const ship = Array.isArray(o.shipping_address) ? o.shipping_address[0] : o.shipping_address
  const cust = Array.isArray(o.customer) ? o.customer[0] : o.customer

  if (!ship) {
    return NextResponse.json(
      { error: 'no_shipping_address', detail: 'Order has no shipping address — cannot generate slip.' },
      { status: 400 }
    )
  }

  const buf = await renderToBuffer(
    <PackingSlipDocument
      orderId={o.id}
      shortId={String(o.id).slice(-6).toUpperCase()}
      createdAt={o.created_at}
      customer={{ fullName: cust?.full_name ?? 'Customer', phone: cust?.phone_number }}
      shippingAddress={{
        line1: ship.line1,
        line2: ship.line2,
        city: ship.city,
        state: ship.state,
        postcode: ship.postcode,
        country: ship.country,
      }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items={(o.order_items ?? []).map((it: any) => ({
        sku: it.product?.sku ?? null,
        name: it.product?.name ?? 'Product',
        quantity: it.quantity,
      }))}
      practitionerNote={o.practitioner_note}
    />
  )

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="packing-slip-${o.id.slice(-6)}.pdf"`,
    },
  })
}
