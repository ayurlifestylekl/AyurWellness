/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { requireProductManagementSession } from '@/lib/product-management/actions'
import { createClient as createSb } from '@supabase/supabase-js'
import { CLINIC_LONG_NAME, CLINIC_ADDRESS, CLINIC_PHONE_PRIMARY } from '@/lib/clinic'

export const dynamic = 'force-dynamic'

function admin() {
  return createSb(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (i, init) => fetch(i, { ...init, cache: 'no-store' }) },
    },
  )
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireProductManagementSession()
  } catch {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') === 'thermal' ? 'thermal' : 'a4'

  const sb = admin()
  const { data: order } = await sb
    .from('product_orders')
    .select(
      'order_number, created_at, product_order_items(product_name, quantity), product_order_addresses(name, line_1, line_2, city, postcode, state, country)',
    )
    .eq('id', params.id)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'order not found' }, { status: 404 })
  }

  const doc = await PDFDocument.create()
  const width = format === 'thermal' ? 4 * 72 : 8.27 * 72
  const height = format === 'thermal' ? 6 * 72 : 11.69 * 72
  const page = doc.addPage([width, height])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const black = rgb(0.1, 0.1, 0.1)
  const grey = rgb(0.35, 0.35, 0.35)

  const address = (order.product_order_addresses as any[])[0]
  const items = order.product_order_items as any[]

  let y = height - 36

  // Header
  page.drawText(CLINIC_LONG_NAME, { x: 36, y, font: bold, size: 14, color: black })
  y -= 18
  page.drawText(CLINIC_ADDRESS, { x: 36, y, font, size: 9, color: grey })
  y -= 12
  page.drawText(CLINIC_PHONE_PRIMARY, { x: 36, y, font, size: 9, color: grey })
  y -= 28

  // Recipient
  page.drawText('SHIP TO', { x: 36, y, font: bold, size: 10, color: black })
  y -= 16
  page.drawText(address?.name ?? '', { x: 36, y, font: bold, size: 12, color: black })
  y -= 16
  page.drawText(address?.line_1 ?? '', { x: 36, y, font, size: 11, color: black })
  y -= 14
  if (address?.line_2) {
    page.drawText(address.line_2, { x: 36, y, font, size: 11, color: black })
    y -= 14
  }
  page.drawText(
    `${address?.postcode ?? ''} ${address?.city ?? ''}, ${address?.state ?? ''}, ${address?.country ?? ''}`,
    { x: 36, y, font, size: 11, color: black },
  )
  y -= 28

  // Order metadata
  page.drawText(`Order: ${order.order_number}`, { x: 36, y, font: bold, size: 11, color: black })
  y -= 14
  page.drawText(`Date: ${new Date(order.created_at).toLocaleDateString('en-MY')}`, { x: 36, y, font, size: 10, color: grey })
  y -= 28

  // Items
  page.drawText('ITEMS', { x: 36, y, font: bold, size: 10, color: black })
  y -= 16
  items.forEach((item) => {
    page.drawText(`${item.product_name} × ${item.quantity}`, { x: 36, y, font, size: 10, color: black })
    y -= 14
  })

  const pdfBytes = await doc.save()
  const filename = `label-${order.order_number}-${format}.pdf`
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
