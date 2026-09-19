import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { PDFDocument } from 'pdf-lib'
import { requireAdminSession } from '@/lib/admin/orders/actions'
import { getAdminOrderById } from '@/lib/admin/orders/queries'
import { createClient } from '@/lib/supabase/server'
import AddressLabelDocument from '@/lib/invoice/AddressLabelDocument'
import PackingSlipDocument from '@/lib/invoice/PackingSlipDocument'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SENDER = {
  name: 'Ayurvedic Wellness Centre',
  addressLine: '12 Jln Tun Sambanthan 4, Brickfields, 50470 Kuala Lumpur',
  phone: '+6011-6339 3436',
}

export async function GET(req: Request) {
  try {
    await requireAdminSession()
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const ids = (url.searchParams.get('ids') ?? '').split(',').filter(Boolean)
  const type = (url.searchParams.get('type') ?? 'label') as 'label' | 'slip'

  if (ids.length === 0) return NextResponse.json({ error: 'no_ids' }, { status: 400 })
  if (ids.length > 100) return NextResponse.json({ error: 'too_many_ids' }, { status: 400 })
  if (type !== 'label' && type !== 'slip')
    return NextResponse.json({ error: 'bad_type' }, { status: 400 })

  const supabase = await createClient()
  const orders = await Promise.all(ids.map((id) => getAdminOrderById(supabase, id)))
  const valid = orders.filter(Boolean)
  if (valid.length === 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const merged = await PDFDocument.create()

  for (const orderRaw of valid) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o: any = orderRaw
    const ship = Array.isArray(o.shipping_address) ? o.shipping_address[0] : o.shipping_address
    const cust = Array.isArray(o.customer) ? o.customer[0] : o.customer
    if (!ship) continue

    const buf =
      type === 'label'
        ? await renderToBuffer(
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
        : await renderToBuffer(
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

    const src = await PDFDocument.load(buf)
    const copied = await merged.copyPages(src, src.getPageIndices())
    copied.forEach((p) => merged.addPage(p))
  }

  const out = await merged.save()
  return new NextResponse(new Uint8Array(out), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="batch-${type}-${valid.length}.pdf"`,
    },
  })
}
