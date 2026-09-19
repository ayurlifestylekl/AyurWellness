import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { requireAdminSession } from '@/lib/admin/orders/actions'
import { getAdminOrderById } from '@/lib/admin/orders/queries'
import { createClient } from '@/lib/supabase/server'
import AddressLabelDocument from '@/lib/invoice/AddressLabelDocument'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SENDER = {
  name: 'Ayurvedic Wellness Centre',
  addressLine: '12 Jln Tun Sambanthan 4, Brickfields, 50470 Kuala Lumpur',
  phone: '+6011-6339 3436',
}

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
    return NextResponse.json({ error: 'no_shipping_address' }, { status: 400 })
  }

  const buf = await renderToBuffer(
    <AddressLabelDocument
      shortId={String(o.id).slice(-6).toUpperCase()}
      customerName={cust?.full_name ?? 'Customer'}
      shippingAddress={{
        line1: ship.line1,
        line2: ship.line2,
        city: ship.city,
        state: ship.state,
        postcode: ship.postcode,
        country: ship.country,
      }}
      customerPhone={cust?.phone_number}
      carrier={o.courier_service}
      trackingNumber={o.tracking_number}
      sender={SENDER}
    />
  )

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="label-${o.id.slice(-6)}.pdf"`,
    },
  })
}
