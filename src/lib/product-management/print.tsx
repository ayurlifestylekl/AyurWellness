import 'server-only'
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { PDFDocument } from 'pdf-lib'
import AddressLabelDocument, { type LabelFormat } from '@/lib/invoice/AddressLabelDocument'
import PackingSlipDocument from '@/lib/invoice/PackingSlipDocument'
import { PARCEL_SENDER } from '@/lib/clinic'
import type { ProductOrderDetail } from './queries'

export type PrintType = 'label' | 'slip'

export function parsePrintParams(url: URL): { type: PrintType; format: LabelFormat } {
  const type = url.searchParams.get('type') === 'slip' ? 'slip' : 'label'
  const f = url.searchParams.get('format')
  const format: LabelFormat = f === 'a4' || f === 'thermal' ? f : 'a6'
  return { type, format }
}

function renderOne(order: ProductOrderDetail, type: PrintType, format: LabelFormat) {
  const a = order.address!
  const shippingAddress = { line1: a.line_1, line2: a.line_2, city: a.city, state: a.state, postcode: a.postcode, country: a.country }
  if (type === 'slip') {
    return renderToBuffer(
      <PackingSlipDocument
        orderId={order.id}
        shortId={order.order_number}
        createdAt={order.created_at}
        customer={{ fullName: a.name, phone: a.phone ?? order.phone }}
        shippingAddress={shippingAddress}
        items={order.items.map((i) => ({ sku: i.product_sku, name: i.product_name, quantity: i.quantity }))}
        practitionerNote={null}
      />,
    )
  }
  return renderToBuffer(
    <AddressLabelDocument
      format={format}
      shortId={order.order_number}
      customerName={a.name}
      shippingAddress={shippingAddress}
      customerPhone={a.phone ?? order.phone}
      carrier={order.courier}
      trackingNumber={order.tracking_number}
      sender={PARCEL_SENDER}
    />,
  )
}

/** Renders one PDF containing a page per order; orders without an address are skipped. */
export async function renderProductOrderPdf(orders: ProductOrderDetail[], type: PrintType, format: LabelFormat) {
  const printable = orders.filter((o) => o.address)
  if (printable.length === 1) return { pdf: new Uint8Array(await renderOne(printable[0], type, format)), count: 1 }
  const merged = await PDFDocument.create()
  for (const order of printable) {
    const src = await PDFDocument.load(await renderOne(order, type, format))
    const pages = await merged.copyPages(src, src.getPageIndices())
    pages.forEach((p) => merged.addPage(p))
  }
  return { pdf: new Uint8Array(await merged.save()), count: printable.length }
}

export function pdfResponse(pdf: Uint8Array, filename: string) {
  return new NextResponse(new Uint8Array(pdf), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${filename}"`, 'Cache-Control': 'no-store' },
  })
}
